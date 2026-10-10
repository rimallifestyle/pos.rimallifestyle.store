'use server';

import dbConnect from '@/lib/rimal-db';
import Customer from '@/models/Customer';
import { getMembershipTiers } from './memberships';

export async function getCustomers() {
  try {
    await dbConnect();
    const customers = await Customer.find({}).sort({ createdAt: -1 }).lean();
    
    const tiers = await getMembershipTiers();
    const customersWithDiscounts = customers.map(customer => {
      const tierData = tiers.find((t: any) => t.name === customer.tier);
      if (tierData) {
        customer.discountPercent = Number(tierData.discount);
      }
      return customer;
    });

    return JSON.parse(JSON.stringify(customersWithDiscounts));
  } catch (error) {
    console.error('Failed to get customers:', error);
    return [];
  }
}

export async function checkCustomerMembership(phone: string) {
  try {
    await dbConnect();
    const customer = await Customer.findOne({ phone, isActive: true }).lean();
    if (!customer) return null;
    
    const tiers = await getMembershipTiers();
    const tierData = tiers.find((t: any) => t.name === customer.tier);
    if (tierData) {
      customer.discountPercent = Number(tierData.discount);
    }

    return JSON.parse(JSON.stringify(customer));
  } catch (error) {
    console.error('Failed to check customer:', error);
    return null;
  }
}

export async function createCustomer(data: any) {
  try {
    await dbConnect();
    const existing = await Customer.findOne({ phone: data.phone });
    if (existing) {
      return { success: false, error: 'Customer with this phone number already exists.' };
    }

    const tiers = await getMembershipTiers();
    const tierData = tiers.find((t: any) => t.name === (data.tier || 'Regular'));
    const discount = tierData ? Number(tierData.discount) : 0;

    const customer = await Customer.create({
      name: data.name,
      phone: data.phone,
      email: data.email,
      tier: data.tier || 'Regular',
      discountPercent: discount,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
    
    return { success: true, customer: JSON.parse(JSON.stringify(customer)) };
  } catch (error: any) {
    console.error('Failed to create customer:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCustomer(id: string, data: any) {
  try {
    await dbConnect();
    
    if (data.phone) {
      const existing = await Customer.findOne({ phone: data.phone, _id: { $ne: id } });
      if (existing) {
        return { success: false, error: 'Phone number is already in use by another customer.' };
      }
    }

    const tiers = await getMembershipTiers();
    const tierData = tiers.find((t: any) => t.name === (data.tier || 'Regular'));
    if (tierData) {
      data.discountPercent = Number(tierData.discount);
    }

    const customer = await Customer.findByIdAndUpdate(id, data, { new: true }).lean();
    return { success: true, customer: JSON.parse(JSON.stringify(customer)) };
  } catch (error: any) {
    console.error('Failed to update customer:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await dbConnect();
    await Customer.findByIdAndDelete(id);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete customer:', error);
    return { success: false, error: error.message };
  }
}
