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
    const products = await Product.find({}, 'variants');
    let totalStock = 0;
    let lowStockCount = 0;
    
    products.forEach(p => {
      let hasLowStock = false;
      p.variants.forEach((v: any) => {
        totalStock += (v.quantity || 0);
        if (v.quantity !== undefined && v.quantity <= 10) {
          hasLowStock = true;
        }
      });
      if (hasLowStock) lowStockCount++;
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
