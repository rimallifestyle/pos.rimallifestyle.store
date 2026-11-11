import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
  sku: string;
  size: string;
  color?: string;
  colorCode?: string;
  price: number;
  costPrice: number;
  quantity?: number;
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  description?: string;
  category: string;
  subCategory?: string;
  imageUrl?: string;
  isActive: boolean;
  productType?: 'simple' | 'variable';
  attributes?: Record<string, any>;
  totalStock?: number;
  variants: IProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IProductVariant>({
  sku: { type: String, required: true },
  size: { type: String, required: true, default: 'Free Size' },
  color: { type: String, default: 'Standard' },
  colorCode: { type: String, default: '#000000' },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  quantity: { type: Number, default: 0 }
});

const ProductSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String, required: true },
    subCategory: { type: String, default: '' },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    productType: { type: String, enum: ['simple', 'variable'], default: 'variable' },
    attributes: { type: Schema.Types.Mixed, default: {} },
    totalStock: { type: Number, default: 0 },
    variants: [VariantSchema],
  },
  { timestamps: true }
);

delete mongoose.models.Product;
export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
