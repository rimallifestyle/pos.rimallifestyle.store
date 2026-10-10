'use server';

import nodemailer from 'nodemailer';
import dbConnect from '@/lib/rimal-db';
import Settings from '@/models/Settings';

export async function getIntegrationStatus() {
  await dbConnect();
  const smtpSettings = await Settings.findOne({ type: 'smtp' });
  const cloudinarySettings = await Settings.findOne({ type: 'cloudinary' });
  
  return {
    smtp: !!smtpSettings?.config?.host && !!smtpSettings?.config?.user,
    cloudinary: !!cloudinarySettings?.config?.cloudName && !!cloudinarySettings?.config?.apiKey,
  };
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

    return { success: true, message: 'SMTP connected and saved to database!' };
  } catch (error: any) {
    console.error('SMTP Error:', error);
    return { success: false, error: error.message || 'Failed to connect to SMTP server' };
  }
}
