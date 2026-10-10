'use server';

import connectToDatabase from '@/lib/rimal-db';
import Settings from '@/models/Settings';
import Customer from '@/models/Customer';
import { getCurrentSession } from './auth';

export async function getMembershipTiers() {
  try {
    await connectToDatabase();
    const settings = await Settings.findOne({ type: 'memberships' });
    if (settings && settings.config && settings.config.tiers) {
      return settings.config.tiers;
    }
    // Default fallback
    return [
      { name: 'Regular', discount: 0 },
      { name: 'Silver', discount: 5 },
      { name: 'Gold', discount: 10 },
      { name: 'Platinum', discount: 15 }
    ];
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return [];
  }
}

export async function updateMembershipTiers(tiers: any[]) {
  try {
    const auth = await getCurrentSession();
    if (!auth || auth.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    await Settings.findOneAndUpdate(
      { type: 'memberships' },
      { config: { tiers } },
      { upsert: true, new: true }
    );

    return { success: true, message: 'Membership tiers updated successfully' };
  } catch (error) {
    console.error('Error updating tiers:', error);
    return { success: false, error: 'Failed to update membership tiers' };
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
    if (!auth || auth.role !== 'admin') {
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
    if (!auth || auth.role !== 'admin') {
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
