import mongoose, { Schema, Document } from 'mongoose';

export interface IOutlet extends Document {
  name: string;
  location: string;
  contactNumber: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OutletSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    contactNumber: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Outlet || mongoose.model<IOutlet>('Outlet', OutletSchema);
