import mongoose, { Schema, Document } from 'mongoose';

export interface ITransferItem {
  productId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  variant: string;
  quantity: number;
}

export interface ITransfer extends Document {
  transferNumber: string;
  sourceOutletId?: mongoose.Types.ObjectId; // null = Master Warehouse
  destinationOutletId: mongoose.Types.ObjectId;
  items: ITransferItem[];
  totalItems: number;
  status: 'LOADING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  driver?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransferItemSchema = new Schema<ITransferItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  variant: { type: String, default: 'Standard' },
  quantity: { type: Number, required: true, min: 1 },
});

const TransferSchema: Schema = new Schema(
  {
    transferNumber: { type: String, required: true, unique: true },
    sourceOutletId: { type: Schema.Types.ObjectId, ref: 'Outlet' },
    destinationOutletId: { type: Schema.Types.ObjectId, ref: 'Outlet', required: true },
    items: [TransferItemSchema],
    totalItems: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['LOADING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
      default: 'COMPLETED',
    },
    notes: { type: String },
    driver: { type: String, default: 'Warehouse Staff' },
  },
  { timestamps: true }
);

delete mongoose.models.Transfer;
export default mongoose.models.Transfer || mongoose.model<ITransfer>('Transfer', TransferSchema);

