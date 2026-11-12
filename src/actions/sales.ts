'use server';

import dbConnect from '@/lib/rimal-db';
import Sale from '@/models/Sale';
import Outlet from '@/models/Outlet'; // ensure it gets registered
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';

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

export async function deleteSale(id: string) {
  try {
    await dbConnect();
    const sale = await Sale.findById(id);
    if (!sale) {
      return { success: false, error: 'Sale record not found' };
    }

    // If sale was COMPLETED (not refunded), restock items to Product.variants, totalStock, and Inventory
    if (sale.status !== 'REFUNDED' && Array.isArray(sale.items)) {
      for (const item of sale.items) {
        const qty = Number(item.quantity) || 1;

        // 1. Find Product
        let product: any = null;
        if (item.productId) {
          product = await Product.findById(item.productId);
        }
        if (!product && item.sku) {
          product = await Product.findOne({ 'variants.sku': item.sku });
        }

        // Restock Product variant
        if (product && product.variants) {
          const variant = product.variants.find((v: any) => v.sku === item.sku);
          if (variant) {
            variant.quantity = (Number(variant.quantity) || 0) + qty;
          }
          product.totalStock = product.variants.reduce(
            (acc: number, curr: any) => acc + (Number(curr.quantity) || 0),
            0
          );
          await product.save();
        }

        // Restock Inventory
        if (item.sku) {
          const invFilter: any = { sku: item.sku };
          if (sale.outletId) {
            invFilter.outletId = sale.outletId;
          } else {
            invFilter.outletId = null;
          }

          const inv = await Inventory.findOne(invFilter);
          if (inv) {
            inv.quantity = (Number(inv.quantity) || 0) + qty;
            inv.lastRestocked = new Date();
            await inv.save();
          } else if (product) {
            await Inventory.create({
              productId: product._id,
              sku: item.sku,
              outletId: sale.outletId || null,
              quantity: qty,
              lastRestocked: new Date()
            });
          }
        }
      }
    }

    // Delete the sale record from DB
    await Sale.findByIdAndDelete(id);

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete sale:', error);
    return { success: false, error: error.message || 'Database error' };
  }
}
