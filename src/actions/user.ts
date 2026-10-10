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
