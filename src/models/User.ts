import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string; // Used for Admin/Manager login. For cashier, can be CashierID
  password?: string; // Used by Admin/Manager
  pin?: string; // Used strictly by Cashiers
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  outletId?: mongoose.Types.ObjectId; // References the Outlet they are assigned to
  isActive: boolean;
  phone?: string;
  avatar?: string;
  otp?: string;
  otpExpiry?: Date;
  resetOtp?: string;
  resetOtpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    pin: { type: String },
    role: { type: String, enum: ['ADMIN', 'MANAGER', 'CASHIER'], default: 'CASHIER' },
    outletId: { type: Schema.Types.ObjectId, ref: 'Outlet' },
    isActive: { type: Boolean, default: true },
    phone: { type: String },
    avatar: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date },
  },
  { timestamps: true }
);

// Delete the cached model if it exists to ensure new fields are picked up in dev
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUser>('User', UserSchema);
