'use server';

import connectToDatabase from '@/lib/rimal-db';
import Settings from '@/models/Settings';
import { getCurrentSession } from './auth';

export async function getPosSettings() {
  try {
    await connectToDatabase();
    const settings = await Settings.findOne({ type: 'pos' });
    if (settings) {
      return settings.config;
    }
    // Default settings
    return {
      vatEnabled: false,
      vatPercentage: 0
    };
  } catch (error) {
    console.error('Error fetching POS settings:', error);
    return {
      vatEnabled: false,
      vatPercentage: 0
    };
  }
}

export async function updatePosSettings(config: { vatEnabled: boolean, vatPercentage: number }) {
  try {
    const auth = await getCurrentSession();
    if (!auth || auth.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    await Settings.findOneAndUpdate(
      { type: 'pos' },
      { config },
      { upsert: true, new: true }
    );

    return { success: true, message: 'POS settings updated successfully' };
  } catch (error) {
    console.error('Error updating POS settings:', error);
    return { success: false, error: 'Failed to update POS settings' };
  }
}
