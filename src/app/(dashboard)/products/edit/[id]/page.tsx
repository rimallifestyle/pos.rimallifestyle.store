'use client';

import React, { useState, useEffect } from 'react';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Plus, Trash2, Save, Loader2, Link as LinkIcon, ArrowLeft, Folder, ChevronRight, Check, UploadCloud, Rocket } from 'lucide-react';
import { getProductById, updateProductWithVariants } from '@/actions/products';
import { getCategories, createCategory } from '@/actions/categories';
import { uploadImageToCloudinary } from '@/actions/upload';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

const slugify = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

export default function EditProductPage({ params }: { params: any }) {
  const unwrappedParams = React.use(params) as any;
  const productId = unwrappedParams.id as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);
  
  const [variants, setVariants] = useState<any[]>([]);

  const COLORS = ['Black', 'White', 'Navy Blue', 'Red', 'Olive Green', 'Gray', 'Brown', 'Yellow', 'Pink', 'Purple', 'Beige'];
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

  // Load categories
  useEffect(() => {
    async function loadCats() {
      const cats = await getCategories();
      setDbCategories(cats);
    }
    loadCats();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!productId) return;
      try {
        const data = await getProductById(productId);
        if (data) {
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setCategory(data.category || 'General');
          setDescription(data.description || '');
          setImageUrl(data.imageUrl || '');
          if (data.variants && data.variants.length > 0) {
            setVariants(data.variants);
          } else {
            setVariants([{ sku: '', size: 'M', color: '', colorCode: '#000000', price: 0, costPrice: 0, quantity: 0 }]);
          }
        }
      } catch (error) {
        console.log("Failed to load product:", error);
        toast.error("Failed to load product: " + ((error as any).message || "Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [productId]);

  // Auto-generate SKU only for empty skus
  useEffect(() => {
    if (!title || isLoading) return;
    const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD');
    
    setVariants(prev => prev.map(v => {
      if (!v.sku) {
        const colorCode = v.color ? v.color.substring(0, 3).toUpperCase() : 'XXX';
        return { ...v, sku: `${prefix}-${v.size}-${colorCode}` };
      }
      return v;
    }));
  }, [title, variants.map(v => v.size).join(','), variants.map(v => v.color).join(','), isLoading]);

  const handleAddVariant = () => {
    setVariants([...variants, { sku: '', size: 'M', color: '', colorCode: '#000000', price: 0, costPrice: 0, quantity: 0 }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleSaveCategory = async () => {
    if (!newCatName) return;
    setIsSavingCat(true);
    const res = await createCategory({ name: newCatName, parentId: newCatParent || undefined });
    if (res.success) {
      setDbCategories([...dbCategories, res.category]);
      setCategory(res.category.name);
      setNewCatName('');
      setIsAddingCat(false);
      toast.success('Category added successfully!');
    } else {
      toast.error("Error adding category: " + res.error);
    }
    setIsSavingCat(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await uploadImageToCloudinary(formData);
    if (res.success && res.url) {
      setImageUrl(res.url);
      toast.success('Image uploaded!');
    } else {
      toast.error("Image upload failed: " + res.error);
    }
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      title,
      slug,
      category,
      description,
      imageUrl,
      isActive: !isDraft,
      variants
    };
    
    const res = await updateProductWithVariants(productId, payload);
    setIsSubmitting(false);
    
    if (res.success) {
      toast.success(isDraft ? 'Draft updated successfully!' : 'Product updated successfully!');
      router.push('/products');
    } else {
      toast.error('Error: ' + res.error);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-[#33040D]" /></div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-16 font-sans">
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center gap-4">
          <Link href="/products" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#33040D] hover:border-[#33040D] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-sm text-gray-500">Update product details and inventory</p>
          </div>
        </div>
      </div>

      {/* Action Buttons Below Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-2 mb-6">
        <button 
          disabled={isSubmitting} 
          type="submit"
          form="product-form"
          onClick={() => setIsDraft(true)}
          className="flex-1 sm:flex-initial justify-center px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-[13px] font-bold transition-all disabled:opacity-70 shadow-sm flex items-center gap-2"
        >
          {isSubmitting && isDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-gray-400" />}
          {isSubmitting && isDraft ? 'Saving Draft...' : 'Save as Draft'}
        </button>

        <button 
          disabled={isSubmitting} 
          type="submit"
          form="product-form"
          onClick={() => setIsDraft(false)}
          className="flex-1 sm:flex-initial justify-center px-5 py-2.5 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-full text-[13px] font-bold transition-colors disabled:opacity-70 shadow-sm flex items-center gap-2"
        >
          {isSubmitting && !isDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" strokeWidth={2.5} />}
          {isSubmitting && !isDraft ? 'Updating...' : 'Update Product'}
        </button>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column - Product Details */}
        <div className="xl:col-span-8 space-y-6">
          <RimalCard>
            <h2 className="text-[18px] font-bold text-gray-900 mb-6">General Information</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Title</label>
                <input 
                  required
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 outline-none transition-all font-medium text-gray-900"
                  placeholder="e.g. Premium Cotton T-Shirt"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Slug</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LinkIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      required
                      type="text" 
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 outline-none transition-all font-medium text-gray-900"
                  placeholder="Short description of the product..."
                />
              </div>
            </div>
          </RimalCard>

          <RimalCard>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-[18px] font-bold text-gray-900">Product Variants (Size & Color)</h2>
              <button 
                type="button" 
                onClick={handleAddVariant}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-bold transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Variant
              </button>
            </div>
            
            <div className="space-y-4">
              {variants.map((v, index) => (
                <div key={index} className="p-4 sm:p-5 border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col gap-4 relative">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#33040D]/10 text-[#33040D] flex items-center justify-center text-[10px] font-bold">
                        {index + 1}
                      </span>
                      Variant #{index + 1}
                    </span>
                    {variants.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVariant(index)} 
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">SKU (Barcode)</label>
                      <input required type="text" value={v.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="RM-TS-L-BLK" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Size</label>
                      <select required value={v.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#33040D]/20 outline-none">
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Color & Name</label>
                      <div className="flex items-center border border-gray-200 rounded-lg px-2 bg-white focus-within:ring-2 focus-within:ring-[#33040D]/20 transition-all overflow-hidden">
                        <input 
                          type="color" 
                          value={v.colorCode || '#000000'} 
                          onChange={(e) => updateVariant(index, 'colorCode', e.target.value)} 
                          className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
                          title="Pick actual color"
                        />
                        <input 
                          required 
                          type="text" 
                          value={v.color} 
                          onChange={(e) => updateVariant(index, 'color', e.target.value)} 
                          className="w-full px-2 py-2 text-sm outline-none bg-transparent" 
                          placeholder="e.g. Navy Blue" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Stock Qty</label>
                      <input required type="number" min="0" value={v.quantity} onChange={(e) => updateVariant(index, 'quantity', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Selling Price (৳)</label>
                      <input required type="number" min="0" value={v.price} onChange={(e) => updateVariant(index, 'price', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-[#33040D]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Cost Price (৳)</label>
                      <input required type="number" min="0" value={v.costPrice} onChange={(e) => updateVariant(index, 'costPrice', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RimalCard>
        </div>

        {/* Right Column - Sidebar */}
        <div className="xl:col-span-4 space-y-6">

          <RimalCard>
            <h2 className="text-[16px] font-bold text-gray-900 mb-4">Featured Image</h2>
            <div className={`border-2 ${imageUrl ? 'border-transparent' : 'border-dashed border-gray-200'} rounded-xl flex flex-col items-center justify-center text-center bg-gray-50 relative overflow-hidden group aspect-square`}>
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Product" className="w-full h-full object-cover absolute inset-0" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => setImageUrl('')} 
                      className="px-4 py-2 bg-white text-red-500 rounded-lg text-[13px] font-bold hover:bg-red-50 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                    >
                      Remove Image
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 flex flex-col items-center justify-center w-full h-full">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-[#33040D]">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                  </div>
                  <p className="text-sm font-bold text-gray-700">{isUploading ? 'Uploading...' : 'Upload Product Image'}</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  <label className="absolute inset-0 cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden" 
                    />
                  </label>
                </div>
              )}
            </div>
          </RimalCard>

          <RimalCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900">Product Categories</h2>
              <button type="button" onClick={() => setIsAddingCat(!isAddingCat)} className="text-[#33040D] hover:text-[#4a0614] text-xs font-bold transition-colors">
                {isAddingCat ? 'Cancel' : '+ Add New'}
              </button>
            </div>
            
            {isAddingCat && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category Name" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#33040D]"
                />
                <select 
                  value={newCatParent}
                  onChange={(e) => setNewCatParent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#33040D]"
                >
                  <option value="">-- No Parent (Top Level) --</option>
                  {dbCategories.filter(c => !c.parentId).map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <button type="button" onClick={handleSaveCategory} disabled={isSavingCat || !newCatName} className="w-full py-2 bg-[#33040D] text-white rounded-lg text-sm font-bold disabled:opacity-50">
                  {isSavingCat ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            )}

            <div className="border border-gray-100 rounded-xl max-h-[300px] overflow-y-auto bg-gray-50/50 p-2 space-y-1">
              {dbCategories.length === 0 && <p className="text-xs text-center p-3 text-gray-500">No categories found. Add one!</p>}
              
              {dbCategories.filter(c => !c.parentId).map(parent => (
                <div key={parent._id}>
                  <label className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${category === parent.name ? 'bg-[#33040D]/5 text-[#33040D]' : 'hover:bg-gray-100 text-gray-700'}`}>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${category === parent.name ? 'border-[#33040D] bg-[#33040D]' : 'border-gray-300 bg-white'}`}>
                      {category === parent.name && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <Folder className="w-4 h-4 text-gray-400" />
                    <span className="text-[13px] font-bold flex-1">{parent.name}</span>
                  </label>
                  
                  {/* Render Subcategories */}
                  {dbCategories.filter(c => c.parentId === parent._id).map(child => (
                    <label key={child._id} className={`flex items-center gap-3 p-2 pl-8 rounded-lg cursor-pointer transition-colors ${category === child.name ? 'bg-[#33040D]/5 text-[#33040D]' : 'hover:bg-gray-100 text-gray-600'}`}>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${category === child.name ? 'border-[#33040D] bg-[#33040D]' : 'border-gray-300 bg-white'}`}>
                        {category === child.name && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-[13px] font-medium flex-1">{child.name}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </RimalCard>

          {/* Mobile Bottom Submit Actions */}
          <div className="xl:hidden flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              disabled={isSubmitting} 
              type="submit"
              form="product-form"
              onClick={() => setIsDraft(true)}
              className="w-full justify-center px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
            >
              {isSubmitting && isDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-gray-400" />}
              {isSubmitting && isDraft ? 'Saving Draft...' : 'Save as Draft'}
            </button>

            <button 
              disabled={isSubmitting} 
              type="submit"
              form="product-form"
              onClick={() => setIsDraft(false)}
              className="w-full justify-center px-5 py-3 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
            >
              {isSubmitting && !isDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" strokeWidth={2.5} />}
              {isSubmitting && !isDraft ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
