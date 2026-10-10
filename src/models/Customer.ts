import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  tier: string;
  discountPercent: number;
  pendingTier?: string;
  pendingDiscount?: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    tier: { 
      type: String, 
      default: 'Regular' 
    },
    discountPercent: { type: Number, default: 0 },
    pendingTier: { type: String },
    pendingDiscount: { type: Number },
    totalSpent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

delete mongoose.models.Customer;
export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
