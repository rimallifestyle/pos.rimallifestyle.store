'use client';

import React from 'react';
import { Search, Bell, Barcode, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function RimalHeader() {
  return (
    <header className="h-[84px] bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <div className="flex-1 max-w-2xl flex items-center gap-6">
        <div className="relative w-full max-w-[420px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-[18px] w-[18px] text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-2.5 border-0 rounded-full text-[13px] bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all placeholder-gray-400 font-medium"
            placeholder="Search products, barcode, SKU, outlet..."
          />
        </div>
        
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
          <Barcode className="h-4 w-4" />
          Scan Barcode
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 cursor-pointer bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 shadow-sm border border-gray-100">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-gray-800 leading-none">Rimal Uttara</span>
            <span className="text-[11px] text-gray-500 mt-1 font-medium">UTT-01</span>
          </div>
          <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <button className="relative text-gray-500 hover:text-gray-900 transition-colors p-2">
          <Bell className="h-[22px] w-[22px]" />
          <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
          <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 bg-gray-100">
            <img src="https://ui-avatars.com/api/?name=Admin&background=33040D&color=fff&bold=true" alt="Admin" className="w-full h-full object-cover" />
          </div>
          <div className="text-left hidden md:block">
            <p className="text-[13px] font-bold text-gray-900 leading-none">Admin</p>
            <p className="text-[11px] font-medium text-gray-500 mt-1">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
