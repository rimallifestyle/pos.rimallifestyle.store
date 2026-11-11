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
    const cleanName = data.name.trim();
    if (!cleanName) {
      return { success: false, error: 'Category name is required' };
    }

    const parentId = data.parentId && data.parentId !== 'null' && data.parentId !== '' ? data.parentId : null;

    // Check for duplicate category name under the same parent
    const duplicate = await Category.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
      parentId: parentId
    });

    if (duplicate) {
      return { success: false, error: `Category "${cleanName}" already exists here.` };
    }

    // basic slug generation
    let slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // check if slug exists, append random if needed
    const existing = await Category.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const newCategory = new Category({
      name: cleanName,
      slug: slug,
      parentId: parentId
    });
    
    await newCategory.save();
    return { success: true, category: JSON.parse(JSON.stringify(newCategory)) };
  } catch (error: any) {
    console.error('Failed to create category:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    await connectToDatabase();
    // promote children to top-level if parent is deleted
    await Category.updateMany({ parentId: id }, { $set: { parentId: null } });
    await Category.findByIdAndDelete(id);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete category:', error);
    return { success: false, error: error.message };
  }
}
