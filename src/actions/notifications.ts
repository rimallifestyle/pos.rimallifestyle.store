'use server';

import dbConnect from '@/lib/rimal-db';
import Notification from '@/models/Notification';
import { sendTestPushNotification, getActiveOneSignalCredentials } from '@/lib/onesignal';
import { revalidatePath } from 'next/cache';

export async function triggerTestPushNotification() {
  try {
    const res = await sendTestPushNotification();
    if (!res.success && !res.skipped) {
      return { success: false, error: typeof res.error === 'object' ? JSON.stringify(res.error) : res.error };
    }
    revalidatePath('/dashboard');
    return { 
      success: true, 
      message: res.skipped 
        ? 'In-app test notification created! (OneSignal skipped — configure in Integrations for phone push).' 
        : 'Test push notification sent successfully across all subscribed devices!' 
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send notification' };
  }
}

export async function getNotificationConfigStatus() {
  const { appId, apiKey } = await getActiveOneSignalCredentials();

  return {
    isConfigured: Boolean(appId && apiKey),
    appId: appId ? `${appId.slice(0, 8)}...` : null,
  };
}

/**
 * Fetch recent notifications and unread count
 */
export async function getRecentNotifications(limit = 10) {
  try {
    await dbConnect();
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ isRead: false }),
    ]);

    const formatted = notifications.map((n: any) => ({
      _id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type || 'SYSTEM',
      url: n.url || '/dashboard',
      isRead: Boolean(n.isRead),
      createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
    }));

    return {
      success: true,
      notifications: formatted,
      unreadCount,
    };
  } catch (error: any) {
    console.error('Failed fetching notifications:', error);
    return {
      success: false,
      notifications: [],
      unreadCount: 0,
      error: error.message || 'Failed to fetch notifications',
    };
  }
}

/**
 * Lightweight unread notification counter for topbars, headers, and app badge
 */
export async function getUnreadNotificationCount() {
  try {
    await dbConnect();
    const count = await Notification.countDocuments({ isRead: false });
    return { count };
  } catch (error) {
    return { count: 0 };
  }
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsRead(id: string) {
  try {
    await dbConnect();
    await Notification.findByIdAndUpdate(id, { isRead: true });
    const count = await Notification.countDocuments({ isRead: false });
    return { success: true, unreadCount: count };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    await dbConnect();
    await Notification.updateMany({ isRead: false }, { isRead: true });
    return { success: true, unreadCount: 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string) {
  try {
    await dbConnect();
    await Notification.findByIdAndDelete(id);
    const count = await Notification.countDocuments({ isRead: false });
    return { success: true, unreadCount: count };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  try {
    await dbConnect();
    await Notification.deleteMany({});
    return { success: true, unreadCount: 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
