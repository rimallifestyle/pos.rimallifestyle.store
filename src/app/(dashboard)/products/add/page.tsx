'use client';

import React, { useState, useEffect } from 'react';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Plus, Trash2, Save, Loader2, Link as LinkIcon, Folder, UploadCloud, Rocket, Layers, Tag, Sparkles, Check, Package, AlertTriangle, Palette, CheckCircle2 } from 'lucide-react';
import { createProductWithVariants } from '@/actions/products';
import { getCategories, createCategory } from '@/actions/categories';
import { uploadImageToCloudinary } from '@/actions/upload';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const slugify = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const COMMON_SIZES = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '28', '30', '32', '34', '36', '38', '40', '42'];

const COMMON_COLORS = [
  { name: 'Black', code: '#000000' },
  { name: 'White', code: '#FFFFFF' },
  { name: 'Off White', code: '#F8F6F0' },
  { name: 'Navy Blue', code: '#001F3F' },
  { name: 'Royal Blue', code: '#4169E1' },
  { name: 'Red', code: '#FF0000' },
  { name: 'Maroon', code: '#800000' },
  { name: 'Olive Green', code: '#556B2F' },
  { name: 'Dark Green', code: '#006400' },
  { name: 'Gray', code: '#808080' },
  { name: 'Beige', code: '#F5F5DC' },
  { name: 'Brown', code: '#8B4513' },
  { name: 'Yellow', code: '#FFD700' },
  { name: 'Pink', code: '#FFC0CB' },
];

export default function AddProductPage() {
  const router = useRouter();
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
  
  // Product Type: 'simple' (single item with size attribute) or 'variable' (multi-variant)
  const [productType, setProductType] = useState<'simple' | 'variable'>('simple');

  // Simple Product States (Non-variable with Size attribute)
  const [simpleSku, setSimpleSku] = useState('');
  const [simpleSize, setSimpleSize] = useState('Free Size');
  const [customSizeText, setCustomSizeText] = useState('');
  const [simplePrice, setSimplePrice] = useState<number | ''>('');
  const [simpleCostPrice, setSimpleCostPrice] = useState<number | ''>('');
  const [simpleQuantity, setSimpleQuantity] = useState<number | ''>(0);
  const [simpleColor, setSimpleColor] = useState('');
  const [simpleColorCode, setSimpleColorCode] = useState('#000000');

  // Variable Product States
  const [selectedQuickSizes, setSelectedQuickSizes] = useState<string[]>([]);
  const [variants, setVariants] = useState([
    { sku: '', size: 'M', color: '', colorCode: '#000000', price: 0, costPrice: 0, quantity: 0 }
  ]);

  const totalVariationStock = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

  const getDuplicateSkus = () => {
    const counts: Record<string, number> = {};
    variants.forEach(v => {
      const s = v.sku?.trim().toUpperCase();
      if (s) counts[s] = (counts[s] || 0) + 1;
    });
    return Object.keys(counts).filter(k => counts[k] > 1);
  };

  // Load categories
  useEffect(() => {
    async function loadCats() {
      const cats = await getCategories();
      setDbCategories(cats);
      if (cats.length > 0 && !category) {
        setCategory(cats[0].name);
      }
    }
    loadCats();
  }, []);

  // Auto-generate SKU
  useEffect(() => {
    if (!title) return;
    const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD');
    
    if (productType === 'simple') {
      const sizeTag = (simpleSize || 'FREE').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!simpleSku || simpleSku.startsWith(prefix)) {
        setSimpleSku(`${prefix}-${sizeTag}`);
      }
    } else {
      setVariants(prev => prev.map(v => {
        if (!v.sku || v.sku.startsWith(prefix)) {
          const sizeTag = (v.size || 'M').toUpperCase().replace(/[^A-Z0-9]/g, '');
          const colorCode = v.color ? v.color.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'STD';
          return { ...v, sku: `${prefix}-${sizeTag}-${colorCode}` };
        }
        return v;
      }));
    }
  }, [title, simpleSize, productType, variants.map(v => v.size).join(','), variants.map(v => v.color).join(',')]);

  useEffect(() => {
    setSlug(slugify(title));
  }, [title]);

  const handleSelectSimpleSize = (s: string) => {
    setSimpleSize(s);
    setCustomSizeText('');
  };

  const handleCustomSizeChange = (val: string) => {
    setCustomSizeText(val);
    setSimpleSize(val || 'Free Size');
  };

  // Quick generator for variable mode
  const toggleQuickSize = (s: string) => {
    if (selectedQuickSizes.includes(s)) {
      setSelectedQuickSizes(selectedQuickSizes.filter(x => x !== s));
    } else {
      setSelectedQuickSizes([...selectedQuickSizes, s]);
    }
  };

  const handleGenerateFromSizes = () => {
    if (selectedQuickSizes.length === 0) {
      toast.error('Please select at least one size chip first');
      return;
    }

    const prefix = title ? title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD') : 'PRD';
    const basePrice = Number(simplePrice) || (variants[0]?.price || 0);
    const baseCost = Number(simpleCostPrice) || (variants[0]?.costPrice || 0);

    const generated = selectedQuickSizes.map(sz => {
      const sizeTag = sz.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return {
        sku: `${prefix}-${sizeTag}-STD`,
        size: sz,
        color: '',
        colorCode: '#000000',
        price: basePrice,
        costPrice: baseCost,
        quantity: 0
      };
    });

    setVariants(generated);
    toast.success(`Generated ${generated.length} size variants!`);
  };

  const handleAddVariant = () => {
    const prefix = title ? title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD') : 'PRD';
    setVariants([
      ...variants,
      { sku: `${prefix}-M-STD`, size: 'M', color: '', colorCode: '#000000', price: Number(simplePrice) || 0, costPrice: Number(simpleCostPrice) || 0, quantity: 0 }
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    (newVariants[index] as any)[field] = value;
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
    if (!title.trim()) {
      toast.error('Please enter a product title');
      return;
    }

    let finalVariants: any[] = [];

    if (productType === 'simple') {
      if (simplePrice === '' || Number(simplePrice) < 0) {
        toast.error('Please enter a valid selling price');
        return;
      }
      const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD');
      const sizeTag = (simpleSize || 'FREE').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const sku = simpleSku.trim() || `${prefix}-${sizeTag}`;

      finalVariants = [
        {
          sku,
          size: simpleSize.trim() || 'Free Size',
          color: simpleColor.trim() || 'Standard',
          colorCode: simpleColorCode || '#000000',
          price: Number(simplePrice) || 0,
          costPrice: Number(simpleCostPrice) || 0,
          quantity: Number(simpleQuantity) || 0,
        }
      ];
    } else {
      if (variants.length === 0) {
        toast.error('Please add at least one variant');
        return;
      }
      const duplicates = getDuplicateSkus();
      if (duplicates.length > 0) {
        toast.error(`Duplicate SKU detected: "${duplicates.join(', ')}". Each variation must have a unique SKU (Barcode) to calculate and track stock separately.`);
        return;
      }
      finalVariants = variants.map((v, i) => ({
        ...v,
        sku: v.sku.trim() || `PRD-${Date.now().toString().slice(-4)}-${i + 1}`,
        size: v.size?.trim() || 'Free Size',
        color: v.color?.trim() || 'Standard',
        colorCode: v.colorCode || '#000000',
        price: Number(v.price) || 0,
        costPrice: Number(v.costPrice) || 0,
        quantity: Number(v.quantity) || 0,
      }));
    }

    setIsSubmitting(true);
    
    const payload = {
      title,
      slug,
      category: category || 'General',
      description,
      imageUrl,
      isActive: !isDraft,
      productType,
      attributes: {
        size: productType === 'simple' ? simpleSize : variants.map(v => v.size)
      },
      variants: finalVariants
    };
    
    const res = await createProductWithVariants(payload);
    setIsSubmitting(false);
    
    if (res.success) {
      toast.success(isDraft ? 'Product saved as draft!' : 'Product created successfully!');
      router.push('/products');
    } else {
      toast.error('Error: ' + res.error);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-16 font-sans">
      <RimalTopBar 
        title="Add New Product" 
        subtitle="Create simple products with size attributes or multi-variant items" 
        emoji="📦"
      />
      
      {/* Action Buttons Below Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-2 mb-6">
        <button 
          disabled={isSubmitting} 
          type="submit"
          form="product-form"
          onClick={() => setIsDraft(true)}
          className="flex-1 sm:flex-initial justify-center px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-[13px] font-bold transition-all disabled:opacity-70 shadow-sm flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting && isDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-gray-400" />}
          {isSubmitting && isDraft ? 'Saving Draft...' : 'Save as Draft'}
        </button>

        <button 
          disabled={isSubmitting} 
          type="submit"
          form="product-form"
          onClick={() => setIsDraft(false)}
          className="flex-1 sm:flex-initial justify-center px-5 py-2.5 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-full text-[13px] font-bold transition-colors disabled:opacity-70 shadow-sm flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting && !isDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" strokeWidth={2.5} />}
          {isSubmitting && !isDraft ? 'Publishing...' : 'Publish Product'}
        </button>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column - Product Details */}
        <div className="xl:col-span-8 space-y-6">
          <RimalCard>
            <h2 className="text-[18px] font-bold text-gray-900 mb-6">General Information</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Title *</label>
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">Slug (Auto-generated)</label>
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

          {/* Product Type & Inventory / Size Section */}
          <RimalCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">Product Configuration</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choose Single Product (1 Price, SKU & Stock) or Variable Product (Multiple Variants & Prices).
                </p>
              </div>

              {/* Type Switcher */}
              <div className="flex bg-gray-100 p-1.5 rounded-2xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setProductType('simple')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    productType === 'simple'
                      ? 'bg-white text-[#33040D] shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> Single Product (1 Price, Size & Color)
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('variable')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    productType === 'variable'
                      ? 'bg-white text-[#33040D] shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Variable Product (Multi-Variant)
                </button>
              </div>
            </div>

            {/* SIMPLE PRODUCT MODE (Single Product: 1 SKU, 1 Regular Price, 1 Cost Price, with Size & Color Attributes) */}
            {productType === 'simple' ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Notice Banner */}
                <div className="flex items-center gap-2.5 p-3.5 bg-[#33040D]/5 border border-[#33040D]/15 rounded-2xl text-xs font-medium text-[#33040D]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#33040D]" />
                  <span>
                    <strong>Single Product:</strong> Features 1 SKU (Barcode), 1 regular selling price, and 1 cost price. Selected size and color will not alter the price.
                  </span>
                </div>

                {/* 1. Size Attribute Selection */}
                <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#33040D]" />
                      Size Attribute
                    </label>
                    <span className="text-xs font-semibold text-[#33040D] bg-[#33040D]/10 px-2.5 py-1 rounded-full">
                      Selected: <strong>{simpleSize || 'Free Size'}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">
                    Click a common size below or type a custom size (e.g. 32, 34, 40, Free Size, 100ml):
                  </p>

                  {/* Common Size Chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COMMON_SIZES.map(s => {
                      const isSelected = simpleSize === s && !customSizeText;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSelectSimpleSize(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#33040D] text-white border-[#33040D] shadow-sm scale-105'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                          {s}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Size Input */}
                  <div className="pt-2 border-t border-gray-200/70">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Or Custom Size Name:
                    </label>
                    <input
                      type="text"
                      value={customSizeText}
                      onChange={(e) => handleCustomSizeChange(e.target.value)}
                      placeholder="Type custom size (e.g. 36, Large, 500g)..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#33040D]/20 outline-none"
                    />
                  </div>
                </div>

                {/* 2. Color Attribute Selection */}
                <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#33040D]" />
                      Color Attribute
                    </label>
                    <div className="flex items-center gap-2">
                      {simpleColor && (
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs" style={{ backgroundColor: simpleColorCode || '#000000' }} />
                      )}
                      <span className="text-xs font-semibold text-[#33040D] bg-[#33040D]/10 px-2.5 py-1 rounded-full">
                        Selected: <strong>{simpleColor || 'Standard (No Color)'}</strong>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">
                    Click a popular color preset below or type custom color name:
                  </p>

                  {/* Popular Color Preset Chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COMMON_COLORS.map(c => {
                      const isSelected = simpleColor.toLowerCase() === c.name.toLowerCase();
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            setSimpleColor(c.name);
                            setSimpleColorCode(c.code);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#33040D] text-white border-[#33040D] shadow-sm scale-105'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-gray-300" style={{ backgroundColor: c.code }} />
                          {c.name}
                        </button>
                      );
                    })}

                    {simpleColor && (
                      <button
                        type="button"
                        onClick={() => {
                          setSimpleColor('');
                          setSimpleColorCode('#000000');
                        }}
                        className="px-2.5 py-1.5 text-xs text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
                      >
                        ✕ Clear Color
                      </button>
                    )}
                  </div>

                  {/* Custom Color Name Input + Color Picker */}
                  <div className="pt-2 border-t border-gray-200/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Custom Color Name:
                      </label>
                      <input
                        type="text"
                        value={simpleColor}
                        onChange={(e) => setSimpleColor(e.target.value)}
                        placeholder="e.g. Off White, Navy Blue, Maroon..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#33040D]/20 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Hex Picker:
                      </label>
                      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white">
                        <input
                          type="color"
                          value={simpleColorCode || '#000000'}
                          onChange={(e) => setSimpleColorCode(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="text-xs font-mono text-gray-500">{simpleColorCode || '#000000'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Single Pricing, SKU & Stock (1 SKU, 1 Regular Price, 1 Cost Price) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Pricing, Stock & SKU (Single Details)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        SKU (Barcode) *
                      </label>
                      <input 
                        required 
                        type="text" 
                        value={simpleSku} 
                        onChange={(e) => setSimpleSku(e.target.value)} 
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-mono text-sm bg-gray-50 focus:bg-white transition-colors" 
                        placeholder="e.g. RL-312" 
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Single product barcode</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Stock Quantity *
                      </label>
                      <input 
                        required 
                        type="number" 
                        min="0" 
                        value={simpleQuantity} 
                        onChange={(e) => setSimpleQuantity(e.target.value === '' ? '' : Number(e.target.value))} 
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#33040D]/20 outline-none font-bold" 
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Total pieces in warehouse</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Regular Price (৳) *
                      </label>
                      <input 
                        required 
                        type="number" 
                        min="0" 
                        value={simplePrice} 
                        onChange={(e) => setSimplePrice(e.target.value === '' ? '' : Number(e.target.value))} 
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-black text-[#33040D] bg-white focus:ring-2 focus:ring-[#33040D]/20 outline-none" 
                        placeholder="0.00"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Single Selling Price</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Cost Price (৳)
                      </label>
                      <input 
                        type="number" 
                        min="0" 
                        value={simpleCostPrice} 
                        onChange={(e) => setSimpleCostPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#33040D]/20 outline-none" 
                        placeholder="0.00"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Single Cost Price</p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* VARIABLE PRODUCT MODE */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Fast Generator from Sizes */}
                <div className="bg-gradient-to-r from-[#33040D]/5 to-transparent p-4 sm:p-5 rounded-2xl border border-[#33040D]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#33040D]" />
                    <h3 className="text-sm font-bold text-[#33040D]">Quick Generate Variants from Sizes</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Click the sizes you want, then click Generate to create all variant rows automatically:
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COMMON_SIZES.map(s => {
                      const isSelected = selectedQuickSizes.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleQuickSize(s)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#33040D] text-white border-[#33040D]'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                          {s}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateFromSizes}
                    className="px-4 py-2 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate ({selectedQuickSizes.length} Variants)
                  </button>
                </div>

                {/* Total Stock Banner & Variant Controls */}
                <div className="p-4 bg-gradient-to-r from-[#33040D]/10 via-[#33040D]/5 to-transparent rounded-2xl border border-[#33040D]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#33040D] text-white flex items-center justify-center shadow-md flex-shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        Total Stock (Calculated from all {variants.length} variations)
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[26px] font-black text-[#33040D] leading-none">
                          {totalVariationStock.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-gray-600">pcs total stock</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button 
                      type="button" 
                      onClick={handleAddVariant}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Single Variant
                    </button>
                  </div>
                </div>

                {/* Duplicate SKU Warning */}
                {getDuplicateSkus().length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      Duplicate SKU detected ({getDuplicateSkus().join(', ')}). Each variation must have a unique SKU (e.g. RL-312-S, RL-312-M) so each variation's stock is calculated accurately.
                    </span>
                  </div>
                )}
                
                {/* Variant Cards */}
                <div className="space-y-4">
                  {variants.map((v, index) => (
                    <div key={index} className="p-4 sm:p-5 border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col gap-4 relative">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#33040D]/10 text-[#33040D] flex items-center justify-center text-[10px] font-bold">
                            {index + 1}
                          </span>
                          Variant #{index + 1} ({v.size || 'No Size'}{v.color ? ` / ${v.color}` : ''})
                        </span>
                        {variants.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveVariant(index)} 
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold p-1 transition-colors cursor-pointer"
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
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Size Attribute</label>
                          <input 
                            required 
                            type="text" 
                            list="size-suggestions"
                            value={v.size} 
                            onChange={(e) => updateVariant(index, 'size', e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#33040D]/20 outline-none font-semibold text-gray-800"
                            placeholder="e.g. M, 32, XL"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Color (Optional)</label>
                          <div className="flex items-center border border-gray-200 rounded-lg px-2 bg-white focus-within:ring-2 focus-within:ring-[#33040D]/20 transition-all overflow-hidden">
                            <input 
                              type="color" 
                              value={v.colorCode || '#000000'} 
                              onChange={(e) => updateVariant(index, 'colorCode', e.target.value)} 
                              className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
                              title="Pick actual color"
                            />
                            <input 
                              type="text" 
                              value={v.color} 
                              onChange={(e) => updateVariant(index, 'color', e.target.value)} 
                              className="w-full px-2 py-2 text-sm outline-none bg-transparent" 
                              placeholder="Standard / Optional" 
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
              </div>
            )}
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
                      className="px-4 py-2 bg-white text-red-500 rounded-lg text-[13px] font-bold hover:bg-red-50 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all cursor-pointer"
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
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">Product Categories</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Selected: <span className="font-bold text-[#33040D] bg-[#33040D]/10 px-2 py-0.5 rounded-md">{category || 'None selected'}</span>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddingCat(!isAddingCat)} 
                className="text-[#33040D] hover:text-[#4a0614] text-xs font-bold transition-colors cursor-pointer bg-[#33040D]/5 px-2.5 py-1.5 rounded-lg hover:bg-[#33040D]/10"
              >
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
                  {dbCategories.filter(c => !c.parentId || c.parentId === 'null').map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <button type="button" onClick={handleSaveCategory} disabled={isSavingCat || !newCatName} className="w-full py-2 bg-[#33040D] text-white rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer">
                  {isSavingCat ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            )}

            <div className="border border-gray-100 rounded-xl max-h-[300px] overflow-y-auto bg-gray-50/50 p-2 space-y-1">
              {dbCategories.length === 0 && <p className="text-xs text-center p-3 text-gray-500">No categories found. Add one!</p>}
              
              {/* Top-level Categories */}
              {dbCategories
                .filter(c => !c.parentId || c.parentId === 'null')
                .map(parent => {
                  const isSelected = category === parent.name;
                  const children = dbCategories.filter(c => c.parentId && c.parentId.toString() === parent._id.toString());
                  
                  return (
                    <div key={parent._id} className="space-y-1">
                      <div
                        onClick={() => setCategory(parent.name)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all select-none ${
                          isSelected 
                            ? 'bg-[#33040D] text-white shadow-sm' 
                            : 'hover:bg-white text-gray-800 bg-white/60 border border-gray-100/80'
                        }`}
                      >
                        <input
                          type="radio"
                          name="product-category"
                          value={parent.name}
                          checked={isSelected}
                          onChange={() => setCategory(parent.name)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-white bg-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-[#33040D] rounded-full"></div>}
                        </div>
                        <Folder className={`w-4 h-4 ${isSelected ? 'text-white/80' : 'text-gray-400'}`} />
                        <span className="text-[13px] font-bold flex-1">{parent.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      
                      {/* Subcategories */}
                      {children.map(child => {
                        const isChildSelected = category === child.name;
                        return (
                          <div
                            key={child._id}
                            onClick={() => setCategory(child.name)}
                            className={`flex items-center gap-3 p-2 pl-8 rounded-lg cursor-pointer transition-all select-none ${
                              isChildSelected 
                                ? 'bg-[#33040D] text-white shadow-sm' 
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            <input
                              type="radio"
                              name="product-category"
                              value={child.name}
                              checked={isChildSelected}
                              onChange={() => setCategory(child.name)}
                              className="sr-only"
                            />
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              isChildSelected ? 'border-white bg-white' : 'border-gray-300 bg-white'
                            }`}>
                              {isChildSelected && <div className="w-1.5 h-1.5 bg-[#33040D] rounded-full"></div>}
                            </div>
                            <span className="text-[12.5px] font-medium flex-1">{child.name}</span>
                            {isChildSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

              {/* Orphaned categories (categories with parentId that doesn't match any loaded parent) */}
              {dbCategories
                .filter(c => c.parentId && c.parentId !== 'null' && !dbCategories.some(p => p._id.toString() === c.parentId.toString()))
                .map(orphan => {
                  const isSelected = category === orphan.name;
                  return (
                    <div
                      key={orphan._id}
                      onClick={() => setCategory(orphan.name)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all select-none ${
                        isSelected 
                          ? 'bg-[#33040D] text-white shadow-sm' 
                          : 'hover:bg-white text-gray-800 bg-white/60 border border-gray-100/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="product-category"
                        value={orphan.name}
                        checked={isSelected}
                        onChange={() => setCategory(orphan.name)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-white bg-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-[#33040D] rounded-full"></div>}
                      </div>
                      <Folder className={`w-4 h-4 ${isSelected ? 'text-white/80' : 'text-gray-400'}`} />
                      <span className="text-[13px] font-bold flex-1">{orphan.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  );
                })}
            </div>
          </RimalCard>

          {/* Mobile Bottom Submit Actions */}
          <div className="xl:hidden flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              disabled={isSubmitting} 
              type="submit"
              form="product-form"
              onClick={() => setIsDraft(true)}
              className="w-full justify-center px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting && isDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-gray-400" />}
              {isSubmitting && isDraft ? 'Saving Draft...' : 'Save as Draft'}
            </button>

            <button 
              disabled={isSubmitting} 
              type="submit"
              form="product-form"
              onClick={() => setIsDraft(false)}
              className="w-full justify-center px-5 py-3 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting && !isDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" strokeWidth={2.5} />}
              {isSubmitting && !isDraft ? 'Publishing...' : 'Publish Product'}
            </button>
          </div>
        </div>

      </form>

      {/* Datalist for size suggestions */}
      <datalist id="size-suggestions">
        {COMMON_SIZES.map(s => <option key={s} value={s} />)}
      </datalist>
    </div>
  );
}
