'use server';

import dbConnect from '@/lib/rimal-db';
import Sale from '@/models/Sale';
import Outlet from '@/models/Outlet'; // ensure it gets registered

export async function getSales() {
  try {
    await dbConnect();
    const sales = await Sale.find({})
      .populate('items.productId')
      .populate('outletId', 'name location')
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(sales));
  } catch (error) {
    console.error('Failed to get sales:', error);
    return [];
  }
}
