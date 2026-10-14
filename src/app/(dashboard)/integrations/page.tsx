'use client';

import React, { useState, useEffect } from 'react';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import {
  Blocks,
  Cloud,
  Mail,
  MessageSquare,
  Plus,
  ExternalLink,
  Settings as SettingsIcon,
  Database,
  Activity,
  BellRing,
  Loader2,
  X,
  Trash2,
  Key,
  ShieldCheck,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  testAndSaveSMTP,
  testAndSaveOneSignal,
  getIntegrationStatus,
  getOneSignalSettings,
  disconnectOneSignal,
} from '@/actions/integrations';

const defaultIntegrations = [
  {
    id: 1,
    name: 'OneSignal Push Notifications',
    category: 'Alerts & Notifications',
    description: 'Instant web push notifications across Android, iOS PWA, and desktop for sales, POS logins, and stock.',
    icon: BellRing,
    status: 'disconnected',
    color: 'bg-rose-50 text-[#33040D]',
  },
  {
    id: 2,
    name: 'Cloudinary',
    category: 'Media Storage',
    description: 'Automatically optimize and serve product images in next-gen formats.',
    icon: Cloud,
    status: 'connected',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 3,
    name: 'SMTP Email Service',
    category: 'Communication',
    description: 'Configure custom SMTP server to send invoices, OTPs, and notifications directly to customers.',
    icon: Mail,
    status: 'disconnected',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    id: 4,
    name: 'MongoDB Atlas',
    category: 'Database',
    description: 'Primary cloud database for POS, Inventory, and Admin dashboard.',
    icon: Database,
    status: 'connected',
    color: 'bg-green-50 text-green-600',
  },
  {
    id: 5,
    name: 'Courier (Coming Soon)',
    category: 'Logistics',
    description: 'Sync orders automatically with popular local delivery partners (Steadfast, Pathao, RedX).',
    icon: ExternalLink,
    status: 'disconnected',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    id: 6,
    name: 'Bulk SMS (Coming Soon)',
    category: 'Marketing',
    description: 'Send promotional SMS and order confirmation messages to registered customers.',
    icon: MessageSquare,
    status: 'disconnected',
    color: 'bg-purple-50 text-purple-600',
  },
];

export default function IntegrationsPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [statusMap, setStatusMap] = useState<{ smtp: boolean; cloudinary: boolean; onesignal: boolean }>({
    smtp: false,
    cloudinary: false,
    onesignal: false,
  });

  const [oneSignalConfig, setOneSignalConfig] = useState({
    appId: '',
    restApiKey: '',
    appName: '',
    isConfigured: false,
    source: 'none',
  });

  const loadStatus = async () => {
    const status = await getIntegrationStatus();
    setStatusMap(status);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleOpenOneSignalModal = async () => {
    setActiveModal('OneSignal');
    setIsLoadingConfig(true);
    try {
      const cfg = await getOneSignalSettings();
      setOneSignalConfig(cfg);
    } catch (err) {
      console.error('Failed fetching OneSignal settings:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleOneSignalConfigure = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const res = await testAndSaveOneSignal(formData);

    if (res.success) {
      toast.success(res.message || 'OneSignal configured successfully!');
      setActiveModal(null);
      await loadStatus();
    } else {
      toast.error(res.error || 'Failed to configure OneSignal');
    }

    setIsSaving(false);
  };

  const handleDisconnectOneSignal = async () => {
    if (!confirm('Are you sure you want to disconnect OneSignal? Push notifications will stop working until reconnected.')) {
      return;
    }
    setIsDisconnecting(true);
    const res = await disconnectOneSignal();
    if (res.success) {
      toast.success(res.message || 'OneSignal disconnected successfully');
      setActiveModal(null);
      setOneSignalConfig({ appId: '', restApiKey: '', appName: '', isConfigured: false, source: 'none' });
      await loadStatus();
    } else {
      toast.error(res.error || 'Failed to disconnect');
    }
    setIsDisconnecting(false);
  };

  const handleSMTPConfigure = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const res = await testAndSaveSMTP(formData);
    
    if (res.success) {
      toast.success(res.message || 'SMTP Configured successfully!');
      setActiveModal(null);
      loadStatus();
    } else {
      toast.error(res.error || 'Failed to configure SMTP');
    }
    
    setIsSaving(false);
  };

  // Map default integrations with dynamic status
  const integrations = defaultIntegrations.map((app) => {
    if (app.name === 'OneSignal Push Notifications') {
      return { ...app, status: statusMap.onesignal ? 'connected' : 'disconnected' };
    }
    if (app.name === 'SMTP Email Service') {
      return { ...app, status: statusMap.smtp ? 'connected' : 'disconnected' };
    }
    if (app.name === 'Cloudinary') {
      return { ...app, status: statusMap.cloudinary ? 'connected' : 'disconnected' };
    }
    return app;
  });

  return (
    <div className="flex-1 flex flex-col">
      <RimalTopBar 
        title="Integrations" 
        subtitle="Connect third-party apps and services" 
      />

      <div className="flex-1 p-6 md:p-10 bg-gray-50/30">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">App Store & Integrations</h1>
            <p className="text-sm text-gray-500 font-medium">Manage push notifications, media storage, and connected services from one dashboard</p>
          </div>
          <button 
            onClick={() => toast('Integration request sent to admin team!', { icon: '🚀' })}
            className="px-5 py-2.5 bg-[#33040D] text-white rounded-xl text-[13px] font-bold shadow-lg shadow-[#33040D]/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Request Integration
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {integrations.map((app) => (
            <RimalCard key={app.id} className="relative group overflow-hidden border border-gray-100 hover:border-[#33040D]/20 transition-all hover:shadow-[0_10px_40px_rgba(51,4,13,0.08)]">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${app.color}`}>
                  <app.icon className="w-6 h-6" strokeWidth={2} />
                </div>
                
                {app.status === 'connected' ? (
                  <span className="px-3 py-1 bg-green-50 text-green-600 text-[11px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 border border-green-100">
                    <Activity className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[11px] font-bold uppercase tracking-wider rounded-full">
                    Not Connected
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">{app.name}</h3>
              <p className="text-[13px] text-gray-500 font-medium mb-6 leading-relaxed line-clamp-2 h-10">
                {app.description}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">{app.category}</span>
                <button 
                  onClick={() => {
                    if (app.name === 'OneSignal Push Notifications') {
                      handleOpenOneSignalModal();
                    } else if (app.name === 'SMTP Email Service') {
                      setActiveModal('SMTP');
                    } else if (app.name === 'Cloudinary') {
                      toast.success('Cloudinary storage is active and configured.', { duration: 4000 });
                    } else {
                      toast('Configuration modal coming soon!', { icon: '⚙️' });
                    }
                  }}
                  className="text-[#33040D] text-[13px] font-bold flex items-center gap-1 cursor-pointer transition-colors hover:text-rose-600"
                >
                  <SettingsIcon className="w-4 h-4" /> Configure
                </button>
              </div>
            </RimalCard>
          ))}
        </div>

      </div>

      {/* OneSignal Configuration Modal */}
      {activeModal === 'OneSignal' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#33040D] flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-gray-900">Configure OneSignal Push</h2>
                  <p className="text-[12px] text-gray-500 font-medium">Direct database integration — no .env edits needed</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {isLoadingConfig ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 text-[#33040D] animate-spin" />
                <p className="text-xs font-semibold text-gray-500">Loading current configuration...</p>
              </div>
            ) : (
              <form onSubmit={handleOneSignalConfigure} className="p-6 space-y-4">
                {/* Active Info Banner */}
                {oneSignalConfig.isConfigured && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                    <span className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 
                      OneSignal is currently connected & active
                    </span>
                    <span className="text-[11px] font-semibold bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                      Active
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
                    OneSignal App ID <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required 
                    name="appId" 
                    type="text" 
                    defaultValue={oneSignalConfig.appId}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] font-mono outline-none focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] transition-all bg-gray-50 focus:bg-white" 
                  />
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">Found in OneSignal &gt; Settings &gt; Keys &amp; IDs</p>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
                    OneSignal REST API Key <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required 
                    name="restApiKey" 
                    type="password" 
                    defaultValue={oneSignalConfig.restApiKey}
                    placeholder="os_v2_app_... or your REST API Key" 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] font-mono outline-none focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] transition-all bg-gray-50 focus:bg-white" 
                  />
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">Stored securely in database. Used server-side to dispatch push alerts.</p>
                </div>

                {/* Helpful Instruction Box */}
                <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-600 leading-relaxed font-medium">
                    You do not need to add credentials into <code className="bg-gray-200 px-1 py-0.5 rounded text-[11px] text-gray-800">.env</code>. Once saved here, all sales, POS logins, and inventory events will trigger push notifications across all devices.
                    <div className="mt-1.5">
                      <a 
                        href="https://dashboard.onesignal.com" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#33040D] font-bold underline inline-flex items-center gap-1 hover:text-rose-600"
                      >
                        Open OneSignal Dashboard <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-4 flex items-center justify-between gap-3 border-t border-gray-100">
                  {oneSignalConfig.isConfigured ? (
                    <button 
                      type="button" 
                      onClick={handleDisconnectOneSignal}
                      disabled={isDisconnecting || isSaving}
                      className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-[13px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Disconnect
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-[13px] font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving || isDisconnecting}
                      className="px-5 py-2.5 bg-[#33040D] text-white rounded-xl text-[13px] font-bold shadow-lg shadow-[#33040D]/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying &amp; Saving...</> : 'Verify & Save'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SMTP Modal */}
      {activeModal === 'SMTP' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-500" /> Configure SMTP
              </h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSMTPConfigure} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">SMTP Host</label>
                <input required name="host" type="text" placeholder="smtp.gmail.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] transition-all bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">SMTP Port</label>
                <input required name="port" type="number" placeholder="587" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] transition-all bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Email (User)</label>
                <input required name="user" type="email" placeholder="your_email@gmail.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] transition-all bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">App Password</label>
                <input required name="pass" type="password" placeholder="••••••••••••••••" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] transition-all bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Store Name (From)</label>
                <input name="fromName" type="text" placeholder="Rimal Wearhouse" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] transition-all bg-gray-50 focus:bg-white" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-[13px] font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#33040D] text-white rounded-xl text-[13px] font-bold shadow-lg shadow-[#33040D]/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing...</> : 'Test & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
