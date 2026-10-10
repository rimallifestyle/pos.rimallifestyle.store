'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Download, PieChart, TrendingUp, BarChart3, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    gsap.fromTo(elements, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out' });
  }, []);

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
        <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] font-bold text-gray-700 hover:border-gray-300 shadow-sm transition-all flex items-center gap-2">
          <Calendar className="w-4 h-4" /> This Month
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <RimalCard className="animate-on-load bg-gradient-to-br from-gray-900 to-black text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-[15px] font-medium text-gray-400">Total Revenue</h3>
          </div>
          <p className="text-[36px] font-black tracking-tight mb-2">৳ 2.4M</p>
          <p className="text-[13px] font-medium text-green-400 flex items-center gap-1">+12.5% from last month</p>
        </RimalCard>
        
        <RimalCard className="animate-on-load">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900">Gross Profit</h3>
          </div>
          <p className="text-[36px] font-black tracking-tight text-gray-900 mb-2">৳ 840K</p>
          <p className="text-[13px] font-medium text-green-600 flex items-center gap-1">+5.2% from last month</p>
        </RimalCard>
        
        <RimalCard className="animate-on-load">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900">Total Orders</h3>
          </div>
          <p className="text-[36px] font-black tracking-tight text-gray-900 mb-2">1,248</p>
          <p className="text-[13px] font-medium text-red-500 flex items-center gap-1">-2.1% from last month</p>
        </RimalCard>
      </div>
      
      {/* Placeholder for big charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-on-load">
        <RimalCard className="h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[18px] font-bold text-gray-900">Revenue by Location</h3>
            <button className="text-[13px] font-bold text-gray-500 hover:text-gray-900">Export</button>
          </div>
          <div className="flex-1 border-2 border-dashed border-gray-100 rounded-[16px] flex items-center justify-center bg-gray-50/50">
            <p className="text-gray-400 font-bold text-[14px]">Chart Visualization Placeholder</p>
          </div>
        </RimalCard>
        <RimalCard className="h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[18px] font-bold text-gray-900">Top Selling Products</h3>
            <button className="text-[13px] font-bold text-gray-500 hover:text-gray-900">View All</button>
          </div>
          <div className="flex-1 border-2 border-dashed border-gray-100 rounded-[16px] flex items-center justify-center bg-gray-50/50">
            <p className="text-gray-400 font-bold text-[14px]">List Visualization Placeholder</p>
          </div>
        </RimalCard>
      </div>

    </div>
  );
}
