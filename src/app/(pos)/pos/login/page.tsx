'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { Lock, Phone, ArrowRight, Store } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { loginWithPin } from '@/actions/auth';

export default function POSLoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll('.animate-login'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'expo.out' }
    );
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const phone = formData.get('phone') as string;
    const pin = formData.get('pin') as string;
    
    const res = await loginWithPin(phone, pin);
    
    if (res.success) {
      toast.success('Login successful!');
      router.push('/pos');
    } else {
      toast.error(res.error || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col items-center justify-center p-6 relative">
      
      {/* Centered POS Login Card */}
      <div className="w-full max-w-[480px] bg-white rounded-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.08)] overflow-hidden relative z-10 animate-login">
        
        {/* Top Branding Header */}
        <div className="w-full bg-[#33040D] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="w-14 h-14 bg-white rounded-[16px] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-[28px] font-black tracking-tighter text-[#33040D] font-serif leading-none mt-1">R.</span>
          </div>
          <h1 className="text-[24px] font-black text-white leading-tight mb-1">
            Point of Sale
          </h1>
          <div className="flex items-center justify-center gap-2 text-white/70">
            <Store className="w-4 h-4" />
            <p className="font-medium text-[13px]">Outlet Access Only</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-10">
          <h2 className="text-[22px] font-black text-gray-900 mb-2">Cashier Login</h2>
          <p className="text-[13px] text-gray-500 font-medium mb-8">Enter your credentials or scan employee badge.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-700">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  required
                  defaultValue="01700000000"
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-[16px] text-[14px] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all"
                  placeholder="Enter Mobile Number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-bold text-gray-700">PIN</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="pin"
                  maxLength={6}
                  required
                  defaultValue=""
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-[16px] text-[14px] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-6 bg-[#33040D] text-white rounded-[16px] font-bold text-[15px] shadow-[0_8px_20px_rgba(51,4,13,0.25)] hover:shadow-[0_8px_25px_rgba(51,4,13,0.35)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? 'Authenticating...' : (
                <>Login <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
