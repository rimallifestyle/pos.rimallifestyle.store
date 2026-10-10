import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
  sku: string;
  size: string;
  color: string;
  colorCode?: string;
  price: number;
  costPrice: number;
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  description?: string;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  variants: IProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IProductVariant>({
  sku: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  colorCode: { type: String },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true }
});

const ProductSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String, required: true },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    variants: [VariantSchema],
  },
  { timestamps: true }
);

delete mongoose.models.Product;
export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
