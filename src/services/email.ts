import nodemailer from 'nodemailer';
import dbConnect from '@/lib/rimal-db';
import Settings from '@/models/Settings';

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  await dbConnect();
  
  // Try to get from database first
  let smtpConfig: any = null;
  try {
    const settings = await Settings.findOne({ type: 'smtp' });
    if (settings && settings.config) {
      smtpConfig = settings.config;
    }
  } catch (err) {
    console.error('Error fetching SMTP settings from DB:', err);
  }

  // Fallback to env for development if DB config doesn't exist
  const host = smtpConfig?.host || process.env.SMTP_HOST;
  const port = Number(smtpConfig?.port || process.env.SMTP_PORT) || 587;
  const user = smtpConfig?.user || process.env.SMTP_USER;
  const pass = smtpConfig?.pass || process.env.SMTP_PASS;
  const fromName = smtpConfig?.fromName || process.env.SMTP_FROM_NAME || 'Rimal Warehouse';

  if (!host || !user || !pass) {
    console.error('SMTP credentials are not configured in Database or .env');
    return { success: false, error: 'SMTP credentials missing' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${user}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}
