'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  ExternalLink, 
  ShoppingBag, 
  Key, 
  Package, 
  Trash2, 
  AlertCircle, 
  Sparkles,
  Loader2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getRecentNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  clearAllNotifications 
} from '@/actions/notifications';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  url: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync PWA App Icon Badge on Android & iOS 16.4+
  const updateDeviceAppBadge = (count: number) => {
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(() => {});
      } else if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  };

  // Load count
  const refreshCount = async () => {
    try {
      const res = await getUnreadNotificationCount();
      const count = res.count || 0;
      setUnreadCount(count);
      updateDeviceAppBadge(count);
    } catch (err) {
      // quiet fail
    }
  };

  // Load full notification list
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await getRecentNotifications(15);
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
        updateDeviceAppBadge(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCount();
    // Poll for notifications every 25 seconds for real-time alerts
    const interval = setInterval(refreshCount, 25000);

    // Refresh count on window focus (e.g. user switches back to tab or PWA)
    const handleFocus = () => refreshCount();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsAsRead();
    if (res.success) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      updateDeviceAppBadge(0);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markNotificationAsRead(item._id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n._id === item._id ? { ...n, isRead: true } : n));
      updateDeviceAppBadge(Math.max(0, unreadCount - 1));
    }
    setIsOpen(false);
    if (item.url) {
      router.push(item.url);
    }
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
    updateDeviceAppBadge(0);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'SALE':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'POS_LOGIN':
        return <Key className="w-4 h-4 text-indigo-600" />;
      case 'PRODUCT_ADD':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'PRODUCT_DELETE':
        return <Trash2 className="w-4 h-4 text-rose-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Open notifications"
        className="relative w-10 h-10 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all text-gray-500 hover:text-[#33040D] border border-gray-100 hover:border-gray-200 active:scale-95"
      >
        <Bell className="w-[18px] h-[18px] md:w-5 md:h-5 transition-transform" />

        {/* Dynamic Notification Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-[#33040D] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-md animate-in zoom-in duration-150">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-Down Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-[380px] bg-white rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.14)] border border-gray-100 overflow-hidden z-[200] animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-extrabold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#33040D] text-white text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1 text-[11px] font-bold text-[#33040D] hover:bg-[#33040D]/10 rounded-lg transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-[#33040D] animate-spin" />
                <p className="text-xs text-gray-400 font-medium">Loading alerts...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Bell className="w-6 h-6" />
                </div>
                <h4 className="text-[14px] font-bold text-gray-800">No notifications yet</h4>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Alerts for sales, POS logins, and stock changes will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 sm:p-4 flex items-start gap-3 cursor-pointer transition-colors relative group ${
                    item.isRead ? 'bg-white hover:bg-gray-50/70' : 'bg-[#33040D]/[0.03] hover:bg-[#33040D]/[0.06]'
                  }`}
                >
                  {/* Category Icon */}
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200/50 mt-0.5">
                    {getIconForType(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-[12px] font-bold truncate ${item.isRead ? 'text-gray-800' : 'text-gray-900 font-extrabold'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-gray-400 font-medium shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-snug">
                      {item.message}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!item.isRead && (
                    <span className="absolute right-3.5 top-5 w-2 h-2 rounded-full bg-[#33040D]" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between text-xs">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-[#33040D] font-bold flex items-center gap-1 transition-colors"
            >
              Push Settings
            </Link>
            <Link
              href="/sales"
              onClick={() => setIsOpen(false)}
              className="text-[#33040D] font-bold hover:underline flex items-center gap-1"
            >
              View Sales &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
