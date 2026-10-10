import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  productId: mongoose.Types.ObjectId;
  sku: string; // Added to track specific variant stock
  outletId?: mongoose.Types.ObjectId; // null = master warehouse
  quantity: number;
  lastRestocked: Date;
}

const InventorySchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    outletId: { type: Schema.Types.ObjectId, ref: 'Outlet' },
    quantity: { type: Number, required: true, default: 0 },
    lastRestocked: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to ensure one inventory record per product variant per outlet
InventorySchema.index({ productId: 1, sku: 1, outletId: 1 }, { unique: true });

delete mongoose.models.Inventory;
export default mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
