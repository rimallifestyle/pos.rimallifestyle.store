'use server'

import connectToDatabase from '@/lib/rimal-db';
import Category from '@/models/Category';

export async function getCategories() {
  try {
    await connectToDatabase();
    const categories = await Category.find({}).lean();
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to get categories:', error);
    return [];
  }
}

export async function createCategory(data: { name: string, parentId?: string }) {
  try {
    await connectToDatabase();
    // basic slug generation
    let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // check if slug exists, append random if needed
    const existing = await Category.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const newCategory = new Category({
      name: data.name,
      slug: slug,
      parentId: data.parentId || null
    });
    
    await newCategory.save();
    return { success: true, category: JSON.parse(JSON.stringify(newCategory)) };
  } catch (error: any) {
    console.error('Failed to create category:', error);
    return { success: false, error: error.message };
  }
}
