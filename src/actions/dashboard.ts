'use server';

import dbConnect from '@/lib/rimal-db';
import Product from '@/models/Product';
import Outlet from '@/models/Outlet';
import User from '@/models/User';
import Sale from '@/models/Sale';
import Transfer from '@/models/Transfer';

export async function getDashboardStats() {
  try {
    await dbConnect();
    
    // Bangladesh Standard Time is UTC+6
    const BD_OFFSET_HOURS = 6;
    const nowUtc = new Date();
    const nowBd = new Date(nowUtc.getTime() + BD_OFFSET_HOURS * 60 * 60 * 1000);

    const bdYear = nowBd.getUTCFullYear();
    const bdMonth = nowBd.getUTCMonth();
    const bdDate = nowBd.getUTCDate();

    // Start of today in BD (00:00:00 BD) converted to UTC
    const startOfToday = new Date(Date.UTC(bdYear, bdMonth, bdDate, 0 - BD_OFFSET_HOURS, 0, 0, 0));
    // End of today in BD (23:59:59.999 BD) converted to UTC
    const endOfToday = new Date(Date.UTC(bdYear, bdMonth, bdDate, 23 - BD_OFFSET_HOURS, 59, 59, 999));

    // 1. Sales Today (Live calculation from Sale collection)
    const salesToday = await Sale.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
      status: 'COMPLETED'
    }).lean();

    const todaySales = salesToday.reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
    const todayOrders = salesToday.length;

    // 2. Total Revenue & All Completed Sales
    const allCompletedSales = await Sale.find({ status: 'COMPLETED' }, 'total createdAt items customerName paymentMethod invoiceId outletId')
      .populate('outletId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const totalRevenue = allCompletedSales.reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
    const totalOrders = allCompletedSales.length;

    // 3. Pending Transfers
    const pendingTransfers = await Transfer.countDocuments({
      status: { $in: ['LOADING', 'IN_TRANSIT'] }
    });

    // 4. Total Products
    const productsCount = await Product.countDocuments({ isActive: { $ne: false } });
    
    // 5. Total Outlets
    const outletsCount = await Outlet.countDocuments();
    
    // 6. Total Users / Employees
    const usersCount = await User.countDocuments();
    
    // 7. Total Stock & Low Stock
    const products = await Product.find({}, 'variants totalStock').lean();
    let totalStock = 0;
    let lowStockCount = 0;
    
    products.forEach((p: any) => {
      let productStock = 0;
      let hasLowStock = false;
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          const qty = Number(v.quantity) || 0;
          productStock += qty;
          if (qty <= 10) {
            hasLowStock = true;
          }
        });
      } else {
        productStock = Number(p.totalStock) || 0;
      }
      totalStock += productStock;
      if (hasLowStock || productStock <= 10) lowStockCount++;
    });

    // 8. Recent Movements (latest 6 sales)
    const recentMovements = allCompletedSales.slice(0, 6).map((s: any) => ({
      id: s._id.toString(),
      type: 'sale',
      invoiceId: s.invoiceId,
      outlet: s.outletId?.name || s.outletId?.location || 'Mirpur 13 Branch',
      amount: s.total || 0,
      itemCount: s.items?.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0) || s.items?.length || 1,
      customer: s.customerName || 'Walk-in Customer',
      paymentMethod: s.paymentMethod,
      time: s.createdAt
    }));

    // 9. Weekly Sales Trend (last 7 days)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTrend: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(bdYear, bdMonth, bdDate - i, 0, 0, 0, 0));
      const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0 - BD_OFFSET_HOURS, 0, 0, 0));
      const dayEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23 - BD_OFFSET_HOURS, 59, 59, 999));

      const daySales = allCompletedSales.filter((s: any) => {
        const sTime = new Date(s.createdAt).getTime();
        return sTime >= dayStart.getTime() && sTime <= dayEnd.getTime();
      });

      const dayTotal = daySales.reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);

      weeklyTrend.push({
        day: dayNames[d.getUTCDay()],
        date: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
        sales: dayTotal,
        orders: daySales.length
      });
    }

    return {
      success: true,
      stats: {
        todaySales,
        todayOrders,
        totalRevenue,
        totalOrders,
        pendingTransfers,
        products: productsCount,
        outlets: outletsCount,
        users: usersCount,
        totalStock,
        lowStockCount,
        recentMovements,
        weeklyTrend
      }
    };
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, error: error.message };
  }
}
