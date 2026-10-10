'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Download, PieChart, TrendingUp, BarChart3, Calendar, Package } from 'lucide-react';
import { getReportsData } from '@/actions/reports';
import Image from 'next/image';

export default function ReportsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{
    totalRevenue: number;
    totalOrders: number;
    grossProfit: number;
    topProducts: any[];
    revenueByLocation: any[];
  }>({
    totalRevenue: 0,
    totalOrders: 0,
    grossProfit: 0,
    topProducts: [],
    revenueByLocation: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('this_month');
  
  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      const res = await getReportsData(filter);
      if (res.success && res.data) {
        setData(res.data);
      }
      setIsLoading(false);
    }
    fetchReports();
  }, [filter]);

  useEffect(() => {
    if (!containerRef.current || isLoading) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    gsap.fromTo(elements, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out' });
  }, [isLoading]);

  return (
    <div ref={containerRef} className="max-w-[1600px] mx-auto pb-16 font-sans">
      <RimalTopBar 
        title="Analytics & Reports" 
        subtitle="Insights across your entire business" 
        emoji="📈" 
        showSearch={false}
      />

      <div className="flex justify-between items-center mb-8 animate-on-load">
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-full bg-[#33040D] text-white text-[13px] font-bold shadow-md">Overview</button>
          <button className="px-4 py-2 rounded-full bg-white text-gray-600 hover:text-gray-900 text-[13px] font-bold transition-colors">Sales</button>
          <button className="px-4 py-2 rounded-full bg-white text-gray-600 hover:text-gray-900 text-[13px] font-bold transition-colors">Inventory</button>
        </div>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] font-bold text-gray-700 hover:border-gray-300 shadow-sm transition-all flex items-center gap-2 outline-none cursor-pointer"
        >
          <option value="this_month">This Month</option>
          <option value="this_year">This Year</option>
          <option value="all_time">All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <RimalCard className="animate-on-load bg-gradient-to-br from-gray-900 to-black text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-[15px] font-medium text-gray-400">Total Revenue</h3>
          </div>
          <p className="text-[36px] font-black tracking-tight mb-2">
            {isLoading ? '...' : `৳ ${(data.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          </p>
          <p className="text-[13px] font-medium text-gray-400 flex items-center gap-1">For {filter.replace('_', ' ')}</p>
        </RimalCard>
        
        <RimalCard className="animate-on-load">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900">Est. Gross Profit</h3>
          </div>
          <p className="text-[36px] font-black tracking-tight text-gray-900 mb-2">
            {isLoading ? '...' : `৳ ${(data.grossProfit).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          </p>
          <p className="text-[13px] font-medium text-gray-500 flex items-center gap-1">Approx. 30% margin</p>
        </RimalCard>
        
        <RimalCard className="animate-on-load">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900">Total Orders</h3>
          </div>
          <p className="text-[36px] font-black tracking-tight text-gray-900 mb-2">
            {isLoading ? '...' : data.totalOrders.toLocaleString()}
          </p>
          <p className="text-[13px] font-medium text-gray-500 flex items-center gap-1">Completed invoices</p>
        </RimalCard>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-on-load">
        <RimalCard className="h-auto flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[18px] font-bold text-gray-900">Revenue by Location</h3>
          </div>
          <div className="flex-1 space-y-4">
            {isLoading ? (
              <p className="text-gray-400 text-sm text-center py-10">Loading locations...</p>
            ) : data.revenueByLocation.length > 0 ? (
              data.revenueByLocation.map((loc: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-800 text-[14px]">{loc.name}</span>
                  <span className="font-black text-gray-900">৳ {loc.revenue.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-10">No sales data for locations.</p>
            )}
          </div>
        </RimalCard>
        
        <RimalCard className="h-auto flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[18px] font-bold text-gray-900">Top Selling Products</h3>
          </div>
          <div className="flex-1 space-y-3">
            {isLoading ? (
              <p className="text-gray-400 text-sm text-center py-10">Loading top products...</p>
            ) : data.topProducts.length > 0 ? (
              data.topProducts.map((prod: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {prod.image ? (
                      <Image src={prod.image} alt={prod.title} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-[14px] font-bold text-gray-900 truncate">{prod.title}</h4>
                    <p className="text-[12px] text-gray-500 font-medium">{prod.sold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black text-gray-900">৳ {prod.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-10">No products sold in this period.</p>
            )}
          </div>
        </RimalCard>
      </div>

    </div>
  );
}

