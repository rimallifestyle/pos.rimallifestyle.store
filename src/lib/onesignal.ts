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

export async function sendPushNotification({ title, message, url, data }: SendPushOptions) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    console.warn('[OneSignal] Skipped sending push notification: NEXT_PUBLIC_ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY is not set in environment variables.');
    return { 
      success: false, 
      skipped: true, 
      message: 'OneSignal credentials not configured. Please set NEXT_PUBLIC_ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in .env' 
    };
  }

  try {
    const payload = {
      app_id: appId,
      included_segments: ['Total Subscriptions'],
      headings: { en: title },
      contents: { en: message },
      url: url || 'https://pos.rimallifestyle.store',
      web_url: url || 'https://pos.rimallifestyle.store',
      data: data || {},
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
