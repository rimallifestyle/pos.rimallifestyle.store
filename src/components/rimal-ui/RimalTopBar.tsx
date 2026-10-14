'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, Store, Check } from 'lucide-react';
import { getCurrentSession } from '@/actions/auth';
import { getOutlets } from '@/actions/outlets';
import NotificationBell from '@/components/rimal-ui/NotificationBell';

interface RimalTopBarProps {
  title: string;
  subtitle: string;
  emoji?: string;
  showSearch?: boolean;
  actionButtons?: React.ReactNode;
}

export default function RimalTopBar({ title, subtitle, emoji, showSearch = true, actionButtons }: RimalTopBarProps) {
  const [session, setSession] = useState<any>(null);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [activeOutlet, setActiveOutlet] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      // Load user session
      const data = await getCurrentSession();
      if (data) setSession(data);
      
      // Load outlets for switcher
      const outletData = await getOutlets();
      if (outletData && outletData.length > 0) {
        setOutlets(outletData);
        // Check local storage for previously selected outlet
        const savedId = localStorage.getItem('rimal_active_outlet_id');
        const found = outletData.find((o: any) => o._id === savedId);
        if (found) {
          setActiveOutlet(found);
        } else {
          setActiveOutlet(outletData[0]);
          localStorage.setItem('rimal_active_outlet_id', outletData[0]._id);
        }
      }
    }
    loadData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectOutlet = (outlet: any) => {
    setActiveOutlet(outlet);
    localStorage.setItem('rimal_active_outlet_id', outlet._id);
    setIsDropdownOpen(false);
    // In a real app, you might trigger a context update or page reload here 
    // to refresh data specific to this outlet.
  };

  // Compute initials or use default avatar
  const displayName = session?.name || 'Admin';
  const displayAvatar = session?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=33040D&color=fff&bold=true`;

  return (
    <div className="flex flex-col gap-4 md:gap-6 mb-6 lg:mb-12 animate-on-load relative z-[100]">
      {/* TOP ROW: Header (Hamburger, Title, Avatar) */}
      <div className="flex items-center justify-between w-full">
        
        {/* Left Side: Hamburger + Title */}
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => document.dispatchEvent(new Event('toggle-mobile-menu'))}
            className="lg:hidden w-10 h-10 rounded-[12px] bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:text-[#33040D] transition-all shadow-sm shrink-0 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          
          <div className="flex flex-col">
            <p className="text-[11px] md:text-[13px] text-gray-500 font-bold md:font-medium mb-0.5 md:mb-1.5 uppercase tracking-wider md:normal-case md:tracking-wide">{subtitle}</p>
            <h1 className="text-[20px] md:text-[34px] font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5 md:gap-2 leading-none">
              {title} {emoji && <span className="text-[18px] md:text-[28px]">{emoji}</span>}
            </h1>
          </div>
        </div>

        {/* Right Side: Desktop Actions + Avatar */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Desktop only action buttons */}
          {actionButtons && (
            <div className="hidden md:flex items-center gap-3 mr-2">
              {actionButtons}
            </div>
          )}
          
          {/* Desktop Search */}
          {showSearch && (
            <div className="hidden md:block relative w-[280px]">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-5 py-3 border-0 rounded-full text-[13px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 transition-all outline-none"
                placeholder="Search products..."
              />
            </div>
          )}

          {/* Desktop Outlet Switcher */}
          {outlets.length > 0 && activeOutlet ? (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 cursor-pointer bg-white px-4 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all border border-transparent hover:border-gray-100 group"
              >
                <div className="w-8 h-8 rounded-full bg-[#33040D]/5 flex items-center justify-center text-[#33040D] group-hover:bg-[#33040D] group-hover:text-white transition-colors">
                  <Store className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col pr-1">
                  <span className="text-[13px] font-bold text-gray-900 leading-none truncate max-w-[120px]">{activeOutlet.name}</span>
                  <span className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-widest">{activeOutlet._id.slice(-6)}</span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-[240px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Switch Outlet</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto py-2">
                    {outlets.map((outlet) => (
                      <div 
                        key={outlet._id}
                        onClick={() => handleSelectOutlet(outlet)}
                        className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${
                          activeOutlet._id === outlet._id ? 'bg-[#33040D]/5' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeOutlet._id === outlet._id ? 'bg-[#33040D] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <Store className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[13px] font-bold ${activeOutlet._id === outlet._id ? 'text-[#33040D]' : 'text-gray-700'}`}>
                              {outlet.name}
                            </span>
                            <span className="text-[11px] text-gray-400 truncate max-w-[130px]">{outlet.location}</span>
                          </div>
                        </div>
                        {activeOutlet._id === outlet._id && <Check className="w-4 h-4 text-[#33040D]" strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
               <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin"></div>
               <span className="text-[12px] text-gray-500 font-medium">Loading...</span>
            </div>
          )}

          {/* Avatar and Notification (Visible on both) */}
          <div className="flex items-center gap-2.5 md:gap-4 md:pl-2 md:border-l border-gray-200">
            <NotificationBell />
            <div className="relative cursor-pointer hover:scale-105 transition-transform" title={displayName}>
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden shadow-sm md:shadow-[0_4px_15px_rgba(0,0,0,0.08)] bg-gray-100 border-2 border-white">
                <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE ROW 2: Search, Outlet & Action Buttons */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {outlets.length > 0 && activeOutlet && (
          <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#33040D]/10 text-[#33040D] flex items-center justify-center">
                <Store className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-gray-800">{activeOutlet.name}</span>
            </div>
            {outlets.length > 1 && (
              <select
                value={activeOutlet._id}
                onChange={(e) => {
                  const selected = outlets.find(o => o._id === e.target.value);
                  if (selected) handleSelectOutlet(selected);
                }}
                className="text-[11px] font-bold text-[#33040D] bg-transparent outline-none cursor-pointer"
              >
                {outlets.map((o) => (
                  <option key={o._id} value={o._id}>{o.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {showSearch && (
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-[12px] text-[13px] bg-white focus:ring-2 focus:border-transparent focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none shadow-sm transition-all"
              placeholder="Search products..."
            />
          </div>
        )}
        
        {/* Mobile Action Buttons */}
        {actionButtons && (
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-5 px-5 sm:mx-0 sm:px-0">
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
}
