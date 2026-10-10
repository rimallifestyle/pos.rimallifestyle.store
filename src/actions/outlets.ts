'use server';

import dbConnect from '@/lib/rimal-db';
import Outlet from '@/models/Outlet';

export async function getOutlets() {
  try {
    await dbConnect();
    const outlets = await Outlet.find().sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(outlets));
  } catch (error) {
    console.error('Error fetching outlets:', error);
    return [];
  }
}

export async function createOutlet(data: { name: string; location: string; contactNumber?: string; isActive?: boolean }) {
  try {
    await dbConnect();
    const outlet = await Outlet.create(data);
    return { success: true, outlet: JSON.parse(JSON.stringify(outlet)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOutlet(id: string, data: { name?: string; location?: string; contactNumber?: string; isActive?: boolean }) {
  try {
    await dbConnect();
    const outlet = await Outlet.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!outlet) return { success: false, error: 'Outlet not found' };
    return { success: true, outlet: JSON.parse(JSON.stringify(outlet)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteOutlet(id: string) {
  try {
    await dbConnect();
    await Outlet.findByIdAndDelete(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
