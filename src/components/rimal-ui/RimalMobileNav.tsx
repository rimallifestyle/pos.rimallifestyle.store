'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Package, FileText, Settings } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { title: 'Home', icon: Home, href: '/dashboard' },
  { title: 'Sales', icon: ShoppingCart, href: '/sales' },
  { title: 'Products', icon: Package, href: '/products' },
  { title: 'Reports', icon: FileText, href: '/reports' },
  { title: 'Settings', icon: Settings, href: '/settings' },
];

export default function RimalMobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] z-[90] lg:hidden pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 p-2 min-w-[64px]"
            >
              <div className={clsx(
                "w-10 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                isActive ? "bg-[#33040D] text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              )}>
                <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={clsx(
                "text-[10px] font-bold transition-colors",
                isActive ? "text-[#33040D]" : "text-gray-400"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
