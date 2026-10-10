'use server'

import connectToDatabase from '@/lib/rimal-db';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';

export async function searchProducts(query: string) {
  try {
    await connectToDatabase();
    const products = await Product.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { 'variants.sku': { $regex: query, $options: 'i' } }
      ]
    }).limit(20).lean();

    const flatProducts: any[] = [];
    for (const p of products) {
      for (const v of (p as any).variants) {
        flatProducts.push({
          _id: (p as any)._id,
          name: (p as any).title,
          slug: (p as any).slug,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          costPrice: v.costPrice,
          category: (p as any).category,
        });
      }
    }
    return JSON.parse(JSON.stringify(flatProducts));
  } catch (error) {
    console.error('Failed to search products:', error);
    return [];
  }
}

export async function getAllProducts() {
  try {
    await connectToDatabase();
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(50).lean();
    
    const flatProducts: any[] = [];
    for (const p of products) {
      for (const v of (p as any).variants) {
        flatProducts.push({
          _id: (p as any)._id,
          name: (p as any).title,
          slug: (p as any).slug,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          costPrice: v.costPrice,
          category: (p as any).category,
        });
      }
    }
    return JSON.parse(JSON.stringify(flatProducts));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export async function getProductSummaries() {
  try {
    await connectToDatabase();
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    const inventory = await Inventory.find({}).lean();
    
    const summaries = products.map((p: any) => {
      const productInventory = inventory.filter((i: any) => i.productId.toString() === p._id.toString());
      const totalStock = productInventory.reduce((acc, curr) => acc + curr.quantity, 0);
      
      let status = 'Draft';
      if (p.isActive !== false) {
        status = totalStock > 10 ? 'In Stock' : totalStock > 0 ? 'Low Stock' : 'Out of Stock';
      }

      return {
        id: p._id.toString(),
        slug: p.slug,
        sku: p.variants?.[0]?.sku || 'N/A',
        name: p.title,
        category: p.category,
        price: `৳ ${p.variants?.[0]?.price || 0}`,
        stock: totalStock,
        status: status,
        img: p.imageUrl || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=150&q=80',
        variantCount: p.variants?.length || 0
      };
    });
    
    return JSON.parse(JSON.stringify(summaries));
  } catch (error) {
    console.error('Failed to get product summaries:', error);
    return [];
  }
}

export async function createProductWithVariants(data: any) {
  try {
    await connectToDatabase();
    
    // Create the product
    const newProduct = new Product({
      title: data.title,
      slug: data.slug,
      description: data.description,
      category: data.category,
      imageUrl: data.imageUrl,
      isActive: data.isActive !== undefined ? data.isActive : true,
      variants: data.variants.map((v: any) => ({
        sku: v.sku,
        size: v.size,
        color: v.color,
        colorCode: v.colorCode,
        price: v.price,
        costPrice: v.costPrice
      }))
    });
    
    await newProduct.save();

    // Create inventory records for each variant
    const inventoryOps = data.variants.map((v: any) => ({
      productId: newProduct._id,
      sku: v.sku,
      quantity: v.quantity || 0,
      outletId: null // Master warehouse stock
    }));
    
    if (inventoryOps.length > 0) {
      await Inventory.insertMany(inventoryOps);
    }

    return { success: true, product: JSON.parse(JSON.stringify(newProduct)) };
  } catch (error: any) {
    console.error('Failed to create product:', error);
    return { success: false, error: error.message };
  }
}

export async function getProductById(id: string) {
  try {
    await connectToDatabase();
    const product = await Product.findById(id).lean();
    if (!product) return null;
    
    const inventory = await Inventory.find({ productId: id }).lean();
    
    const variants = (product as any).variants.map((v: any) => {
      const inv = inventory.find((i: any) => i.sku === v.sku);
      return {
        ...v,
        quantity: inv ? inv.quantity : 0
      };
    });
    
    return JSON.parse(JSON.stringify({ ...product, variants }));
  } catch (error) {
    console.error('Failed to get product by id:', error);
    return null;
  }
}

export async function updateProductWithVariants(id: string, data: any) {
  try {
    await connectToDatabase();
    
    await Product.findByIdAndUpdate(id, {
      title: data.title,
      slug: data.slug,
      description: data.description,
      category: data.category,
      imageUrl: data.imageUrl,
      isActive: data.isActive !== undefined ? data.isActive : true,
      variants: data.variants.map((v: any) => ({
        sku: v.sku,
        size: v.size,
        color: v.color,
        colorCode: v.colorCode,
        price: v.price,
        costPrice: v.costPrice
      }))
    });
    
    // Update inventory
    for (const v of data.variants) {
      await Inventory.findOneAndUpdate(
        { productId: id, sku: v.sku, outletId: null },
        { $set: { quantity: v.quantity || 0 } },
        { upsert: true }
      );
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update product:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    await connectToDatabase();
    
    // Check if product exists
    const product = await Product.findById(id);
    if (!product) return { success: false, error: 'Product not found' };
    
    // Delete product
    await Product.findByIdAndDelete(id);
    
    // Delete related inventory
    await Inventory.deleteMany({ productId: id });
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete product:', error);
    return { success: false, error: error.message };
  }
}
