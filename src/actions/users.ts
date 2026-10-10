'use server';

import dbConnect from '@/lib/rimal-db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function getUsers() {
  try {
    await dbConnect();
    // Populate outletId if we want to show which outlet they belong to
    const users = await User.find({}).populate('outletId', 'name').sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(users));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function createUser(data: any) {
  try {
    await dbConnect();
    
    // Check if email already exists
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return { success: false, error: 'Email already exists' };
    }

    const payload: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    if (data.phone) {
      payload.phone = data.phone;
    }

    if (data.password) {
      payload.password = await bcrypt.hash(data.password, 10);
    }
    
    if (data.pin) {
      payload.pin = data.pin; // Storing plain text PIN for cashiers (can hash if strict security needed, but usually 4-digit PINs are just stored plain or hashed lightly)
    }

    if (data.outletId) {
      payload.outletId = data.outletId;
    }

    const user = await User.create(payload);
    return { success: true, user: JSON.parse(JSON.stringify(user)) };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUser(id: string, data: any) {
  try {
    await dbConnect();
    
    const payload: any = {
      name: data.name,
      role: data.role,
      isActive: data.isActive,
    };

    if (data.phone !== undefined) {
      payload.phone = data.phone;
    }

    if (data.email) {
      const existing = await User.findOne({ email: data.email, _id: { $ne: id } });
      if (existing) return { success: false, error: 'Email already in use by another user' };
      payload.email = data.email;
    }

    if (data.password) {
      payload.password = await bcrypt.hash(data.password, 10);
    }
    
    if (data.pin !== undefined) {
      payload.pin = data.pin;
    }

    if (data.outletId) {
      payload.outletId = data.outletId;
    } else if (data.outletId === null) {
      payload.$unset = { outletId: 1 };
    }

    const user = await User.findByIdAndUpdate(id, payload, { new: true }).populate('outletId', 'name');
    return { success: true, user: JSON.parse(JSON.stringify(user)) };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(id: string) {
  try {
    await dbConnect();
    await User.findByIdAndDelete(id);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
}
