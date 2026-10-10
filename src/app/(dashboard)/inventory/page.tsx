'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Truck, ArrowRight, ArrowRightLeft, ScanLine, Search, Plus, Minus, CheckCircle2, AlertTriangle, Box, RefreshCw } from 'lucide-react';

const mockWarehouseStock = [
  { sku: 'RM-TS-001', name: 'Premium T-Shirt', variant: 'Black / M', stock: 1250, location: 'Aisle 4, Rack B' },
  { sku: 'RM-TS-002', name: 'Premium T-Shirt', variant: 'White / L', stock: 840, location: 'Aisle 4, Rack C' },
  { sku: 'RM-PT-015', name: 'Denim Jeans', variant: 'Blue / 32', stock: 45, location: 'Aisle 2, Rack A', alert: true },
];

const dispatchQueue = [
  { id: 'TRF-8892', outlet: 'Rimal Uttara', items: 250, status: 'Loading', driver: 'Rahim' },
  { id: 'TRF-8891', outlet: 'Rimal Mirpur', items: 120, status: 'Pending Approval', driver: 'Unassigned' },
  { id: 'TRF-8890', outlet: 'Rimal Dhanmondi', items: 500, status: 'In Transit', driver: 'Karim' },
];

export default function InventoryDistributionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedOutlet, setSelectedOutlet] = useState('Uttara (UTT-01)');
  
  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    gsap.fromTo(elements, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' });
  }, []);

  return (
    <div ref={containerRef} className="max-w-[1600px] mx-auto pb-16 font-sans">
      <RimalTopBar 
        title="Warehouse Distribution" 
        subtitle="Manage master stock and outlet dispatches" 
        emoji="🏭" 
      />

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-on-load">
        <RimalCard className="bg-gradient-to-br from-[#33040D] to-[#5a0a1a] text-white">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <Box className="w-6 h-6" />
          </div>
          <p className="text-[13px] font-medium text-white/80 uppercase tracking-wider mb-1">Master Stock</p>
          <h3 className="text-[32px] font-black">18,450</h3>
        </RimalCard>
        <RimalCard>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Truck className="w-6 h-6" />
          </div>
          <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-1">In Transit</p>
          <h3 className="text-[32px] font-black text-gray-900">2,140 <span className="text-[14px] font-medium text-gray-500">items</span></h3>
        </RimalCard>
        <RimalCard>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Requests</p>
          <h3 className="text-[32px] font-black text-gray-900">14 <span className="text-[14px] font-medium text-gray-500">batches</span></h3>
        </RimalCard>
        <RimalCard className="border border-red-100 bg-red-50/30">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-1">Low Stock Alerts</p>
          <h3 className="text-[32px] font-black text-red-600">8 <span className="text-[14px] font-medium text-red-400">SKUs</span></h3>
        </RimalCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
        
        {/* Left Column - Dispatch Builder (Takes up 7 cols) */}
        <div className="xl:col-span-7 animate-on-load">
          <RimalCard className="h-full flex flex-col !p-0 overflow-hidden" glass>
            <div className="p-6 border-b border-gray-100 bg-white/50 flex justify-between items-center">
              <div>
                <h2 className="text-[20px] font-bold text-gray-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-[#33040D]" /> New Distribution Batch
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">Scan or add items to dispatch to an outlet</p>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Destination</span>
                <select 
                  className="bg-gray-50 border border-gray-200 text-gray-900 text-[14px] font-bold rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#33040D]/20 cursor-pointer"
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                >
                  <option>Uttara (UTT-01)</option>
                  <option>Mirpur (MIR-01)</option>
                  <option>Dhanmondi (DHA-01)</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-b border-gray-100 flex gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-[16px] text-[14px] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all"
                  placeholder="Search master catalog by SKU or Name..."
                />
              </div>
              <button className="px-6 bg-[#33040D] text-white rounded-[16px] font-bold text-[14px] shadow-md hover:bg-[#4a0614] transition-colors flex items-center gap-2">
                <ScanLine className="w-5 h-5" /> Scan
              </button>
            </div>

            <div className="flex-1 p-6 bg-gray-50/50">
              <div className="bg-white rounded-[16px] border border-gray-100 p-4 flex items-center justify-between mb-3 shadow-sm">
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Premium T-Shirt <span className="text-gray-400 font-medium">| Black / M</span></h4>
                  <p className="text-[12px] font-mono text-gray-500 mt-0.5">RM-TS-001 <span className="mx-2">•</span> <span className="text-green-600 font-bold">1250 in warehouse</span></p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1 border border-gray-200">
                    <button className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm hover:text-[#33040D]"><Minus className="w-4 h-4" /></button>
                    <span className="text-[14px] font-bold w-8 text-center text-[#33040D]">150</span>
                    <button className="w-7 h-7 rounded-full bg-[#33040D] flex items-center justify-center text-white shadow-sm hover:bg-[#4a0614]"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-[16px] border border-gray-100 p-4 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Denim Jeans <span className="text-gray-400 font-medium">| Blue / 32</span></h4>
                  <p className="text-[12px] font-mono text-gray-500 mt-0.5">RM-PT-015 <span className="mx-2">•</span> <span className="text-orange-500 font-bold">45 in warehouse</span></p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1 border border-gray-200">
                    <button className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm hover:text-[#33040D]"><Minus className="w-4 h-4" /></button>
                    <span className="text-[14px] font-bold w-8 text-center text-[#33040D]">20</span>
                    <button className="w-7 h-7 rounded-full bg-[#33040D] flex items-center justify-center text-white shadow-sm hover:bg-[#4a0614]"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="flex justify-between items-center mb-6 text-[14px] font-medium text-gray-600">
                <span>Total Items in Batch: <strong className="text-gray-900 text-[18px]">170</strong></span>
                <span>Destination: <strong className="text-gray-900">{selectedOutlet}</strong></span>
              </div>
              <button className="w-full py-4 bg-[#33040D] text-white rounded-[16px] font-bold text-[15px] shadow-[0_8px_20px_rgba(51,4,13,0.25)] hover:shadow-[0_8px_25px_rgba(51,4,13,0.35)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <Truck className="w-5 h-5" /> Dispatch to {selectedOutlet}
              </button>
            </div>
          </RimalCard>
        </div>

        {/* Right Column - Active Queues (Takes up 5 cols) */}
        <div className="xl:col-span-5 space-y-8 animate-on-load">
          <RimalCard className="!p-0 h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-[18px] font-bold text-gray-900">Active Dispatch Queue</h2>
              <span className="bg-gray-100 text-gray-600 text-[12px] font-bold px-3 py-1 rounded-full">3 Active</span>
            </div>
            <div className="flex-1 p-6 space-y-4 bg-gray-50/30 overflow-y-auto">
              {dispatchQueue.map((queue, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[12px] font-mono font-bold text-gray-500">{queue.id}</span>
                      <h4 className="text-[15px] font-bold text-gray-900 mt-1 flex items-center gap-2">
                        To: {queue.outlet}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      queue.status === 'Loading' ? 'bg-orange-50 text-orange-600' :
                      queue.status === 'In Transit' ? 'bg-blue-50 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {queue.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-medium text-gray-500">Items: <strong className="text-gray-900">{queue.items}</strong></span>
                    <span className="font-medium text-gray-500 flex items-center gap-1.5">
                      <Truck className="w-4 h-4" /> {queue.driver}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </RimalCard>
        </div>
      </div>

      {/* Bottom Section - Master Stock Table */}
      <div className="animate-on-load">
        <RimalCard className="!p-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-[18px] font-bold text-gray-900">Warehouse Master Stock</h2>
            <button className="text-[13px] font-bold text-[#33040D] hover:underline">View Full Catalog</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider">SKU</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Product & Variant</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Warehouse Location</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right">Available Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockWarehouseStock.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-[13px] font-mono font-medium text-gray-500">{item.sku}</td>
                    <td className="py-4 px-6">
                      <p className="text-[14px] font-bold text-gray-900">{item.name}</p>
                      <p className="text-[12px] font-medium text-gray-500">{item.variant}</p>
                    </td>
                    <td className="py-4 px-6 text-[13px] font-medium text-gray-600 flex items-center gap-2">
                      <Box className="w-4 h-4 text-gray-400" /> {item.location}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`text-[15px] font-bold ${item.alert ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.stock} <span className="text-[11px] text-gray-400 font-medium ml-1">pcs</span>
                      </span>
                      {item.alert && <p className="text-[11px] font-bold text-red-500 mt-1 uppercase">Reorder Needed</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RimalCard>
      </div>

    </div>
  );
}
