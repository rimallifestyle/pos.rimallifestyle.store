'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { loginUser, verifyAdminOtp, requestPasswordReset, resetPassword } from '@/actions/auth';

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'login' | 'otp' | 'forgot' | 'reset'>('login');
  const [authEmail, setAuthEmail] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll('.animate-login'),
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'expo.out' }
    );
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    if (step === 'login') {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const res = await loginUser(email, password);
      
      if (res.success && res.requireOtp) {
        toast.success('OTP sent to your email!');
        setAuthEmail(email);
        setStep('otp');
      } else if (res.success && !res.requireOtp) {
        toast.success('Login successful!');
        if (res.role === 'CASHIER') {
          router.push('/pos');
        } else {
          router.push('/dashboard');
        }
      } else {
        toast.error(res.error || 'Login failed');
      }
    } else if (step === 'otp') {
      const otp = formData.get('otp') as string;
      const res = await verifyAdminOtp(authEmail, otp);
      
      if (res.success) {
        toast.success('Login successful!');
        if (res.role === 'CASHIER') {
          router.push('/pos');
        } else {
          router.push('/dashboard');
        }
      } else {
        toast.error(res.error || 'Invalid OTP');
      }
    } else if (step === 'forgot') {
      const email = formData.get('email') as string;
      const res = await requestPasswordReset(email);
      if (res.success) {
        toast.success('Reset code sent to your email!');
        setAuthEmail(email);
        setStep('reset');
      } else {
        toast.error(res.error || 'Failed to send reset code');
      }
    } else if (step === 'reset') {
      const otp = formData.get('otp') as string;
      const newPassword = formData.get('password') as string;
      const res = await resetPassword(authEmail, otp, newPassword);
      if (res.success) {
        toast.success('Password reset successful! Please login.');
        setStep('login');
      } else {
        toast.error(res.error || 'Failed to reset password');
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div ref={containerRef} className="h-dvh min-h-[100dvh] bg-[#F4F6FA] flex flex-col justify-center items-center p-3 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-white rounded-full blur-[120px] opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#33040D]/10 rounded-full blur-[120px] opacity-60 pointer-events-none"></div>

      <div className="w-full max-w-[1000px] bg-white rounded-[20px] sm:rounded-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row relative z-10 animate-login my-auto">
        
        {/* Left Side - Brand & Info */}
        <div className="w-full md:w-[45%] bg-[#33040D] p-4 sm:p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-row items-center gap-3 sm:gap-4 md:block">
            <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-[10px] sm:rounded-[14px] md:rounded-[16px] flex items-center justify-center shrink-0 md:mb-8 shadow-lg">
              <span className="text-[20px] sm:text-[28px] md:text-[32px] font-black tracking-tighter text-[#33040D] font-serif leading-none mt-0.5 md:mt-1">R.</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] sm:text-[20px] md:text-[40px] font-black text-white leading-tight md:mb-4 whitespace-nowrap md:whitespace-normal">
                Warehouse &<br className="hidden md:block" /> Admin Hub
              </h1>
              <p className="text-white/70 font-medium text-[11px] sm:text-[13px] md:text-[15px] leading-relaxed max-w-[280px] truncate sm:whitespace-normal">
                Secure access portal for Administrators & Managers.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 md:mt-12 bg-white/10 backdrop-blur-md rounded-[20px] p-5 md:p-6 border border-white/10 hidden md:block">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
              <h3 className="text-white font-bold text-[14px]">Admin / Manager Access</h3>
            </div>
            <p className="text-white/60 text-[12px] font-medium leading-relaxed">
              Log in to manage catalog, transfer inventory, and view business analytics.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-[55%] p-4 sm:p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-[400px] w-full mx-auto">
            <h2 className="text-[18px] sm:text-[26px] md:text-[28px] font-black text-gray-900 mb-0.5 md:mb-2">Welcome Back</h2>
            <p className="text-[12px] md:text-[14px] text-gray-500 font-medium mb-3 md:mb-6">Sign in to your account.</p>

            <form ref={formRef} onSubmit={handleLogin} className="space-y-3 md:space-y-5">
              {step === 'login' ? (
                <>
                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[12px] md:text-[13px] font-bold text-gray-700">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        defaultValue="admin@rimal.com"
                        className="block w-full pl-9 md:pl-12 pr-4 py-2.5 md:py-3.5 border border-gray-200 rounded-[12px] md:rounded-[16px] text-[14px] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center">
                      <label className="text-[12px] md:text-[13px] font-bold text-gray-700">Password</label>
                      <button type="button" onClick={() => setStep('forgot')} className="text-[11px] md:text-[12px] font-bold text-[#33040D] hover:underline p-0.5">Forgot?</button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      </div>
                      <input
                        name="password"
                        type="password"
                        required
                        className="block w-full pl-9 md:pl-12 pr-4 py-2.5 md:py-3.5 border border-gray-200 rounded-[12px] md:rounded-[16px] text-[14px] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </>
              ) : step === 'otp' ? (
                <div className="space-y-1.5 md:space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center">
                    <label className="text-[12px] md:text-[13px] font-bold text-gray-700">One-Time Password (OTP)</label>
                    <button type="button" onClick={() => setStep('login')} className="text-[11px] md:text-[12px] font-bold text-[#33040D] hover:underline p-0.5">Change Email</button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <input
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      onChange={(e) => {
                        if (e.target.value.length === 6) {
                          formRef.current?.requestSubmit();
                        }
                      }}
                      className="block w-full pl-9 md:pl-12 pr-4 py-2.5 md:py-3.5 border border-gray-200 rounded-[12px] md:rounded-[16px] text-[18px] md:text-[20px] tracking-[0.35em] md:tracking-[0.5em] text-center bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-bold placeholder-gray-400 outline-none transition-all"
                      placeholder="••••••"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">Please enter the 6-digit code sent to {authEmail || 'your email'}.</p>
                </div>
              ) : step === 'forgot' ? (
                <div className="space-y-1.5 md:space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <label className="text-[12px] md:text-[13px] font-bold text-gray-700">Email Address for Reset</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      className="block w-full pl-9 md:pl-12 pr-4 py-2.5 md:py-3.5 border border-gray-200 rounded-[12px] md:rounded-[16px] text-[14px] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                  <button type="button" onClick={() => setStep('login')} className="text-[11px] md:text-[12px] text-gray-500 hover:text-gray-900 mt-1.5 block font-bold">Back to Login</button>
                </div>
              ) : (
                <div className="space-y-2.5 md:space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1 md:space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[12px] md:text-[13px] font-bold text-gray-700">Reset Code</label>
                      <button type="button" onClick={() => setStep('login')} className="text-[11px] md:text-[12px] font-bold text-[#33040D] hover:underline p-0.5">Back to Login</button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      </div>
                      <input
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        className="block w-full pl-9 md:pl-12 pr-4 py-2.5 md:py-3.5 border border-gray-200 rounded-[12px] md:rounded-[16px] text-[18px] md:text-[20px] tracking-[0.35em] md:tracking-[0.5em] text-center bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-bold placeholder-gray-400 outline-none transition-all"
                        placeholder="••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[12px] md:text-[13px] font-bold text-gray-700">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      </div>
                      <input
                        name="password"
                        type="password"
                        required
                        className="block w-full pl-9 md:pl-12 pr-4 py-2.5 md:py-3.5 border border-gray-200 rounded-[12px] md:rounded-[16px] text-[14px] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 md:py-4 mt-3 md:mt-6 bg-[#33040D] text-white rounded-[12px] md:rounded-[16px] font-bold text-[14px] md:text-[15px] shadow-[0_8px_20px_rgba(51,4,13,0.25)] hover:shadow-[0_8px_25px_rgba(51,4,13,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
              >
                {isLoading ? 'Processing...' : (
                  <>{step === 'login' ? 'Send OTP' : step === 'forgot' ? 'Send Reset Code' : step === 'reset' ? 'Reset Password' : 'Verify & Login'} <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
}
