'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  Crown,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { logoutUser, getCurrentSession } from '@/actions/auth';

const menuGroups = [
  {
    group: 'Operations',
    items: [
      { title: 'Dashboard', icon: Home, href: '/dashboard' },
      { title: 'POS Terminal', icon: MonitorSmartphone, href: '/pos', badge: 'LIVE', isHighlight: true },
      { title: 'Sales History', icon: FileText, href: '/sales' },
    ]
  },
  {
    group: 'Inventory',
    items: [
      { title: 'Products', icon: Package, href: '/products' },
      { title: 'Barcodes', icon: Barcode, href: '/barcodes' },
      { title: 'Stock & Warehouse', icon: Archive, href: '/inventory' },
    ]
  },
  {
    group: 'Retail & CRM',
    items: [
      { title: 'Outlets', icon: Store, href: '/outlets' },
      { title: 'Customers', icon: Users, href: '/customers' },
      { title: 'Memberships', icon: Crown, href: '/memberships' },
      { title: 'Staff & Team', icon: Users, href: '/users' },
    ]
  },
  {
    group: 'System',
    items: [
      { title: 'Reports & Analytics', icon: FileText, href: '/reports' },
      { title: 'Integrations', icon: Blocks, href: '/integrations' },
      { title: 'Settings', icon: Settings, href: '/settings' },
    ]
  }
];

export default function RimalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLElement>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await getCurrentSession();
        if (data) setSession(data);
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/admin/login');
  };

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileOpen(false);
    
    if (sidebarRef.current && window.innerWidth >= 1024) {
      gsap.fromTo(sidebarRef.current, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
    }
  }, [pathname]);

  useEffect(() => {
    const toggleMenu = () => setIsMobileOpen(prev => !prev);
    const closeMenu = () => setIsMobileOpen(false);
    document.addEventListener('toggle-mobile-menu', toggleMenu);
    document.addEventListener('close-mobile-menu', closeMenu);
    return () => {
      document.removeEventListener('toggle-mobile-menu', toggleMenu);
      document.removeEventListener('close-mobile-menu', closeMenu);
    };
  }, []);

  const userName = session?.name || 'Administrator';
  const userRole = session?.role || 'Super Admin';
  const userAvatar = session?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=33040D&color=fff&bold=true`;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[190] lg:hidden backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside 
        ref={sidebarRef}
        className={clsx(
          "w-[270px] h-screen bg-white flex flex-col fixed left-0 top-0 z-[200] border-r border-gray-100 shadow-[2px_0_24px_rgba(0,0,0,0.03)] transition-transform duration-300 ease-in-out lg:translate-x-0 select-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* BRAND HEADER */}
        <div className="pt-6 pb-5 px-5 flex items-center justify-between border-b border-gray-100/80 bg-gradient-to-b from-gray-50/50 to-white">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-[12px] overflow-hidden shadow-sm shadow-[#33040D]/20 border border-gray-200/60 shrink-0 group-hover:scale-105 transition-transform bg-white">
              <Image src="/logo.jpg" alt="Rimal Logo" width={40} height={40} className="w-full h-full object-cover" priority />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[18px] text-gray-900 tracking-tight leading-none">Rimal</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#33040D]/5 text-[#33040D] tracking-wider">POS</span>
              </div>
              <span className="text-[11px] text-gray-400 font-semibold mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Warehouse & POS
              </span>
            </div>
          </Link>

          {/* Close button for Mobile Drawer */}
          <button 
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* SCROLLABLE NAVIGATION MODULES */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">
                {group.group}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={clsx(
                        "group relative flex items-center justify-between w-full px-3 py-2.5 rounded-[12px] transition-all duration-200 text-[13px]",
                        isActive 
                          ? "bg-[#33040D] text-white font-bold shadow-md shadow-[#33040D]/25" 
                          : item.isHighlight
                            ? "text-[#33040D] font-bold bg-[#33040D]/5 hover:bg-[#33040D]/10"
                            : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 font-semibold"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={clsx(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isActive 
                            ? "bg-white/15 text-white" 
                            : item.isHighlight
                              ? "bg-[#33040D] text-white"
                              : "text-gray-400 group-hover:text-gray-700 group-hover:bg-gray-200/50"
                        )}>
                          <item.icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className="truncate">{item.title}</span>
                      </div>

                      {/* Right Badge or Chevron */}
                      {item.badge ? (
                        <span className={clsx(
                          "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0",
                          isActive 
                            ? "bg-white/20 text-white" 
                            : "bg-emerald-100 text-emerald-700"
                        )}>
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* USER PROFILE & FOOTER */}
        <div className="p-3.5 border-t border-gray-100 bg-gray-50/60 mt-auto">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200/70 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-200 shrink-0">
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-extrabold text-gray-900 truncate leading-tight">{userName}</p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-[#33040D]" /> {userRole}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Link 
                href="/settings" 
                title="Settings"
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
