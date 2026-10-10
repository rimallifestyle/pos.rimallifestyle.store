'use server';

import dbConnect from '@/lib/rimal-db';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Outlet from '@/models/Outlet';

export async function getReportsData(filter = 'this_month') {
  try {
    await dbConnect();

    const now = new Date();
    let startDate = new Date(0); // Beginning of time

    if (filter === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const matchQuery = { createdAt: { $gte: startDate }, status: 'COMPLETED' };

    // 1. Total Revenue, Orders
    const sales = await Sale.find(matchQuery);
    
    let totalRevenue = 0;
    let totalOrders = sales.length;
    
    sales.forEach(sale => {
      totalRevenue += (sale.total || 0);
    });

    // 2. Gross Profit (Approx: assuming 30% avg margin for now, or you could do exact calculation if cost is saved in sales)
    const grossProfit = totalRevenue * 0.3; 

    // 3. Top Selling Products
    // Aggregate from all sales in this period
    const productSalesMap: Record<string, { quantity: number, revenue: number }> = {};
    
    sales.forEach(sale => {
      sale.items.forEach((item: any) => {
        const pId = item.productId.toString();
        if (!productSalesMap[pId]) {
          productSalesMap[pId] = { quantity: 0, revenue: 0 };
        }
        productSalesMap[pId].quantity += item.quantity;
        productSalesMap[pId].revenue += (item.quantity * item.priceAtSale);
      });
    });

    const topProductIds = Object.keys(productSalesMap)
      .sort((a, b) => productSalesMap[b].quantity - productSalesMap[a].quantity)
      .slice(0, 5);

    const populatedProducts = await Product.find({ _id: { $in: topProductIds } }, 'title imageUrl');
    
    const topProducts = topProductIds.map(id => {
      const p = populatedProducts.find(prod => prod._id.toString() === id);
      return {
        id,
        title: p ? p.title : 'Unknown Product',
        image: p && p.imageUrl ? p.imageUrl : null,
        sold: productSalesMap[id].quantity,
        revenue: productSalesMap[id].revenue
      };
    });

    // 4. Revenue by Location (Outlet)
    const locationMap: Record<string, number> = {};
    sales.forEach(sale => {
      const oId = sale.outletId ? sale.outletId.toString() : 'Online / Main';
      if (!locationMap[oId]) locationMap[oId] = 0;
      locationMap[oId] += (sale.total || 0);
    });

    const outletIds = Object.keys(locationMap).filter(id => id !== 'Online / Main');
    const populatedOutlets = await Outlet.find({ _id: { $in: outletIds } }, 'name');

    const revenueByLocation = Object.keys(locationMap).map(id => {
      if (id === 'Online / Main') return { name: 'Main Branch / Online', revenue: locationMap[id] };
      const out = populatedOutlets.find(o => o._id.toString() === id);
      return {
        name: out ? out.name : 'Unknown Outlet',
        revenue: locationMap[id]
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        grossProfit,
        topProducts,
        revenueByLocation
      }
    };
  } catch (error: any) {
    console.error('Error fetching reports data:', error);
    return { success: false, error: error.message };
  }
}
