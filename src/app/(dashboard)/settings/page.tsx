'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import { User, Shield, Bell, Building, CheckCircle2, Camera, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getUserProfile, updateUserProfile } from '@/actions/user';
import { uploadImageToCloudinary } from '@/actions/upload';
import { getPosSettings, updatePosSettings } from '@/actions/settings';
import { Plus, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('Profile');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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

          {['Security', 'Notifications', 'Company'].includes(activeTab) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <h3 className="text-gray-900 font-bold text-lg mb-2">Coming Soon</h3>
              <p className="text-gray-500 text-[14px]">The {activeTab} settings panel is currently under development.</p>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
