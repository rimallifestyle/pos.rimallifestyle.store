'use server';

import connectToDatabase from '@/lib/rimal-db';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';
import Outlet from '@/models/Outlet';
import Transfer from '@/models/Transfer';
import { sendPushNotification } from '@/lib/onesignal';

export interface WarehouseStockItem {
  id: string;
  productId: string;
  name: string;
  img: string;
  category: string;
  sku: string;
  size: string;
  color: string;
  variant: string;
  warehouseStock: number;
  outletStock: number;
  totalStock: number;
  price: number;
  costPrice: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export async function getWarehouseStock(): Promise<WarehouseStockItem[]> {
  try {
    await connectToDatabase();
    const products = await Product.find({ isActive: true }).sort({ title: 1 }).lean();
    const inventories = await Inventory.find({}).lean();

    const stockItems: WarehouseStockItem[] = [];

    for (const p of products as any[]) {
      if (!p.variants || p.variants.length === 0) continue;

      for (const v of p.variants) {
        // Master warehouse stock
        const whItem = inventories.find(
          (i: any) => i.productId?.toString() === p._id.toString() && i.sku === v.sku && (i.outletId === null || i.outletId === undefined)
        );
        const warehouseStock = whItem ? Number(whItem.quantity) || 0 : (Number(v.quantity) || 0);

        // Outlets stock
        const outletItems = inventories.filter(
          (i: any) => i.productId?.toString() === p._id.toString() && i.sku === v.sku && i.outletId !== null && i.outletId !== undefined
        );
        const outletStock = outletItems.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 0), 0);

        // Variant Label
        const hasColor = v.color && v.color !== 'Standard' && v.color.trim() !== '';
        const hasSize = v.size && v.size.trim() !== '';
        let variantLabel = 'Standard';
        if (hasColor && hasSize) {
          variantLabel = `${v.color} / ${v.size}`;
        } else if (hasSize) {
          variantLabel = `Size: ${v.size}`;
        } else if (hasColor) {
          variantLabel = v.color;
        }

        stockItems.push({
          id: `${p._id.toString()}_${v.sku}`,
          productId: p._id.toString(),
          name: p.title,
          img: p.imageUrl || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=150&q=80',
          category: p.category || 'General',
          sku: v.sku,
          size: v.size || 'Free Size',
          color: v.color || 'Standard',
          variant: variantLabel,
          warehouseStock,
          outletStock,
          totalStock: warehouseStock + outletStock,
          price: Number(v.price) || 0,
          costPrice: Number(v.costPrice) || 0,
          isLowStock: warehouseStock <= 10 && warehouseStock > 0,
          isOutOfStock: warehouseStock <= 0,
        });
      }
    }

    return JSON.parse(JSON.stringify(stockItems));
  } catch (error) {
    console.error('Failed to get warehouse stock:', error);
    return [];
  }
}

export async function getWarehouseMetrics() {
  try {
    await connectToDatabase();
    const stockItems = await getWarehouseStock();
    const transfersCount = await Transfer.countDocuments();

    const masterStock = stockItems.reduce((acc, curr) => acc + curr.warehouseStock, 0);
    const outletStock = stockItems.reduce((acc, curr) => acc + curr.outletStock, 0);
    const lowStockCount = stockItems.filter(s => s.isLowStock || s.isOutOfStock).length;
    const totalSkus = stockItems.length;

    return {
      masterStock,
      outletStock,
      lowStockCount,
      transfersCount,
      totalSkus,
    };
  } catch (error) {
    console.error('Failed to get warehouse metrics:', error);
    return {
      masterStock: 0,
      outletStock: 0,
      lowStockCount: 0,
      transfersCount: 0,
      totalSkus: 0,
    };
  }
}

export async function adjustWarehouseStock(data: {
  productId: string;
  sku: string;
  quantity: number;
  mode: 'set' | 'add' | 'subtract';
  reason?: string;
}) {
  try {
    await connectToDatabase();
    const { productId, sku, quantity, mode } = data;

    // Get current inventory
    const currentInv = await Inventory.findOne({ productId, sku, outletId: null });
    const currentQty = currentInv ? currentInv.quantity : 0;

    let newQty = quantity;
    if (mode === 'add') {
      newQty = currentQty + quantity;
    } else if (mode === 'subtract') {
      newQty = Math.max(0, currentQty - quantity);
    } else {
      newQty = Math.max(0, quantity);
    }

    // Update master warehouse inventory
    await Inventory.findOneAndUpdate(
      { productId, sku, outletId: null },
      { $set: { quantity: newQty, lastRestocked: new Date() } },
      { upsert: true, new: true }
    );

    // Synchronize variant quantity inside the Product document
    const product = await Product.findById(productId);
    if (product && product.variants) {
      let variantFound = false;
      product.variants.forEach((v: any) => {
        if (v.sku === sku) {
          v.quantity = newQty;
          variantFound = true;
        }
      });
      if (variantFound) {
        product.totalStock = product.variants.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 0), 0);
        await product.save();
      }
    }

    return { success: true, newQuantity: newQty };
  } catch (error: any) {
    console.error('Failed to adjust warehouse stock:', error);
    return { success: false, error: error.message };
  }
}

export async function dispatchToOutlet(data: {
  outletId: string;
  items: {
    productId: string;
    sku: string;
    name: string;
    variant: string;
    quantity: number;
  }[];
  notes?: string;
  driver?: string;
}) {
  try {
    await connectToDatabase();
    const { outletId, items, notes, driver } = data;

    if (!items || items.length === 0) {
      return { success: false, error: 'No items selected for dispatch.' };
    }

    const outlet = await Outlet.findById(outletId);
    if (!outlet) {
      return { success: false, error: 'Target outlet not found.' };
    }

    // 1. Verify stock availability in Master Warehouse
    for (const item of items) {
      const inv = await Inventory.findOne({ productId: item.productId, sku: item.sku, outletId: null });
      const available = inv ? inv.quantity : 0;
      if (available < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.name} (${item.sku}). Available: ${available}, Requested: ${item.quantity}`,
        };
      }
    }

    // 2. Perform stock transfer
    let totalDispatched = 0;
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      totalDispatched += qty;

      // Deduct from master warehouse
      await Inventory.findOneAndUpdate(
        { productId: item.productId, sku: item.sku, outletId: null },
        { $inc: { quantity: -qty }, $set: { updatedAt: new Date() } }
      );

      // Add to destination outlet
      await Inventory.findOneAndUpdate(
        { productId: item.productId, sku: item.sku, outletId: outletId },
        {
          $inc: { quantity: qty },
          $set: { lastRestocked: new Date(), updatedAt: new Date() },
        },
        { upsert: true, new: true }
      );

      // Update Product variant master quantity
      const whAfter = await Inventory.findOne({ productId: item.productId, sku: item.sku, outletId: null });
      const newWhQty = whAfter ? whAfter.quantity : 0;
      await Product.updateOne(
        { _id: item.productId, 'variants.sku': item.sku },
        { $set: { 'variants.$.quantity': newWhQty } }
      );
    }

    // Recalculate totalStock on affected products
    const uniqueProductIds = Array.from(new Set(items.map(i => i.productId)));
    for (const pid of uniqueProductIds) {
      const p = await Product.findById(pid);
      if (p && p.variants) {
        p.totalStock = p.variants.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 0), 0);
        await p.save();
      }
    }

    // 3. Create Transfer record
    const transferNumber = `TRF-${Math.floor(100000 + Math.random() * 900000)}`;
    const transfer = await Transfer.create({
      transferNumber,
      destinationOutletId: outletId,
      items: items.map(i => ({
        productId: i.productId,
        sku: i.sku,
        name: i.name,
        variant: i.variant,
        quantity: i.quantity,
      })),
      totalItems: totalDispatched,
      status: 'COMPLETED',
      notes: notes || '',
      driver: driver || 'Warehouse Team',
    });

    // 4. Send notification
    try {
      await sendPushNotification({
        title: '🚚 Warehouse Stock Dispatched',
        message: `${totalDispatched} items dispatched to ${outlet.name}. Batch #${transferNumber}`,
        url: '/inventory',
        data: { type: 'SYSTEM' },
      });
    } catch (notifErr) {
      console.error('Failed sending dispatch push notification:', notifErr);
    }

    return {
      success: true,
      transferNumber,
      totalItems: totalDispatched,
      outletName: outlet.name,
    };
  } catch (error: any) {
    console.error('Failed to dispatch stock:', error);
    return { success: false, error: error.message };
  }
}

export async function getTransfers(limit: number = 10) {
  try {
    await connectToDatabase();
    const transfers = await Transfer.find({})
      .populate('destinationOutletId', 'name location')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return JSON.parse(JSON.stringify(transfers));
  } catch (error) {
    console.error('Failed to fetch transfers:', error);
    return [];
  }
}

