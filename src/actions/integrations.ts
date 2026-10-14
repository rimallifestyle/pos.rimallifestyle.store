'use server';

import nodemailer from 'nodemailer';
import dbConnect from '@/lib/rimal-db';
import Settings from '@/models/Settings';
import { revalidatePath } from 'next/cache';

export async function getIntegrationStatus() {
  await dbConnect();
  const smtpSettings = await Settings.findOne({ type: 'smtp' }).lean();
  const cloudinarySettings = await Settings.findOne({ type: 'cloudinary' }).lean();
  const onesignalSettings = await Settings.findOne({ type: 'onesignal' }).lean();

  const envAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID;
  const envApiKey = process.env.ONESIGNAL_REST_API_KEY;

  const hasOneSignal = Boolean(
    (onesignalSettings?.config?.appId && onesignalSettings?.config?.restApiKey) ||
    (envAppId && envApiKey)
  );
  
  return {
    smtp: !!smtpSettings?.config?.host && !!smtpSettings?.config?.user,
    cloudinary: !!cloudinarySettings?.config?.cloudName && !!cloudinarySettings?.config?.apiKey,
    onesignal: hasOneSignal,
  };
}

export async function getOneSignalSettings() {
  try {
    await dbConnect();
    const onesignalSettings = await Settings.findOne({ type: 'onesignal' }).lean();

    const envAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID || '';
    const envApiKey = process.env.ONESIGNAL_REST_API_KEY || '';

    if (onesignalSettings?.config?.appId && onesignalSettings?.config?.restApiKey) {
      return {
        appId: onesignalSettings.config.appId as string,
        restApiKey: onesignalSettings.config.restApiKey as string,
        appName: (onesignalSettings.config.appName as string) || '',
        isConfigured: true,
        source: 'database' as const,
      };
    }

    if (envAppId && envApiKey) {
      return {
        appId: envAppId,
        restApiKey: envApiKey,
        appName: '',
        isConfigured: true,
        source: 'env' as const,
      };
    }

    return {
      appId: '',
      restApiKey: '',
      appName: '',
      isConfigured: false,
      source: 'none' as const,
    };
  } catch (error) {
    console.error('Error in getOneSignalSettings:', error);
    return {
      appId: '',
      restApiKey: '',
      appName: '',
      isConfigured: false,
      source: 'none' as const,
    };
  }
}

export async function getPublicOneSignalConfig() {
  try {
    await dbConnect();
    const onesignalSettings = await Settings.findOne({ type: 'onesignal' }).lean();
    const dbAppId = onesignalSettings?.config?.appId;
    const dbApiKey = onesignalSettings?.config?.restApiKey;

    const envAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID;
    const envApiKey = process.env.ONESIGNAL_REST_API_KEY;

    const appId = (dbAppId || envAppId || null) as string | null;
    const isConfigured = Boolean(appId && (dbApiKey || envApiKey));

    return {
      appId,
      isConfigured,
    };
  } catch (err) {
    console.warn('[OneSignal] getPublicOneSignalConfig error:', err);
    const envAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID || null;
    return {
      appId: envAppId,
      isConfigured: Boolean(envAppId && process.env.ONESIGNAL_REST_API_KEY),
    };
  }
}

export async function testAndSaveOneSignal(formData: FormData) {
  try {
    const appId = (formData.get('appId') as string || '').trim();
    const restApiKey = (formData.get('restApiKey') as string || '').trim();

    if (!appId || !restApiKey) {
      return { success: false, error: 'OneSignal App ID and REST API Key are both required.' };
    }

    // Verify credentials with OneSignal REST API
    let appName = 'OneSignal Push Service';
    try {
      let response = await fetch(`https://onesignal.com/api/v1/apps/${appId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${restApiKey}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Retry with Key format
        const retryRes = await fetch(`https://onesignal.com/api/v1/apps/${appId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Key ${restApiKey}`,
          },
        });
        if (retryRes.ok) {
          response = retryRes;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg =
          errorData?.errors?.[0] ||
          `OneSignal verification failed (HTTP ${response.status}). Please check your App ID and REST API Key.`;
        return { success: false, error: errorMsg };
      }

      const appData = await response.json();
      if (appData?.name) {
        appName = appData.name;
      }
    } catch (fetchErr: any) {
      console.warn('[OneSignal] Verification network error:', fetchErr);
      if (!appId.includes('-') && appId.length < 20) {
        return { success: false, error: 'Invalid OneSignal App ID format. Expected a standard UUID.' };
      }
    }

    // Save configuration directly to MongoDB Settings
    await dbConnect();
    await Settings.findOneAndUpdate(
      { type: 'onesignal' },
      {
        type: 'onesignal',
        config: {
          appId,
          restApiKey,
          appName,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    revalidatePath('/integrations');
    revalidatePath('/settings');

    return { 
      success: true, 
      message: `OneSignal connected successfully! (${appName})` 
    };
  } catch (error: any) {
    console.error('OneSignal Save Error:', error);
    return { success: false, error: error.message || 'Failed to connect to OneSignal' };
  }
}

export async function disconnectOneSignal() {
  try {
    await dbConnect();
    await Settings.deleteOne({ type: 'onesignal' });
    revalidatePath('/integrations');
    revalidatePath('/settings');
    return { success: true, message: 'OneSignal integration disconnected successfully.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to disconnect OneSignal' };
  }
}

export async function testAndSaveSMTP(formData: FormData) {
  try {
    const host = formData.get('host') as string;
    const port = Number(formData.get('port'));
    const user = formData.get('user') as string;
    const pass = formData.get('pass') as string;
    const fromName = formData.get('fromName') as string;

    if (!host || !port || !user || !pass) {
      return { success: false, error: 'All fields are required' };
    }

    // Test the connection
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.verify();

    // Send a test email to the user
    await transporter.sendMail({
      from: `"${fromName || 'Rimal Warehouse'}" <${user}>`,
      to: user, // send to themselves
      subject: '✅ SMTP Configuration Successful!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #33040D;">Connection Successful!</h2>
          <p>Your SMTP integration for <strong>${fromName || 'Rimal Warehouse'}</strong> is working perfectly.</p>
          <p>This means your system is now ready to send invoices and notifications directly to your customers.</p>
          <br/>
          <p style="font-size: 12px; color: #888;">This is an automated test message from your Rimal Management System.</p>
        </div>
      `
    });

    // Save to Database
    await dbConnect();
    await Settings.findOneAndUpdate(
      { type: 'smtp' },
      { 
        type: 'smtp', 
        config: { host, port, user, pass, fromName } 
      },
      { upsert: true, new: true }
    );

    revalidatePath('/integrations');
    return { success: true, message: 'SMTP connected and saved to database!' };
  } catch (error: any) {
    console.error('SMTP Error:', error);
    return { success: false, error: error.message || 'Failed to connect to SMTP server' };
  }
}
