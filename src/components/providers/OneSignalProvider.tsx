'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Script from 'next/script';
import { Bell, X, Share2, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';
import { getPublicOneSignalConfig } from '@/actions/integrations';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
    __rimalSubscribeNotifications?: () => Promise<void>;
  }
}

export default function OneSignalProvider() {
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>('unknown');
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [appId, setAppId] = useState<string | null>(
    process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || null
  );

  const initAttemptedRef = useRef(false);

  const setupOneSignalInstance = useCallback((targetAppId: string) => {
    if (!targetAppId || typeof window === 'undefined') return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        await OneSignal.init({
          appId: targetAppId,
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/' },
          notifyButton: {
            enable: false, // Using our custom UI
          },
          allowLocalhostAsSecureOrigin: true,
        });

        setIsInitialized(true);

        // Update permission state
        if (OneSignal.Notifications) {
          const isEnabled = OneSignal.Notifications.permission;
          if (isEnabled) {
            setPermission(Notification.permission);
          }

          OneSignal.Notifications.addEventListener('permissionChange', () => {
            if (typeof window !== 'undefined' && 'Notification' in window) {
              setPermission(Notification.permission);
            }
          });

          // Handle incoming push when app is in foreground
          OneSignal.Notifications.addEventListener('foregroundWillDisplay', () => {
            if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
              navigator.setAppBadge().catch(() => {});
            }
          });
        }
      } catch (err) {
        console.warn('[OneSignal] Initialization notice:', err);
      }
    });

    // Provide global helper function for settings button
    window.__rimalSubscribeNotifications = async () => {
      if (window.OneSignal && window.OneSignal.Notifications) {
        await window.OneSignal.Notifications.requestPermission();
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setPermission(Notification.permission);
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        const res = await Notification.requestPermission();
        setPermission(res);
      }
    };
  }, []);

  useEffect(() => {
    // Detect iOS & Standalone PWA mode
    if (typeof window !== 'undefined') {
      const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(iosDevice);

      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);

      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    }

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('rimal_push_prompt_dismissed');
    if (dismissed === 'true') {
      setIsPromptDismissed(true);
    }

    // Dynamically retrieve configured App ID from database
    let isMounted = true;
    getPublicOneSignalConfig().then((cfg) => {
      if (isMounted && cfg?.appId) {
        setAppId(cfg.appId);
        if (!initAttemptedRef.current) {
          initAttemptedRef.current = true;
          setupOneSignalInstance(cfg.appId);
        }
      }
    }).catch(err => {
      console.warn('[OneSignal] Failed loading public config:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [setupOneSignalInstance]);

  const handleInitScriptLoad = () => {
    if (appId && !initAttemptedRef.current) {
      initAttemptedRef.current = true;
      setupOneSignalInstance(appId);
    }
  };

  const handleEnableNotifications = async () => {
    setIsSubscribing(true);
    try {
      if (window.OneSignal && window.OneSignal.Notifications) {
        await window.OneSignal.Notifications.requestPermission();
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        await Notification.requestPermission();
      }
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    } catch (err) {
      console.error('[OneSignal] Request permission failed:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setIsPromptDismissed(true);
    sessionStorage.setItem('rimal_push_prompt_dismissed', 'true');
  };

  // Do not show banner if already granted, denied, dismissed, or no App ID configured
  const showBanner = appId && permission !== 'granted' && !isPromptDismissed;

  return (
    <>
      {/* OneSignal Web SDK v16 */}
      {appId && (
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
          onLoad={handleInitScriptLoad}
        />
      )}

      {/* Modern Slide-Up Push Notification Opt-In Banner */}
      {showBanner && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[180] max-w-[380px] w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#33040D] text-white rounded-2xl p-4.5 shadow-[0_16px_45px_rgba(51,4,13,0.45)] border border-white/15 relative overflow-hidden backdrop-blur-md">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors p-1"
              aria-label="Dismiss notification banner"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Special Instructions for iPhone Safari Users (iOS Web Push requires Add to Home Screen) */}
            {isIOS && !isStandalone ? (
              <div>
                <div className="flex items-start gap-3 mr-4">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-white mt-0.5 border border-white/10">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-extrabold text-white leading-tight">iPhone Push Notifications</h4>
                    <p className="text-[11px] text-white/80 font-medium mt-1 leading-snug">
                      To receive push alerts on iPhone: Tap the <strong className="text-white">Share</strong> button below, select <strong className="text-white">Add to Home Screen</strong>, then open the app from your home screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-white/10 text-[11px]">
                  <span className="text-white/60 font-semibold flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" /> Tap Share &rarr; Add to Home
                  </span>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-3 py-1.5 bg-white/15 hover:bg-white/20 text-white font-bold rounded-lg transition-colors"
                  >
                    Got It
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Prompt for Android Chrome, iOS PWA, and Desktop */
              <div>
                <div className="flex items-start gap-3 mr-4">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-white mt-0.5 border border-white/10">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-extrabold text-white leading-tight">Enable Push Alerts</h4>
                    <p className="text-[11px] text-white/80 font-medium mt-1 leading-snug">
                      Get instant alerts on this device whenever a sale is completed, cashier logs in, or stock changes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="flex-1 py-2 text-[11px] font-bold text-white/70 hover:text-white transition-colors text-center"
                  >
                    Later
                  </button>
                  <button
                    type="button"
                    onClick={handleEnableNotifications}
                    disabled={isSubscribing}
                    className="flex-1 py-2 bg-white text-[#33040D] rounded-xl text-[11px] font-black shadow-md hover:bg-gray-100 transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-70"
                  >
                    <Bell className="w-3 h-3" />
                    {isSubscribing ? 'Enabling...' : 'Enable Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
