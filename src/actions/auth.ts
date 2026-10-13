'use server';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/rimal-db';
import User from '@/models/User';
import Outlet from '@/models/Outlet';
import { sendEmail } from '@/services/email';
import { sendPosLoginPushNotification } from '@/lib/onesignal';

const SECRET_KEY = process.env.JWT_SECRET || 'rimal-super-secret-key-change-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

export async function createToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentSession() {
  const token = (await cookies()).get('rimal_session')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function loginUser(email: string, password: string) {
  try {
    await dbConnect();
    
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Check password
    if (!user.password) {
      return { success: false, error: 'User does not have a password set.' };
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    if (!user.isActive) {
      return { success: false, error: 'Account is inactive' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send email
    const emailRes = await sendEmail({
      to: user.email,
      subject: 'Your Admin Login OTP - Rimal Warehouse',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #33040D; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">RIMAL WAREHOUSE</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Login Verification</h2>
            <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Please use the following One-Time Password (OTP) to securely log in to your account. This code is valid for 10 minutes.</p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <div style="font-family: monospace; font-size: 36px; font-weight: bold; color: #d63031; letter-spacing: 8px;">${otp}</div>
            </div>
            
            <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 32px; border-top: 1px solid #eaeaea; padding-top: 20px;">
              If you did not attempt to log in, please ignore this email or contact support if you have concerns.
            </p>
          </div>
        </div>
      `
    });

    if (!emailRes.success) {
      return { success: false, error: 'Failed to send OTP email. Please check your SMTP settings.' };
    }

    return { success: true, requireOtp: true, email: user.email, role: user.role };
  } catch (error: any) {
    console.error("Login Error:", error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}

export async function verifyAdminOtp(email: string, otp: string) {
  try {
    await dbConnect();
    
    const user = await User.findOne({ email });
    if (!user) return { success: false, error: 'User not found' };

    if (!user.otp || !user.otpExpiry || user.otp !== otp) {
      return { success: false, error: 'Invalid OTP' };
    }

    if (user.otpExpiry < new Date()) {
      return { success: false, error: 'OTP has expired' };
    }

    // OTP is valid, clear it
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Create session token
    const token = await createToken({ 
      id: user._id.toString(), 
      email: user.email, 
      role: user.role,
      name: user.name,
      avatar: user.avatar,
      outletId: user.outletId?.toString() 
    });
    
    // Set cookie
    (await cookies()).set('rimal_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return { success: true, role: user.role };
  } catch (error: any) {
    console.error("OTP Verification Error:", error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}

export async function logoutUser() {
  (await cookies()).delete('rimal_session');
  return { success: true };
}

export async function loginWithPin(phone: string, pin: string) {
  try {
    await dbConnect();
    
    // Allow either phone or email for flexibility, or just phone
    const user = await User.findOne({ phone });
    if (!user) return { success: false, error: 'User not found with this mobile number' };
    
    if (user.role !== 'CASHIER' && user.role !== 'MANAGER') {
       return { success: false, error: 'PIN login is only for Cashiers and Managers' };
    }

    if (!user.pin || user.pin !== pin) {
      return { success: false, error: 'Invalid PIN' };
    }
    
    if (!user.isActive) {
      return { success: false, error: 'Account is inactive' };
    }

    // Create session token
    const token = await createToken({ 
      id: user._id.toString(), 
      email: user.email, 
      role: user.role,
      name: user.name,
      avatar: user.avatar,
      outletId: user.outletId?.toString() 
    });
    
    // Set cookie
    (await cookies()).set('rimal_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Trigger OneSignal push notification for POS Login
    try {
      let outletName = 'Main Outlet';
      if (user.outletId) {
        const outlet = await Outlet.findById(user.outletId).lean();
        if (outlet) outletName = (outlet as any).name;
      }
      sendPosLoginPushNotification({
        userName: user.name || 'Staff',
        userRole: user.role || 'Cashier',
        outletName
      }).catch(err => console.error('[OneSignal] POS login push error:', err));
    } catch (pushErr) {
      console.error('[OneSignal] Failed preparing POS login push:', pushErr);
    }

    return { success: true, role: user.role, outletId: user.outletId };
  } catch (error: any) {
    console.error("PIN Login Error:", error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    await dbConnect();
    
    const user = await User.findOne({ email });
    if (!user) return { success: false, error: 'User not found' };

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = resetOtp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailRes = await sendEmail({
      to: user.email,
      subject: 'Password Reset Code - Rimal Warehouse',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #33040D; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">RIMAL WAREHOUSE</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
            <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">We received a request to reset your password. Please use the following code to reset your password. It will expire in 10 minutes.</p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <div style="font-family: monospace; font-size: 36px; font-weight: bold; color: #d63031; letter-spacing: 8px;">${resetOtp}</div>
            </div>
            
            <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 32px; border-top: 1px solid #eaeaea; padding-top: 20px;">
              If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    if (!emailRes.success) return { success: false, error: 'Failed to send reset email' };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Something went wrong' };
  }
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  try {
    await dbConnect();
    
    const user = await User.findOne({ email });
    if (!user) return { success: false, error: 'User not found' };

    if (!user.resetOtp || !user.resetOtpExpiry || user.resetOtp !== otp) {
      return { success: false, error: 'Invalid or incorrect code' };
    }

    if (user.resetOtpExpiry < new Date()) {
      return { success: false, error: 'Code has expired' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Something went wrong' };
  }
}
