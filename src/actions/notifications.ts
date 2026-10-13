'use server';

import { sendTestPushNotification } from '@/lib/onesignal';

export async function triggerTestPushNotification() {
  try {
    const res = await sendTestPushNotification();
    if (res.skipped) {
      return { 
        success: false, 
        error: 'OneSignal App ID and REST API Key are not set in .env yet. Please add NEXT_PUBLIC_ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY.' 
      };
    }
    if (!res.success) {
      return { success: false, error: typeof res.error === 'object' ? JSON.stringify(res.error) : res.error };
    }
    return { success: true, message: 'Test push notification sent successfully!' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send notification' };
  }
}

export async function getNotificationConfigStatus() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  return {
    isConfigured: Boolean(appId && apiKey),
    appId: appId ? `${appId.slice(0, 8)}...` : null,
  };
}
