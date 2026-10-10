'use server';

import dbConnect from '@/lib/rimal-db';
import User from '@/models/User';
import { getCurrentSession, createToken } from '@/actions/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function getUserProfile() {
  const session = await getCurrentSession();
  if (!session || !session.id) return null;

  await dbConnect();
  const user = await User.findById(session.id).lean();
  
  if (!user) return null;

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    avatar: user.avatar || '',
  };
}

export async function updateUserProfile(data: FormData) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.id) return { success: false, error: 'Unauthorized' };

    await dbConnect();
    const user = await User.findById(session.id);
    if (!user) return { success: false, error: 'User not found' };

    const firstName = data.get('firstName') as string;
    const lastName = data.get('lastName') as string;
    const email = data.get('email') as string;
    const phone = data.get('phone') as string;
    const avatar = data.get('avatar') as string;
    
    // Check if email is already taken by someone else
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return { success: false, error: 'Email is already in use.' };
    }

    user.name = `${firstName} ${lastName}`.trim();
    if (email) user.email = email;
    if (phone !== null) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();
    
    // Update token to reflect new name/email/avatar
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

    return { success: true, message: 'Profile updated successfully!' };
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return { success: false, error: error.message || 'Failed to update profile' };
  }
}

import { sendEmail } from '@/services/email';

export async function requestProfilePasswordChange(currentPassword: string) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.id) return { success: false, error: 'Unauthorized' };

    await dbConnect();
    const user = await User.findById(session.id);
    if (!user) return { success: false, error: 'User not found' };

    // Verify current password
    if (!user.password) return { success: false, error: 'User does not have a password set.' };
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return { success: false, error: 'Incorrect current password' };

    // Generate OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = resetOtp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // Send email
    const emailRes = await sendEmail({
      to: user.email,
      subject: 'Verify Password Change - Rimal Warehouse',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #33040D; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">RIMAL WAREHOUSE</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Password Change Request</h2>
            <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">You requested to change your password. Please use this One-Time Password (OTP) to authorize the change. Valid for 10 minutes.</p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <div style="font-family: monospace; font-size: 36px; font-weight: bold; color: #d63031; letter-spacing: 8px;">${resetOtp}</div>
            </div>
            
            <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 32px; border-top: 1px solid #eaeaea; padding-top: 20px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `
    });

    if (!emailRes.success) return { success: false, error: 'Failed to send OTP email.' };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Something went wrong' };
  }
}

export async function verifyProfilePasswordChange(otp: string, newPassword: string) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.id) return { success: false, error: 'Unauthorized' };

    await dbConnect();
    const user = await User.findById(session.id);
    if (!user) return { success: false, error: 'User not found' };

    if (!user.resetOtp || !user.resetOtpExpiry || user.resetOtp !== otp) {
      return { success: false, error: 'Invalid or incorrect OTP' };
    }

    if (user.resetOtpExpiry < new Date()) {
      return { success: false, error: 'OTP has expired' };
    }

    // Hash and update password
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

