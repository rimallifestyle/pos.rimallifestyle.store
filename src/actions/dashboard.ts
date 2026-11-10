'use server';

import dbConnect from '@/lib/rimal-db';
import Product from '@/models/Product';
import Outlet from '@/models/Outlet';
import User from '@/models/User';

export async function getDashboardStats() {
  try {
    await dbConnect();
    
    // Total Products
    const productsCount = await Product.countDocuments();
    
    // Total Outlets
    const outletsCount = await Outlet.countDocuments();
    
    // Total Users / Employees
    const usersCount = await User.countDocuments();
    
    // Total variants stock across all products (Warehouse stock approximation)
    // And low stock calculation
    const products = await Product.find({}, 'variants totalStock');
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

    return {
      success: true,
      stats: {
        products: productsCount,
        outlets: outletsCount,
        users: usersCount,
        totalStock: totalStock,
        lowStockCount: lowStockCount
      }
    };
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, error: error.message };
  }
}
