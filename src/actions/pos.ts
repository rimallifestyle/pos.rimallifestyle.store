'use server';

import dbConnect from '@/lib/rimal-db';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';
import Sale from '@/models/Sale';
import Outlet from '@/models/Outlet';
import User from '@/models/User';
import mongoose from 'mongoose';
import { getCurrentSession } from './auth';

export async function getPosContext() {
  try {
    const session = await getCurrentSession();
    if (!session) return null;
    
    await dbConnect();
    
    // Fetch user from DB to get the latest outletId (in case admin changed it while they were logged in)
    const user = await User.findById(session.id).lean();
    if (!user) return null;

    let outletName = 'RIMAL.';
    let outletLocation = 'Head Office';
    
    if (user.outletId) {
      const outlet = await Outlet.findById(user.outletId).lean();
      if (outlet) {
        outletName = outlet.name;
        outletLocation = outlet.location;
      }
    }
    
    return {
      cashierName: session.name || 'Cashier',
      outletName,
      outletLocation
    };
  } catch (error) {
    console.error('Failed to get POS context:', error);
    return null;
  }
}

export async function getPosProducts(outletId?: string | null) {
  try {
    await dbConnect();
    const products = await Product.find({ isActive: true }).lean();
    
    // Determine inventory query (global vs specific outlet)
    let inventoryQuery: any = {};
    if (outletId) {
      inventoryQuery.outletId = outletId;
    } else {
      inventoryQuery.outletId = null; // Master warehouse
    }
    
    const inventory = await Inventory.find(inventoryQuery).lean();
    
    const posProducts: any[] = [];
    
    for (const p of products) {
      for (const v of (p as any).variants) {
        const stockItem = inventory.find((i: any) => i.sku === v.sku);
        const stock = stockItem ? stockItem.quantity : 0;
        
        posProducts.push({
          id: `${p._id.toString()}_${v.sku}`,
          productId: p._id.toString(),
          name: p.title,
          variant: `${v.color} / ${v.size}`,
          sku: v.sku,
          price: v.price,
          stock: stock,
          category: p.category,
          img: p.imageUrl || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=150&q=80'
        });
      }
    }
    
    return JSON.parse(JSON.stringify(posProducts));
  } catch (error) {
    console.error('Failed to get POS products:', error);
    return [];
  }
}

export async function saveSale(data: any) {
  try {
    await dbConnect();
    // Create Sale
    const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Decrease inventory
    for (const item of data.items) {
      await Inventory.findOneAndUpdate(
        { "sku": item.sku },
        { $inc: { quantity: -item.quantity } }
      );
    }
    
    const session = await getCurrentSession();
    const user = session ? await User.findById(session.id).lean() : null;
    
    const newSale = await Sale.create({
      invoiceId,
      outletId: user?.outletId || null,
      cashierId: session?.id || null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      items: data.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        priceAtSale: i.price
      })),
      subtotal: data.subtotal,
      discount: data.discount,
      total: data.total,
      paymentMethod: data.paymentMethod === 'Cash' ? 'CASH' : 'CARD',
      paymentProvider: data.paymentProvider,
      status: 'COMPLETED'
    });
    
    return { success: true, invoiceId };
  } catch (error) {
    console.error('Failed to save sale:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function getSaleByInvoice(invoiceId: string) {
  try {
    await dbConnect();
    const sale = await Sale.findOne({ invoiceId })
      .populate('items.productId')
      .lean();
      
    if (!sale) return { success: false, error: 'Invoice not found' };
    
    // Process items
    const processedSale = {
      ...sale,
      _id: sale._id.toString(),
      items: sale.items.map((item: any) => ({
        id: item._id?.toString(),
        productId: item.productId?._id?.toString(),
        name: item.productId?.title || 'Unknown Product',
        price: item.priceAtSale,
        quantity: item.quantity,
      }))
    };
    
    return { success: true, sale: JSON.parse(JSON.stringify(processedSale)) };
  } catch (error) {
    console.error('Failed to fetch sale:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function processReturn(invoiceId: string) {
  try {
    await dbConnect();
    const sale = await mongoose.models.Sale.findOne({ invoiceId });
    if (!sale) return { success: false, error: 'Invoice not found' };
    if (sale.status === 'REFUNDED') return { success: false, error: 'Already refunded' };
    
    sale.status = 'REFUNDED';
    await sale.save();
    
    return { success: true };
  } catch (error) {
    console.error('Failed to process return:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function getEndOfDayReport() {
  try {
    await dbConnect();
    const session = await getCurrentSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    const user = await User.findById(session.id).lean();
    if (!user) return { success: false, error: 'User not found' };

    // Set today's date range (from midnight to now)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const query: any = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'COMPLETED'
    };

    if (user.outletId) {
      query.outletId = user.outletId;
    } else {
      query.outletId = null;
    }

    const sales = await Sale.find(query).lean();

    const totalSales = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
    const totalCash = sales.filter(s => s.paymentMethod === 'CASH').reduce((acc, sale) => acc + (sale.total || 0), 0);
    const totalCard = sales.filter(s => s.paymentMethod === 'CARD').reduce((acc, sale) => acc + (sale.total || 0), 0);
    const totalDiscounts = sales.reduce((acc, sale) => acc + (sale.discount || 0), 0);
    
    // Refunds today
    const refundQuery = { ...query, status: 'REFUNDED' };
    const refunds = await Sale.find(refundQuery).lean();
    const totalRefunds = refunds.reduce((acc, sale) => acc + (sale.total || 0), 0);

    return {
      success: true,
      report: {
        date: startOfDay.toISOString().split('T')[0],
        transactionsCount: sales.length,
        refundsCount: refunds.length,
        totalSales,
        totalCash,
        totalCard,
        totalDiscounts,
        totalRefunds
      }
    };
  } catch (error) {
    console.error('Failed to generate end of day report:', error);
    return { success: false, error: 'Database error' };
  }
}
