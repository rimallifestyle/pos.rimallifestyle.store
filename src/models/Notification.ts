import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['SALE', 'POS_LOGIN', 'PRODUCT_ADD', 'PRODUCT_DELETE', 'SYSTEM', 'TEST'],
      default: 'SYSTEM',
    },
    url: { type: String, default: '/dashboard' },
    isRead: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// High performance index for unread count & recent notification sorting
NotificationSchema.index({ isRead: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
