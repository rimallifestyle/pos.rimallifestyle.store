'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import { User, Shield, Bell, Building, CheckCircle2, Camera, Loader2, ShoppingCart, Smartphone, Laptop, Send, BellRing, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getUserProfile, updateUserProfile, requestProfilePasswordChange, verifyProfilePasswordChange } from '@/actions/user';
import { uploadImageToCloudinary } from '@/actions/upload';
import { getPosSettings, updatePosSettings } from '@/actions/settings';
import { triggerTestPushNotification, getNotificationConfigStatus } from '@/actions/notifications';
import { Plus, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('Profile');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [securityStep, setSecurityStep] = useState<'request' | 'verify'>('request');
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [notifConfig, setNotifConfig] = useState<{ isConfigured: boolean; appId: string | null }>({ isConfigured: false, appId: null });
  const [devicePermission, setDevicePermission] = useState<string>('default');

  useEffect(() => {
    getNotificationConfigStatus().then(res => setNotifConfig(res));
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDevicePermission(Notification.permission);
    }
  }, []);

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    const res = await triggerTestPushNotification();
    setIsSendingTest(false);
    if (res.success) {
      toast.success(res.message || 'Test push notification sent!');
    } else {
      toast.error(res.error || 'Failed to send test push notification');
    }
  };

  const handleRequestDevicePermission = async () => {
    if (typeof window !== 'undefined' && window.__rimalSubscribeNotifications) {
      await window.__rimalSubscribeNotifications();
      if ('Notification' in window) {
        setDevicePermission(Notification.permission);
        if (Notification.permission === 'granted') {
          toast.success('Push notification permission granted!');
        }
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setDevicePermission(res);
      if (res === 'granted') {
        toast.success('Push notification permission granted!');
      }
    }
  };

  const handlePasswordChangeRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (securityData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsSaving(true);
    const res = await requestProfilePasswordChange(securityData.currentPassword);
    if (res.success) {
      toast.success('OTP sent to your email');
      setSecurityStep('verify');
    } else {
      toast.error(res.error || 'Verification failed');
    }
    setIsSaving(false);
  };

  const handlePasswordChangeVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await verifyProfilePasswordChange(securityData.otp, securityData.newPassword);
    if (res.success) {
      toast.success('Password changed successfully!');
      setSecurityStep('request');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
    } else {
      toast.error(res.error || 'Failed to change password');
    }
    setIsSaving(false);
  };
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=33040D&color=fff&bold=true',
  });

  const [posSettings, setPosSettings] = useState({
    vatEnabled: false,
    vatPercentage: 0,
  });

  useEffect(() => {
    async function fetchProfile() {
      const [data, posData] = await Promise.all([getUserProfile(), getPosSettings()]);
      if (data) {
        const names = data.name ? data.name.split(' ') : ['Super', 'Admin'];
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';
        setProfile({
          firstName,
          lastName,
          email: data.email || '',
          phone: data.phone || '',
          avatar: data.avatar || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=33040D&color=fff&bold=true`,
        });
      }
      if (posData) {
        setPosSettings(posData);
      }
      setIsLoading(false);
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!containerRef.current || isLoading) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    gsap.fromTo(elements, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power3.out' });
  }, [isLoading]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await uploadImageToCloudinary(formData);
    if (res.success && res.url) {
      setProfile(prev => ({ ...prev, avatar: res.url! }));
      toast.success('Avatar uploaded successfully!');
    } else {
      toast.error("Upload failed: " + res.error);
    }
    setIsUploading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append('avatar', profile.avatar); // Add avatar explicitly
    
    const res = await updateUserProfile(formData);
    
    if (res.success) {
      toast.success(res.message || 'Profile updated successfully!');
      // Force reload to update token in cookies if email/name changed
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(res.error || 'Failed to update profile');
    }
    
    setIsSaving(false);
  };

  const handleSavePosSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updatePosSettings(posSettings);
    if (res.success) {
      toast.success(res.message || 'Settings saved successfully');
    } else {
      toast.error(res.error || 'Failed to save settings');
    }
    setIsSaving(false);
  };

  const tabs = [
    { name: 'Profile', icon: User },
    { name: 'POS Settings', icon: ShoppingCart },
    { name: 'Security', icon: Shield },
    { name: 'Notifications', icon: Bell },
    { name: 'Company', icon: Building },
  ];

  return (
    <div ref={containerRef} className="w-full pb-24 font-sans">
      <RimalTopBar 
        title="Settings" 
        subtitle="Manage your account settings and preferences" 
        showSearch={false}
      />

      <div className="animate-on-load mt-4">
        {/* Sleek Horizontal Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-2 pb-4 text-[14px] font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.name 
                  ? 'border-[#33040D] text-[#33040D]' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-[16px] h-[16px]" strokeWidth={2.5} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#33040D]" /></div>
        ) : (
          <>
          {activeTab === 'Profile' && (
            <form onSubmit={handleSaveProfile} className="bg-white border border-gray-200 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 mb-1">Public Profile</h2>
                  <p className="text-[13px] text-gray-500 font-medium">This information will be displayed publicly on invoices.</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="text-[13px] font-bold text-[#33040D] hover:underline cursor-pointer disabled:opacity-50">
                      {isUploading ? 'Uploading...' : 'Upload Avatar'}
                    </button>
                    <p className="text-[11px] text-gray-400 mt-0.5">JPG or PNG, max 1MB</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div onClick={() => !isUploading && fileInputRef.current?.click()} className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 relative group cursor-pointer overflow-hidden shadow-sm">
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-700">First Name</label>
                    <input required name="firstName" type="text" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-4 focus:ring-[#33040D]/10 text-[14px] font-medium text-gray-900 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-700">Last Name</label>
                    <input required name="lastName" type="text" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-4 focus:ring-[#33040D]/10 text-[14px] font-medium text-gray-900 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-700">Email Address</label>
                    <input required name="email" type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-4 focus:ring-[#33040D]/10 text-[14px] font-medium text-gray-900 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-700">Phone Number</label>
                    <input name="phone" type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="+880 1711 223344" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-4 focus:ring-[#33040D]/10 text-[14px] font-medium text-gray-900 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-[13px] text-gray-500 font-medium hidden sm:block">Please save your changes to apply them.</p>
                <button disabled={isSaving || isUploading} type="submit" className="px-6 py-2.5 bg-[#33040D] text-white rounded-lg text-[13px] font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-70 disabled:hover:translate-y-0">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'POS Settings' && (
            <form onSubmit={handleSavePosSettings} className="bg-white border border-gray-200 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                <h2 className="text-[18px] font-bold text-gray-900 mb-1">Point of Sale (POS) Settings</h2>
                <p className="text-[13px] text-gray-500 font-medium">Configure VAT/Tax globally for all POS transactions.</p>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900">Enable VAT/Tax Calculation</h3>
                    <p className="text-[13px] text-gray-500">Automatically add VAT to all POS orders.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={posSettings.vatEnabled} onChange={(e) => setPosSettings({...posSettings, vatEnabled: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#33040D]"></div>
                  </label>
                </div>

                {posSettings.vatEnabled && (
                  <div className="space-y-2 max-w-md">
                    <label className="text-[13px] font-bold text-gray-700">VAT Percentage (%)</label>
                    <div className="relative">
                      <input 
                        required 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="100"
                        value={posSettings.vatPercentage} 
                        onChange={e => setPosSettings({...posSettings, vatPercentage: parseFloat(e.target.value) || 0})} 
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-4 focus:ring-[#33040D]/10 text-[14px] font-medium text-gray-900 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]" 
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-[13px] text-gray-500 font-medium hidden sm:block">Please save your changes to apply them.</p>
                <button disabled={isSaving} type="submit" className="px-6 py-2.5 bg-[#33040D] text-white rounded-lg text-[13px] font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-70 disabled:hover:translate-y-0">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
                  {isSaving ? 'Saving...' : 'Save POS Settings'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'Security' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                <h2 className="text-[18px] font-bold text-gray-900 mb-1">Change Password</h2>
                <p className="text-[13px] text-gray-500 font-medium">Update your password to keep your account secure.</p>
              </div>
              
              <div className="p-8">
                {securityStep === 'request' ? (
                  <form onSubmit={handlePasswordChangeRequest} className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-gray-700">Current Password</label>
                      <input required name="currentPassword" type="password" value={securityData.currentPassword} onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-4 focus:ring-[#33040D]/10 text-[14px] font-medium text-gray-900 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-gray-700">New Password</label>
                      <input required name="newPassword" type="password" value={securityData.newPassword} onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-4 focus:ring-[#33040D]/10 text-[14px] font-medium text-gray-900 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-gray-700">Confirm New Password</label>
                      <input required name="confirmPassword" type="password" value={securityData.confirmPassword} onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-4 focus:ring-[#33040D]/10 text-[14px] font-medium text-gray-900 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />
                    </div>
                    
                    <button disabled={isSaving} type="submit" className="px-6 py-2.5 bg-[#33040D] text-white rounded-lg text-[13px] font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 w-full justify-center disabled:opacity-70 disabled:hover:translate-y-0">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} 
                      {isSaving ? 'Processing...' : 'Request Password Change'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordChangeVerify} className="space-y-6 max-w-md animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-[13px] font-medium mb-4">
                      An OTP has been sent to your email. Please enter it below to confirm your password change.
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-gray-700">Enter OTP</label>
                      <input required name="otp" type="text" maxLength={6} value={securityData.otp} onChange={e => setSecurityData({...securityData, otp: e.target.value})} placeholder="••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-4 focus:ring-[#33040D]/10 text-[20px] tracking-[0.5em] font-bold text-gray-900 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />
                    </div>
                    
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setSecurityStep('request')} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-bold transition-all flex-1">
                        Cancel
                      </button>
                      <button disabled={isSaving} type="submit" className="px-6 py-2.5 bg-[#33040D] text-white rounded-lg text-[13px] font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 flex-1 justify-center disabled:opacity-70">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
                        {isSaving ? 'Verifying...' : 'Verify & Change'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-[#33040D]/10 text-[#33040D] flex items-center justify-center font-bold">
                        <BellRing className="w-4 h-4" />
                      </div>
                      <h2 className="text-[18px] font-extrabold text-gray-900">OneSignal Push Notifications</h2>
                    </div>
                    <p className="text-[13px] text-gray-500 font-medium">
                      Real-time push alerts across Desktop, Android, and iOS PWA apps.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSendTestPush}
                      disabled={isSendingTest}
                      className="px-4 py-2.5 bg-white border border-gray-200 hover:border-[#33040D] text-gray-700 hover:text-[#33040D] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {isSendingTest ? 'Sending Test...' : 'Send Test Push'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleRequestDevicePermission}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                        devicePermission === 'granted'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-[#33040D] text-white hover:bg-[#4a0614]'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {devicePermission === 'granted' ? 'Device Subscribed ✓' : 'Subscribe This Device'}
                    </button>
                  </div>
                </div>

                {/* Status Banners */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Setup Status Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Service Backend Status</p>
                        <p className="text-sm font-black text-gray-900 mt-0.5">
                          {notifConfig.isConfigured ? 'Connected to OneSignal' : 'Config Pending (.env)'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        notifConfig.isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {notifConfig.isConfigured ? 'Active' : 'Setup Required'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">This Device Status</p>
                        <p className="text-sm font-black text-gray-900 mt-0.5">
                          {devicePermission === 'granted' ? 'Push Permission Granted' : devicePermission === 'denied' ? 'Permission Denied in Browser' : 'Not Subscribed Yet'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        devicePermission === 'granted' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {devicePermission}
                      </span>
                    </div>
                  </div>

                  {/* Active Notification Event Triggers */}
                  <div>
                    <h3 className="text-[15px] font-extrabold text-gray-900 mb-3">Live Notification Events</h3>
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                      <div className="p-4 bg-white flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🛍️</span>
                          <div>
                            <h4 className="text-[13px] font-bold text-gray-900">Sale Completed Alert</h4>
                            <p className="text-[12px] text-gray-500 font-medium">Triggers whenever an order or checkout is finalized at any POS terminal.</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">Enabled</span>
                      </div>

                      <div className="p-4 bg-white flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🔐</span>
                          <div>
                            <h4 className="text-[13px] font-bold text-gray-900">POS Login Alert</h4>
                            <p className="text-[12px] text-gray-500 font-medium">Notifies administrators when a cashier or manager enters their PIN and logs in.</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">Enabled</span>
                      </div>

                      <div className="p-4 bg-white flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📦</span>
                          <div>
                            <h4 className="text-[13px] font-bold text-gray-900">Product Added Alert</h4>
                            <p className="text-[12px] text-gray-500 font-medium">Sends an alert whenever a new product with size/color variants is created.</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">Enabled</span>
                      </div>

                      <div className="p-4 bg-white flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🗑️</span>
                          <div>
                            <h4 className="text-[13px] font-bold text-gray-900">Product Deleted Alert</h4>
                            <p className="text-[12px] text-gray-500 font-medium">Instantly notifies when an existing product and inventory are deleted.</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">Enabled</span>
                      </div>
                    </div>
                  </div>

                  {/* Device Platforms */}
                  <div className="p-5 rounded-xl bg-gray-50/60 border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Supported Platforms</h4>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600">
                      <span className="flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5 text-[#33040D]" /> Desktop (Chrome, Safari, Edge)</span>
                      <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-[#33040D]" /> Android (Chrome & Installed App)</span>
                      <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-[#33040D]" /> iOS (iPhone Safari Add-to-Home PWA)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Company' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <h3 className="text-gray-900 font-bold text-lg mb-2">Coming Soon</h3>
              <p className="text-gray-500 text-[14px]">The Company settings panel is currently under development.</p>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
