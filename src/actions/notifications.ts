'use server';

import { sendTestPushNotification, getActiveOneSignalCredentials } from '@/lib/onesignal';

export async function triggerTestPushNotification() {
  try {
    const res = await sendTestPushNotification();
    if (res.skipped) {
      return { 
        success: false, 
        error: 'OneSignal is not configured yet. Please configure OneSignal in Integrations.' 
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
  const { appId, apiKey } = await getActiveOneSignalCredentials();

  return {
    isConfigured: Boolean(appId && apiKey),
    appId: appId ? `${appId.slice(0, 8)}...` : null,
  };
}
