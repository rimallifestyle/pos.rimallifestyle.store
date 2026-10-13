'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import RimalCard from '@/components/rimal-ui/RimalCard';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import { Package, Warehouse, Store, AlertTriangle, Banknote, ShoppingCart, ArrowRightLeft, CreditCard, Box, TrendingUp, Search, Plus, Filter, Download, LogOut, Users } from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats } from '@/actions/dashboard';

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dynStats, setDynStats] = React.useState({ products: 0, outlets: 0, users: 0, totalStock: 0, lowStockCount: 0 });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      const res = await getDashboardStats();
      if (res.success && res.stats) {
        setDynStats(res.stats);
      }
      setIsLoading(false);
    }
    loadStats();
  }, []);

  useEffect(() => {
    if (!containerRef.current || isLoading) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    
    gsap.fromTo(
      elements,
      { y: 50, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        stagger: 0.08, 
        duration: 0.9, 
        ease: 'power4.out',
        delay: 0.1
      }
    );
  }, [isLoading]);

  return (
    <div ref={containerRef} className="max-w-[1600px] mx-auto pb-16 font-sans">
      {/* Header Area */}
      <RimalTopBar 
        title="Inventory Overview" 
        subtitle="Welcome to Rimal Dashboard" 
        emoji="🔥" 
      />

      {/* Mini Stats (Top Row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <Link href="/sales" className="block">
          <RimalCard className="animate-on-load hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] cursor-pointer flex flex-col items-center justify-center text-center py-6 sm:py-8 h-full transition-all">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full flex items-center justify-center bg-[#33040D]/5 text-[#33040D] mb-3 sm:mb-4">
              <Banknote className="w-5 sm:w-6 h-5 sm:h-6" strokeWidth={2.5} />
            </div>
            <p className="text-[13px] sm:text-[14px] font-bold text-gray-900 mb-0.5 sm:mb-1">Today's Sales</p>
            <h3 className="text-[12px] sm:text-[13px] font-medium text-gray-500">৳ 0</h3>
          </RimalCard>
        </Link>
        
        <Link href="/sales" className="block">
          <RimalCard className="animate-on-load hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] cursor-pointer flex flex-col items-center justify-center text-center py-6 sm:py-8 h-full transition-all">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full flex items-center justify-center bg-[#33040D]/5 text-[#33040D] mb-3 sm:mb-4">
              <ShoppingCart className="w-5 sm:w-6 h-5 sm:h-6" strokeWidth={2.5} />
            </div>
            <p className="text-[13px] sm:text-[14px] font-bold text-gray-900 mb-0.5 sm:mb-1">Today's Orders</p>
            <h3 className="text-[12px] sm:text-[13px] font-medium text-gray-500">0</h3>
          </RimalCard>
        </Link>
        
        <Link href="/products" className="block">
          <RimalCard className="animate-on-load hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] cursor-pointer flex flex-col items-center justify-center text-center py-6 sm:py-8 h-full transition-all">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full flex items-center justify-center bg-red-50 text-red-500 mb-3 sm:mb-4">
              <AlertTriangle className="w-5 sm:w-6 h-5 sm:h-6" strokeWidth={2.5} />
            </div>
            <p className="text-[13px] sm:text-[14px] font-bold text-gray-900 mb-0.5 sm:mb-1">Low Stock Alerts</p>
            <h3 className="text-[12px] sm:text-[13px] font-medium text-gray-500">{isLoading ? '...' : dynStats.lowStockCount} Products</h3>
          </RimalCard>
        </Link>
        
        <Link href="/inventory" className="block">
          <RimalCard className="animate-on-load hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] cursor-pointer flex flex-col items-center justify-center text-center py-6 sm:py-8 h-full transition-all">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full flex items-center justify-center bg-orange-50 text-orange-500 mb-3 sm:mb-4">
              <ArrowRightLeft className="w-5 sm:w-6 h-5 sm:h-6" strokeWidth={2.5} />
            </div>
            <p className="text-[13px] sm:text-[14px] font-bold text-gray-900 mb-0.5 sm:mb-1">Pending Transfers</p>
            <h3 className="text-[12px] sm:text-[13px] font-medium text-gray-500">0</h3>
          </RimalCard>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Left Column (Main Stats & Movement) */}
        <div className="xl:col-span-2 space-y-12">
          
          {/* Featured Gradient Cards */}
          <div className="animate-on-load">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold text-gray-900">Key Metrics</h2>
              <button className="text-[14px] font-semibold text-gray-400 hover:text-gray-900 transition-colors">See all</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Dynamic Stats Cards */}
              <div className={`relative overflow-hidden rounded-[24px] p-7 text-white bg-gradient-to-br from-[#33040D] to-[#5a0a1a] shadow-lg shadow-[#33040D]/30 hover:-translate-y-1 transition-transform duration-300 cursor-pointer`}>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-[14px] flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                    <Package className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <p className="text-white/80 text-[14px] font-medium mb-1">Total Products</p>
                  <h3 className="text-[32px] font-bold tracking-tight mb-4">{isLoading ? '...' : dynStats.products.toLocaleString()}</h3>
                  
                  <div className="flex justify-between items-center mt-6 pt-5 border-t border-white/10">
                    <span className="text-[12px] font-medium text-white/70">Total Stock: {isLoading ? '...' : dynStats.totalStock.toLocaleString()}</span>
                    <Link href="/products" className="text-[12px] font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm">View</Link>
                  </div>
                </div>
              </div>

              <div className={`relative overflow-hidden rounded-[24px] p-7 text-white bg-gradient-to-br from-[#4a0614] to-[#750e24] shadow-lg shadow-[#4a0614]/30 hover:-translate-y-1 transition-transform duration-300 cursor-pointer`}>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-[14px] flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                    <Store className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <p className="text-white/80 text-[14px] font-medium mb-1">Total Outlets</p>
                  <h3 className="text-[32px] font-bold tracking-tight mb-4">{isLoading ? '...' : dynStats.outlets.toLocaleString()}</h3>
                  
                  <div className="flex justify-between items-center mt-6 pt-5 border-t border-white/10">
                    <span className="text-[12px] font-medium text-white/70">Store Locations</span>
                    <Link href="/outlets" className="text-[12px] font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm">View</Link>
                  </div>
                </div>
              </div>

              <div className={`relative overflow-hidden rounded-[24px] p-7 text-white bg-gradient-to-br from-[#5a0a1a] to-[#8c132d] shadow-lg shadow-[#5a0a1a]/30 hover:-translate-y-1 transition-transform duration-300 cursor-pointer`}>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-[14px] flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                    <Users className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <p className="text-white/80 text-[14px] font-medium mb-1">Total Employees</p>
                  <h3 className="text-[32px] font-bold tracking-tight mb-4">{isLoading ? '...' : dynStats.users.toLocaleString()}</h3>
                  
                  <div className="flex justify-between items-center mt-6 pt-5 border-t border-white/10">
                    <span className="text-[12px] font-medium text-white/70">Staff Members</span>
                    <button className="text-[12px] font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm">View</button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Recent Movement (List View) */}
          <div className="animate-on-load">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold text-gray-900 flex items-center gap-2">
                Recent Movement <span className="text-xl">⚡</span>
              </h2>
            </div>
            <div className="space-y-4">
              {/* Empty state for recent movement */}
              <div className="bg-gray-50 rounded-[20px] p-8 text-center border border-gray-100 flex flex-col items-center justify-center">
                <Box className="w-10 h-10 text-gray-300 mb-3" />
                <h4 className="text-[15px] font-bold text-gray-900 mb-1">No Recent Movement</h4>
                <p className="text-[13px] text-gray-500 max-w-sm">Sales, stock ins, and transfers will appear here once POS is active.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Charts & Quick Actions) */}
        <div className="space-y-10">
          
          {/* Action Center */}
          <div className="animate-on-load">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold text-gray-900">Action Center</h2>
              {dynStats.lowStockCount > 0 && <span className="bg-red-50 text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-full border border-red-100">{dynStats.lowStockCount} Alerts</span>}
            </div>
            <RimalCard className="!p-0 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {dynStats.lowStockCount > 0 ? (
                  <div className="p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-500">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[14px] font-bold text-gray-900 group-hover:text-[#33040D] transition-colors">Low Stock Alert</h4>
                      <p className="text-[12px] text-gray-500 font-medium mt-1">{dynStats.lowStockCount} products are critically low in stock (10 or less).</p>
                      <Link href="/products" className="text-[11px] font-bold text-[#33040D] mt-2 uppercase tracking-wide hover:underline block">View Products</Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-[13px] font-medium text-gray-400">You're all caught up! No pending actions.</p>
                  </div>
                )}
              </div>
            </RimalCard>
          </div>

          {/* Quick Tasks */}
          <div className="animate-on-load">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold text-gray-900">Quick Tasks</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/products/add" className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer text-center group block">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#33040D]/10 transition-colors">
                  <Plus className="w-5 h-5 text-gray-600 group-hover:text-[#33040D]" />
                </div>
                <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#33040D] transition-colors">Add Product</p>
              </Link>
              
              <Link href="/inventory" className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer text-center group block">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#33040D]/10 transition-colors">
                  <ArrowRightLeft className="w-5 h-5 text-gray-600 group-hover:text-[#33040D]" />
                </div>
                <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#33040D] transition-colors">Stock Transfer</p>
              </Link>
              
              <Link href="/pos" className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer text-center group block">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#33040D]/10 transition-colors">
                  <CreditCard className="w-5 h-5 text-gray-600 group-hover:text-[#33040D]" />
                </div>
                <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#33040D] transition-colors">Open POS</p>
              </Link>
              
              <Link href="/reports" className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer text-center group block">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#33040D]/10 transition-colors">
                  <Download className="w-5 h-5 text-gray-600 group-hover:text-[#33040D]" />
                </div>
                <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#33040D] transition-colors">Reports & BI</p>
              </Link>
            </div>
          </div>

          {/* Sales Trend (Mock) */}
          <div className="animate-on-load">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold text-gray-900">Sales Trend</h2>
              <div className="flex gap-2">
                <span className="text-[12px] font-bold bg-gray-100 px-3 py-1.5 rounded-full text-gray-600">Weekly</span>
                <span className="text-[12px] font-bold bg-[#33040D] text-white px-3 py-1.5 rounded-full shadow-md">Monthly</span>
              </div>
            </div>
            <RimalCard className="!p-8">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <p className="text-[12px] font-medium text-gray-400 mb-1">Total Revenue</p>
                   <h3 className="text-[24px] font-bold text-gray-900">৳ 0</h3>
                 </div>
                 <div className="text-[12px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">0%</div>
               </div>
               
               <div className="h-32 w-full flex items-center justify-center bg-gray-50 rounded-lg mt-8 border border-gray-100 border-dashed">
                 <p className="text-[12px] font-medium text-gray-400">Not enough data to show chart</p>
               </div>
               <div className="flex justify-between mt-4 text-[11px] font-bold text-gray-400">
                 <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
               </div>
            </RimalCard>
          </div>

        </div>
      </div>
    </div>
  );
}
