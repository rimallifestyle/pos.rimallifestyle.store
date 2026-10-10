import { NextResponse } from 'next/server';
import dbConnect from '@/lib/rimal-db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@rimal.com' });
    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin already exists', email: 'admin@rimal.com' });
    }

    // Create a new admin
    const hashedPassword = await bcrypt.hash('password123', 10);
    const newAdmin = new User({
      name: 'Super Admin',
      email: 'admin@rimal.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    });

    await newAdmin.save();

    return NextResponse.json({ message: 'Admin created successfully', email: 'admin@rimal.com', password: 'password123' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
