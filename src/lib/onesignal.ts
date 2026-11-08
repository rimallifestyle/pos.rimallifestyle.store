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
    // Normalize type for schema
    const rawType = (data?.type || 'SYSTEM').toUpperCase();
    let notifType = 'SYSTEM';
    if (['SALE', 'SALE_COMPLETED'].includes(rawType)) notifType = 'SALE';
    else if (['POS_LOGIN'].includes(rawType)) notifType = 'POS_LOGIN';
    else if (['PRODUCT_ADD', 'PRODUCT_ADDED'].includes(rawType)) notifType = 'PRODUCT_ADD';
    else if (['PRODUCT_DELETE', 'PRODUCT_DELETED'].includes(rawType)) notifType = 'PRODUCT_DELETE';
    else if (['TEST'].includes(rawType)) notifType = 'TEST';

    await Notification.create({
      title,
      message,
      type: notifType,
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
      success: true, 
      skipped: true, 
      message: 'In-app notification saved. OneSignal push skipped (not configured in Integrations).' 
    };
  }

  try {
    const baseUrl = 'https://pos.rimallifestyle.store';
    const targetUrl = url ? (url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : '/' + url}`) : `${baseUrl}/dashboard`;

    // Important: In OneSignal v1 API, DO NOT include both `url` and `web_url` (causes "Url Remove url field when setting app_url or web_url" error)
    const payload = {
      app_id: appId,
      included_segments: ['Total Subscriptions'],
      headings: { en: title },
      contents: { en: message },
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

    const authHeaders = [
      apiKey.startsWith('os_v2_') ? `Key ${apiKey}` : `Basic ${apiKey}`,
      apiKey.startsWith('os_v2_') ? `Basic ${apiKey}` : `Key ${apiKey}`,
    ];

    let result: any = null;
    let lastError: any = null;

    for (const authHeader of authHeaders) {
      try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': authHeader,
          },
          body: JSON.stringify(payload),
        });

        const resData = await response.json().catch(() => null);

        if (response.ok) {
          result = resData;
          break;
        } else {
          lastError = resData?.errors || `HTTP ${response.status}`;
          if (response.status !== 401 && response.status !== 403) {
            // Not an auth issue, don't retry second auth format
            break;
          }
        }
      } catch (reqErr: any) {
        lastError = reqErr.message;
      }
    }

    if (!result) {
      console.error('[OneSignal] API error response:', lastError);
      return { success: false, error: lastError || 'OneSignal API failed' };
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
