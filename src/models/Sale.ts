import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  priceAtSale: number;
}

export interface ISale extends Document {
  invoiceId: string;
  outletId?: mongoose.Types.ObjectId;
  cashierId?: mongoose.Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'MFS';
  paymentProvider?: string;
  transactionId?: string;
  status: 'COMPLETED' | 'REFUNDED';
  createdAt: Date;
}

const SaleItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  priceAtSale: { type: Number, required: true },
});

const SaleSchema: Schema = new Schema({
    invoiceId: { type: String, required: true, unique: true },
    outletId: { type: Schema.Types.ObjectId, ref: 'Outlet' }, // Make optional for now
    cashierId: { type: Schema.Types.ObjectId, ref: 'User' }, // Make optional for now
    customerName: { type: String },
    customerPhone: { type: String },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['CASH', 'CARD', 'MFS'], required: true },
    paymentProvider: { type: String },
    transactionId: { type: String },
    status: { type: String, enum: ['COMPLETED', 'REFUNDED'], default: 'COMPLETED' },
  },
  { timestamps: true }
);

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);
