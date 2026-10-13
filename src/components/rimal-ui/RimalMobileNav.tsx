'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Package, MonitorSmartphone, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';

export default function RimalMobileNav() {
  const pathname = usePathname();

  const handleOpenDrawer = () => {
    document.dispatchEvent(new Event('toggle-mobile-menu'));
  };

  const isPosActive = pathname.startsWith('/pos');
  const isHomeActive = pathname === '/dashboard';
  const isSalesActive = pathname.startsWith('/sales');
  const isProductsActive = pathname.startsWith('/products');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/70 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-[90] lg:hidden pb-safe select-none">
      <div className="flex items-center justify-around px-2 py-1.5 h-16 relative">
        {/* Home */}
        <Link 
          href="/dashboard"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform"
        >
          <div className={clsx(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
            isHomeActive ? "bg-[#33040D]/10 text-[#33040D]" : "text-gray-400"
          )}>
            <Home className="w-[19px] h-[19px]" strokeWidth={isHomeActive ? 2.5 : 2} />
          </div>
          <span className={clsx(
            "text-[10px] font-bold tracking-tight transition-colors leading-none",
            isHomeActive ? "text-[#33040D] font-extrabold" : "text-gray-400"
          )}>
            Home
          </span>
        </Link>

        {/* Sales */}
        <Link 
          href="/sales"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform"
        >
          <div className={clsx(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
            isSalesActive ? "bg-[#33040D]/10 text-[#33040D]" : "text-gray-400"
          )}>
            <FileText className="w-[19px] h-[19px]" strokeWidth={isSalesActive ? 2.5 : 2} />
          </div>
          <span className={clsx(
            "text-[10px] font-bold tracking-tight transition-colors leading-none",
            isSalesActive ? "text-[#33040D] font-extrabold" : "text-gray-400"
          )}>
            Sales
          </span>
        </Link>

        {/* Center Floating POS Terminal Button */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <Link 
            href="/pos"
            className={clsx(
              "w-12 h-12 -mt-6 rounded-full bg-gradient-to-tr from-[#33040D] to-[#5a0a1a] text-white flex items-center justify-center shadow-lg shadow-[#33040D]/30 border-2 border-white active:scale-90 transition-transform relative group",
              isPosActive && "ring-4 ring-[#33040D]/20 scale-105"
            )}
            title="Open POS Terminal"
          >
            <MonitorSmartphone className="w-5 h-5 text-white" strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
          </Link>
          <span className={clsx(
            "text-[10px] font-bold tracking-tight mt-1 transition-colors leading-none",
            isPosActive ? "text-[#33040D] font-extrabold" : "text-gray-600"
          )}>
            POS
          </span>
        </div>

        {/* Products */}
        <Link 
          href="/products"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform"
        >
          <div className={clsx(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
            isProductsActive ? "bg-[#33040D]/10 text-[#33040D]" : "text-gray-400"
          )}>
            <Package className="w-[19px] h-[19px]" strokeWidth={isProductsActive ? 2.5 : 2} />
          </div>
          <span className={clsx(
            "text-[10px] font-bold tracking-tight transition-colors leading-none",
            isProductsActive ? "text-[#33040D] font-extrabold" : "text-gray-400"
          )}>
            Products
          </span>
        </Link>

        {/* All Modules Drawer Menu */}
        <button 
          type="button"
          onClick={handleOpenDrawer}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform"
          aria-label="Open full dashboard navigation"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <LayoutGrid className="w-[19px] h-[19px]" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-gray-400 leading-none">
            Menu
          </span>
        </button>
      </div>
    </div>
  );
}
