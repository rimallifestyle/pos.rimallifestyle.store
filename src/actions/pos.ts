'use server';

import dbConnect from '@/lib/rimal-db';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';
import Sale from '@/models/Sale';
import Outlet from '@/models/Outlet';
import User from '@/models/User';
import mongoose from 'mongoose';
import { getCurrentSession } from './auth';
import { sendSalePushNotification } from '@/lib/onesignal';

export async function getPosContext() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return {
        cashierName: 'Cashier',
        outletName: 'RIMAL.',
        outletLocation: 'Mirpur 13 Branch'
      };
    }
    
    await dbConnect();
    
    // Fetch user from DB to get the latest outletId
    const user = await User.findById(session.id).lean();
    if (!user) {
      return {
        cashierName: session.name || 'Cashier',
        outletName: 'RIMAL.',
        outletLocation: 'Mirpur 13 Branch'
      };
    }

    let outletName = 'RIMAL.';
    let outletLocation = 'Mirpur 13 Branch';
    
    let outlet: any = null;
    if (user.outletId) {
      outlet = await Outlet.findById(user.outletId).lean();
    }
    if (!outlet) {
      outlet = await Outlet.findOne({ isActive: true }).lean();
    }
    
    if (outlet) {
      outletName = 'RIMAL.';
      const loc = outlet.location || 'Mirpur 13';
      outletLocation = loc.toLowerCase().includes('branch') ? loc : `${loc} Branch`;
    }
    
    return {
      cashierName: session.name || 'Cashier',
      outletName,
      outletLocation
    };
  } catch (error) {
    console.error('Failed to get POS context:', error);
    return {
      cashierName: 'Cashier',
      outletName: 'RIMAL.',
      outletLocation: 'Mirpur 13 Branch'
    };
  }
}

export async function getPosProducts(outletId?: string | null) {
  try {
    await dbConnect();
    let targetOutletId = outletId;
    if (targetOutletId === undefined) {
      const session = await getCurrentSession();
      if (session) {
        const user = await User.findById(session.id).lean();
        targetOutletId = user?.outletId ? user.outletId.toString() : null;
      } else {
        targetOutletId = null;
      }
    }

    const products = await Product.find({ isActive: true }).lean();
    
    // Determine inventory query (global vs specific outlet)
    let inventoryQuery: any = {};
    if (targetOutletId) {
      inventoryQuery.outletId = targetOutletId;
    } else {
      inventoryQuery.outletId = null; // Master warehouse
    }
    
    const inventory = await Inventory.find(inventoryQuery).lean();
    
    const posProducts: any[] = [];
    
    for (const p of products) {
      for (const v of (p as any).variants) {
        const stockItem = inventory.find((i: any) => i.sku === v.sku);
        // Use inventory quantity if found, otherwise fall back to variant's own quantity field
        const stock = stockItem ? stockItem.quantity : (v.quantity || 0);
        
        const hasColor = v.color && v.color !== 'Standard' && v.color !== 'Default' && v.color.trim() !== '';
        const hasSize = v.size && v.size.trim() !== '';
        let variantLabel = 'Standard';
        if (hasColor && hasSize) {
          variantLabel = `${v.color} / ${v.size}`;
        } else if (hasSize) {
          variantLabel = `Size: ${v.size}`;
        } else if (hasColor) {
          variantLabel = v.color;
        }

        posProducts.push({
          id: `${p._id.toString()}_${v.sku}`,
          productId: p._id.toString(),
          name: p.title,
          variant: variantLabel,
          sku: v.sku,
          price: v.price,
          stock: stock,
          category: p.category,
          subCategory: (p as any).subCategory || '',
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
    const session = await getCurrentSession();
    const user = session ? await User.findById(session.id).lean() : null;
    let outletId = user?.outletId || null;
    if (!outletId) {
      const activeOutlet = await Outlet.findOne({ isActive: true }).lean();
      if (activeOutlet) {
        outletId = activeOutlet._id;
      }
    }

    // Create Sale invoiceId
    const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Decrease stock for each sold item across Product.variants, Product.totalStock, and Inventory
    for (const item of data.items) {
      const soldQty = Number(item.quantity) || 1;

      // 1. Find Product by productId or variant SKU
      let product: any = null;
      if (item.productId) {
        product = await Product.findById(item.productId);
      }
      if (!product && item.sku) {
        product = await Product.findOne({ 'variants.sku': item.sku });
      }

      let variantFound: any = null;
      if (product && product.variants) {
        variantFound = product.variants.find((v: any) => v.sku === item.sku);
        if (variantFound) {
          variantFound.quantity = Math.max(0, (Number(variantFound.quantity) || 0) - soldQty);
        }
        // Recalculate totalStock
        product.totalStock = product.variants.reduce(
          (acc: number, curr: any) => acc + (Number(curr.quantity) || 0),
          0
        );
        await product.save();
      }

      // 2. Update Inventory record for this outlet (or master warehouse if outletId is null)
      if (outletId) {
        const outletInv = await Inventory.findOne({ sku: item.sku, outletId });
        if (outletInv) {
          outletInv.quantity = Math.max(0, (Number(outletInv.quantity) || 0) - soldQty);
          outletInv.lastRestocked = new Date();
          await outletInv.save();
        } else {
          // If no outlet inventory existed, create one with remaining variant stock
          if (product) {
            await Inventory.create({
              productId: product._id,
              sku: item.sku,
              outletId: outletId,
              quantity: variantFound ? variantFound.quantity : 0,
              lastRestocked: new Date()
            });
          }
          // Also decrement master warehouse if it exists
          const whInv = await Inventory.findOne({ sku: item.sku, outletId: null });
          if (whInv) {
            whInv.quantity = Math.max(0, (Number(whInv.quantity) || 0) - soldQty);
            whInv.lastRestocked = new Date();
            await whInv.save();
          }
        }
      } else {
        // Master warehouse sale
        const whInv = await Inventory.findOne({ sku: item.sku, outletId: null });
        if (whInv) {
          whInv.quantity = Math.max(0, (Number(whInv.quantity) || 0) - soldQty);
          whInv.lastRestocked = new Date();
          await whInv.save();
        } else if (product) {
          await Inventory.create({
            productId: product._id,
            sku: item.sku,
            outletId: null,
            quantity: variantFound ? variantFound.quantity : 0,
            lastRestocked: new Date()
          });
        }
      }
    }
    
    const newSale = await Sale.create({
      invoiceId,
      outletId: outletId,
      cashierId: session?.id || null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      items: data.items.map((i: any) => ({
        productId: i.productId,
        sku: i.sku,
        quantity: i.quantity,
        priceAtSale: i.price
      })),
      subtotal: data.subtotal,
      discount: data.discount,
      total: data.total,
      paymentMethod: data.paymentMethod === 'Cash' ? 'CASH' : data.paymentMethod === 'MFS' ? 'MFS' : 'CARD',
      paymentProvider: data.paymentProvider,
      status: 'COMPLETED'
    });

    // Trigger OneSignal push notification to all subscribed devices
    try {
      let outletName = 'Main Outlet';
      if (user?.outletId) {
        const outlet = await Outlet.findById(user.outletId).lean();
        if (outlet) outletName = (outlet as any).name;
      }

      await sendSalePushNotification({
        invoiceId,
        total: data.total,
        itemsCount: data.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0),
        customerName: data.customerName,
        outletName
      });
    } catch (pushErr) {
      console.error('[OneSignal] Failed preparing/sending sale push notification:', pushErr);
    }
    
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
      _id: (sale as any)._id.toString(),
      items: (sale as any).items.map((item: any) => ({
        id: item._id?.toString(),
        productId: item.productId?._id?.toString(),
        sku: item.sku || '',
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
    const sale = await Sale.findOne({ invoiceId });
    if (!sale) return { success: false, error: 'Invoice not found' };
    if (sale.status === 'REFUNDED') return { success: false, error: 'Already refunded' };
    
    sale.status = 'REFUNDED';
    await sale.save();
    
    // Restock items in both Product.variants, Product.totalStock, and Inventory
    for (const item of (sale.items || [])) {
      const returnQty = Number(item.quantity) || 1;
      
      let product: any = null;
      if (item.productId) {
        product = await Product.findById(item.productId);
      }
      if (!product && item.sku) {
        product = await Product.findOne({ 'variants.sku': item.sku });
      }

      if (product && product.variants) {
        const variant = product.variants.find((v: any) => v.sku === item.sku);
        if (variant) {
          variant.quantity = (Number(variant.quantity) || 0) + returnQty;
        }
        product.totalStock = product.variants.reduce(
          (acc: number, curr: any) => acc + (Number(curr.quantity) || 0),
          0
        );
        await product.save();
      }

      // Restock Inventory record
      if (item.sku) {
        const invFilter: any = { sku: item.sku };
        if (sale.outletId) {
          invFilter.outletId = sale.outletId;
        } else {
          invFilter.outletId = null;
        }

        const inv = await Inventory.findOne(invFilter);
        if (inv) {
          inv.quantity = (Number(inv.quantity) || 0) + returnQty;
          inv.lastRestocked = new Date();
          await inv.save();
        } else if (product) {
          await Inventory.create({
            productId: product._id,
            sku: item.sku,
            outletId: sale.outletId || null,
            quantity: returnQty,
            lastRestocked: new Date()
          });
        }
      }
    }
    
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
