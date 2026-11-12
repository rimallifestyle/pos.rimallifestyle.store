'use server';

import connectToDatabase from '@/lib/rimal-db';
import Settings from '@/models/Settings';
import Customer from '@/models/Customer';
import { getCurrentSession } from './auth';

export async function getMembershipTiers() {
  try {
    await connectToDatabase();
    const settings = await Settings.findOne({ type: 'memberships' });
    let tiers = settings?.config?.tiers;
    if (tiers && Array.isArray(tiers) && tiers.length > 0) {
      // Ensure one tier is marked as default
      const hasDefault = tiers.some((t: any) => t.isDefault);
      if (!hasDefault) {
        const regularIndex = tiers.findIndex((t: any) => t.name?.toLowerCase() === 'regular');
        const defaultIndex = regularIndex >= 0 ? regularIndex : 0;
        tiers = tiers.map((t: any, idx: number) => ({
          ...t,
          isDefault: idx === defaultIndex
        }));
      }
      return tiers;
    }
    // Default fallback
    return [
      { name: 'Regular', discount: 0, isDefault: true },
      { name: 'Silver', discount: 5, isDefault: false },
      { name: 'Gold', discount: 10, isDefault: false },
      { name: 'Platinum', discount: 15, isDefault: false }
    ];
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return [];
  }
}

export async function getDefaultMembershipTier() {
  try {
    const tiers = await getMembershipTiers();
    const defaultTier = tiers.find((t: any) => t.isDefault) || tiers[0] || { name: 'Regular', discount: 0, isDefault: true };
    return defaultTier;
  } catch (error) {
    console.error('Error getting default membership tier:', error);
    return { name: 'Regular', discount: 0, isDefault: true };
  }
}

export async function updateMembershipTiers(tiers: any[]) {
  try {
    const auth = await getCurrentSession();
    if (!auth || (auth.role as string)?.toLowerCase() !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    // Ensure exactly one tier is marked as default
    let defaultIndex = tiers.findIndex((t: any) => t.isDefault);
    if (defaultIndex === -1 && tiers.length > 0) {
      defaultIndex = 0;
    }

    const cleanedTiers = tiers.map((t: any, idx: number) => ({
      name: t.name,
      discount: Number(t.discount) || 0,
      isDefault: idx === defaultIndex
    }));

    await Settings.findOneAndUpdate(
      { type: 'memberships' },
      { config: { tiers: cleanedTiers } },
      { upsert: true, new: true }
    );

    return { success: true, message: 'Membership tiers updated successfully' };
  } catch (error) {
    console.error('Error updating tiers:', error);
    return { success: false, error: 'Failed to update membership tiers' };
  }
}

export async function setDefaultMembershipTier(tierName: string) {
  try {
    const auth = await getCurrentSession();
    if (!auth || (auth.role as string)?.toLowerCase() !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    const tiers = await getMembershipTiers();
    const updatedTiers = tiers.map((t: any) => ({
      ...t,
      isDefault: t.name === tierName
    }));

    await Settings.findOneAndUpdate(
      { type: 'memberships' },
      { config: { tiers: updatedTiers } },
      { upsert: true, new: true }
    );

    return { success: true, message: `"${tierName}" is now the default membership tier.` };
  } catch (error) {
    console.error('Error setting default tier:', error);
    return { success: false, error: 'Failed to set default tier' };
  }
}

export async function requestCustomerMembership(customerId: string, requestedTier: string, discount: number) {
  try {
    await connectToDatabase();
    await Customer.findByIdAndUpdate(customerId, {
      pendingTier: requestedTier,
      pendingDiscount: discount
    });
    return { success: true, message: 'Membership upgrade requested. Awaiting Admin approval.' };
  } catch (error) {
    console.error('Error requesting membership:', error);
    return { success: false, error: 'Failed to request membership upgrade' };
  }
}

export async function approveCustomerMembership(customerId: string) {
  try {
    const auth = await getCurrentSession();
    if (!auth || (auth.role as string)?.toLowerCase() !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    const customer = await Customer.findById(customerId);
    if (!customer || !customer.pendingTier) {
      return { success: false, error: 'No pending membership found' };
    }

    customer.tier = customer.pendingTier;
    customer.discountPercent = customer.pendingDiscount;
    customer.pendingTier = undefined;
    customer.pendingDiscount = undefined;
    await customer.save();

    return { success: true, message: 'Membership approved successfully' };
  } catch (error) {
    console.error('Error approving membership:', error);
    return { success: false, error: 'Failed to approve membership' };
  }
}

export async function rejectCustomerMembership(customerId: string) {
  try {
    const auth = await getCurrentSession();
    if (!auth || (auth.role as string)?.toLowerCase() !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    await Customer.findByIdAndUpdate(customerId, {
      $unset: { pendingTier: "", pendingDiscount: "" }
    });

    return { success: true, message: 'Membership request rejected' };
  } catch (error) {
    console.error('Error rejecting membership:', error);
    return { success: false, error: 'Failed to reject membership' };
  }
}
