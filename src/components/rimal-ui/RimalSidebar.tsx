'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import gsap from 'gsap';
import { 
  Home, 
  Package, 
  Archive, 
  Store, 
  MonitorSmartphone, 
  FileText, 
  Settings,
  Barcode,
  LogOut,
  Blocks,
  Users,
  Crown
} from 'lucide-react';
import clsx from 'clsx';
import { logoutUser } from '@/actions/auth';

const menuItems = [
  { title: 'Dashboard', icon: Home, href: '/dashboard' },
  { title: 'Products', icon: Package, href: '/products' },
  { title: 'Barcodes', icon: Barcode, href: '/barcodes' },
  { title: 'Inventory', icon: Archive, href: '/inventory' },
  { title: 'Outlets', icon: Store, href: '/outlets' },
  { title: 'Customers', icon: Users, href: '/customers' },
  { title: 'Memberships', icon: Crown, href: '/memberships' },
  { title: 'Sales History', icon: FileText, href: '/sales' },
  { title: 'POS', icon: MonitorSmartphone, href: '/pos' },
  { title: 'Team', icon: Users, href: '/users' },
  { title: 'Reports', icon: FileText, href: '/reports' },
  { title: 'Integrations', icon: Blocks, href: '/integrations' },
];

export default function RimalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLElement>(null);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/admin/login');
  };

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(sidebarRef.current, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'expo.out' });
    }
  }, [pathname]);

  return (
    <aside 
      ref={sidebarRef}
      className="w-[260px] h-screen bg-white flex flex-col fixed left-0 top-0 overflow-y-auto z-50 border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.01)]"
    >
      <div className="pt-8 pb-10 px-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-[12px] overflow-hidden shadow-md shadow-[#33040D]/20 shrink-0">
          <Image src="/logo.jpg" alt="Rimal Logo" width={40} height={40} className="w-full h-full object-cover" />
        </div>
        <span className="font-extrabold text-[20px] text-gray-900 tracking-tight">Rimal</span>
      </div>
      
      <div className="px-6 mb-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
      </div>
      
      <nav className="flex-1 flex flex-col gap-1.5 w-full px-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.title}
              href={item.href}
              className={clsx(
                "relative flex items-center gap-3.5 w-full px-4 py-3 rounded-[14px] transition-all duration-200 group font-semibold text-[14px]",
                isActive 
                  ? "bg-[#33040D]/5 text-[#33040D]" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#33040D] rounded-r-full"></div>
              )}
              <item.icon 
                className={clsx(
                  "w-[20px] h-[20px] transition-colors", 
                  isActive ? "text-[#33040D]" : "text-gray-400 group-hover:text-gray-600"
                )} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="pb-8 w-full px-4 mt-auto border-t border-gray-100 pt-6">
        <div className="px-2 mb-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Preferences</p>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <Link
            href="/settings"
            className={clsx(
              "relative flex items-center gap-3.5 w-full px-4 py-3 rounded-[14px] transition-all duration-200 group font-semibold text-[14px]",
              pathname.startsWith('/settings') 
                ? "bg-[#33040D]/5 text-[#33040D]" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {pathname.startsWith('/settings') && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#33040D] rounded-r-full"></div>
            )}
            <Settings 
              className={clsx("w-[20px] h-[20px] transition-colors", pathname.startsWith('/settings') ? "text-[#33040D]" : "text-gray-400 group-hover:text-gray-600")} 
              strokeWidth={pathname.startsWith('/settings') ? 2.5 : 2} 
            />
            Settings
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 w-full px-4 py-3 rounded-[14px] text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group font-semibold text-[14px]"
          >
            <LogOut className="w-[20px] h-[20px] text-gray-400 group-hover:text-red-500 transition-colors" strokeWidth={2} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
