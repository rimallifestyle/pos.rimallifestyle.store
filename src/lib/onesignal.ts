/**
 * OneSignal Server-Side Push Notification Service
 * Sends push notifications to subscribed devices across Android, iOS PWA, and desktop browsers.
 */

interface SendPushOptions {
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

import dbConnect from '@/lib/rimal-db';
import Settings from '@/models/Settings';

export async function getActiveOneSignalCredentials() {
  try {
    await dbConnect();
    const settings = await Settings.findOne({ type: 'onesignal' }).lean();
    if (settings?.config?.appId && settings?.config?.restApiKey) {
      return {
        appId: settings.config.appId as string,
        apiKey: settings.config.restApiKey as string,
      };
    }
  } catch (err) {
    console.warn('[OneSignal] Database lookup failed, checking env:', err);
  }

  const envAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID;
  const envApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (envAppId && envApiKey) {
    return { appId: envAppId, apiKey: envApiKey };
  }

  return { appId: null, apiKey: null };
}

import Notification from '@/models/Notification';

export async function sendPushNotification({ title, message, url, data }: SendPushOptions) {
  // 1. Always record in-app notification in database for live badge count & notification drawer
  try {
    await dbConnect();
    await Notification.create({
      title,
      message,
      type: data?.type || 'SYSTEM',
      url: url || '/dashboard',
      isRead: false,
      data: data || {},
    });
  } catch (dbErr) {
    console.warn('[Notification DB] Could not persist notification to database:', dbErr);
  }

  // 2. Fetch OneSignal credentials
  const { appId, apiKey } = await getActiveOneSignalCredentials();

  if (!appId || !apiKey) {
    console.warn('[OneSignal] Skipped remote push notification: OneSignal credentials not configured.');
    return { 
      success: true, // Still marked true because in-app notification was successfully created
      skipped: true, 
      message: 'In-app notification saved. OneSignal push skipped (not configured in Integrations).' 
    };
  }

  try {
    const baseUrl = 'https://pos.rimallifestyle.store';
    const targetUrl = url ? (url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : '/' + url}`) : `${baseUrl}/dashboard`;

    const payload = {
      app_id: appId,
      included_segments: ['Total Subscriptions'],
      headings: { en: title },
      contents: { en: message },
      url: targetUrl,
      web_url: targetUrl,
      data: data || {},
      // iOS PWA Web Push & Badge increment
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      ios_sound: 'default',
      // Android Web Push & High Priority wakeup
      priority: 10,
      android_visibility: 1,
      android_sound: 'default',
      // Web Push icon & badge
      chrome_web_badge: `${baseUrl}/icon-192.png`,
      chrome_web_icon: `${baseUrl}/icon-192.png`,
      firefox_icon: `${baseUrl}/icon-192.png`,
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[OneSignal] API error response:', result);
      return { success: false, error: result.errors || 'OneSignal API failed' };
    }

    console.log('[OneSignal] Push notification sent successfully:', result);
    return { success: true, result };
  } catch (error: any) {
    console.error('[OneSignal] Network or execution error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * 1. Push notification on completed sale
 */
export async function sendSalePushNotification(params: {
  invoiceId: string;
  total: number;
  itemsCount: number;
  customerName?: string;
  outletName?: string;
}) {
  const title = `🛍️ New Sale: ৳ ${params.total.toLocaleString()}`;
  const customer = params.customerName && params.customerName !== 'Walk-in Customer' ? ` to ${params.customerName}` : '';
  const outlet = params.outletName ? ` at ${params.outletName}` : '';
  const message = `Invoice #${params.invoiceId} (${params.itemsCount} items)${customer}${outlet}`;

  return await sendPushNotification({
    title,
    message,
    url: '/sales',
    data: { type: 'SALE_COMPLETED', invoiceId: params.invoiceId }
  });
}

/**
 * 2. Push notification on POS terminal login
 */
export async function sendPosLoginPushNotification(params: {
  userName: string;
  userRole?: string;
  outletName?: string;
}) {
  const title = `🔐 POS Login: ${params.userName}`;
  const outlet = params.outletName ? ` at ${params.outletName}` : '';
  const message = `${params.userRole || 'Cashier'} logged into the POS terminal${outlet}.`;

  return await sendPushNotification({
    title,
    message,
    url: '/pos',
    data: { type: 'POS_LOGIN', userName: params.userName }
  });
}

/**
 * 3. Push notification on product add
 */
export async function sendProductAddedPushNotification(params: {
  productTitle: string;
  variantCount?: number;
  category?: string;
}) {
  const title = `📦 New Product Added`;
  const vars = params.variantCount ? ` (${params.variantCount} variants)` : '';
  const cat = params.category ? ` in ${params.category}` : '';
  const message = `"${params.productTitle}"${vars}${cat} was added to the catalog.`;

  return await sendPushNotification({
    title,
    message,
    url: '/products',
    data: { type: 'PRODUCT_ADDED', title: params.productTitle }
  });
}

/**
 * 4. Push notification on product delete
 */
export async function sendProductDeletedPushNotification(params: {
  productTitle: string;
}) {
  const title = `🗑️ Product Deleted`;
  const message = `"${params.productTitle}" has been removed from inventory.`;

  return await sendPushNotification({
    title,
    message,
    url: '/products',
    data: { type: 'PRODUCT_DELETED', title: params.productTitle }
  });
}

/**
 * Test push notification
 */
export async function sendTestPushNotification() {
  const title = `🔔 Rimal POS: Test Notification`;
  const message = `OneSignal Web Push is working seamlessly across Desktop, Android, and iOS!`;

  return await sendPushNotification({
    title,
    message,
    url: '/dashboard',
    data: { type: 'TEST' }
  });
}
