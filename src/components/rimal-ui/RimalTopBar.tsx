'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, Store, Check } from 'lucide-react';
import { getCurrentSession } from '@/actions/auth';
import { getOutlets } from '@/actions/outlets';

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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-on-load relative z-[100]">
      <div>
        <p className="text-[13px] text-gray-500 font-medium mb-1.5 tracking-wide">{subtitle}</p>
        <h1 className="text-[34px] font-extrabold text-gray-900 tracking-tight flex items-center gap-2 leading-none">
          {title} {emoji && <span className="text-[28px]">{emoji}</span>}
        </h1>
      </div>
      
      <div className="flex items-center gap-5">
        {actionButtons && (
          <div className="flex items-center gap-3 mr-2">
            {actionButtons}
          </div>
        )}
        
        {showSearch && (
          <div className="relative w-full md:w-[280px]">
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

        {/* Outlet Switcher */}
        {outlets.length > 0 && activeOutlet ? (
          <div className="relative hidden sm:block" ref={dropdownRef}>
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
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
             <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin"></div>
             <span className="text-[12px] text-gray-500 font-medium">Loading outlets...</span>
          </div>
        )}
        
        <div className="flex items-center gap-4 pl-2 border-l border-gray-200">
          <button className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow relative text-gray-400 hover:text-[#33040D]">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          </button>
          <div className="relative cursor-pointer hover:scale-105 transition-transform" title={displayName}>
            <div className="w-11 h-11 rounded-full overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.08)] bg-gray-100">
              <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
            </div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#F4F6FA] rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
