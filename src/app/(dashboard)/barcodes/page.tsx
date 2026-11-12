'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import gsap from 'gsap';
import Barcode from 'react-barcode';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Search, Printer, Plus, Minus, Tag, Trash2, Loader2, Database } from 'lucide-react';
import { searchProducts, getAllProducts, createProductWithVariants } from '@/actions/products';

export default function BarcodeCenterPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [catalog, setCatalog] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isAddingDB, setIsAddingDB] = useState(false);
  
  const [printQueue, setPrintQueue] = useState<any[]>([]);
  const [orientation, setOrientation] = useState<'normal' | 'rotate90' | 'rotate270'>('normal');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rimal_barcode_orientation');
      if (saved === 'normal' || saved === 'rotate90' || saved === 'rotate270') {
        setOrientation(saved);
      }
    } catch (e) {}
  }, []);

  const handleOrientationChange = (val: 'normal' | 'rotate90' | 'rotate270') => {
    setOrientation(val);
    try {
      localStorage.setItem('rimal_barcode_orientation', val);
    } catch (e) {}
  };

  // Form for quick add
  const [newProd, setNewProd] = useState({ name: '', sku: '', category: 'General', price: 0, costPrice: 0, size: 'M', color: 'Black' });

  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    gsap.fromTo(elements, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out' });
    
    // Load initial products
    fetchInitialProducts();
  }, []);

  const fetchInitialProducts = async () => {
    const data = await getAllProducts();
    setCatalog(data);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    startTransition(async () => {
      if (q.trim() === '') {
        const data = await getAllProducts();
        setCatalog(data);
      } else {
        const data = await searchProducts(q);
        setCatalog(data);
      }
    });
  };

  const handleCreateDB = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingDB(true);
    const res = await createProductWithVariants({
      title: newProd.name,
      slug: newProd.name.toLowerCase().replace(/\s+/g, '-'),
      category: newProd.category,
      variants: [{
        sku: newProd.sku,
        size: newProd.size,
        color: newProd.color,
        price: newProd.price,
        costPrice: newProd.costPrice,
        quantity: 0
      }]
    });
    if (res.success) {
      setNewProd({ name: '', sku: '', category: 'General', price: 0, costPrice: 0, size: 'M', color: 'Black' });
      fetchInitialProducts();
      alert('Product saved to DB!');
    } else {
      alert('Error: ' + res.error);
    }
    setIsAddingDB(false);
  };

  const addToQueue = (product: any) => {
    const exists = printQueue.find(item => item.sku === product.sku);
    if (exists) {
      setPrintQueue(printQueue.map(item => item.sku === product.sku ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setPrintQueue([...printQueue, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (sku: string, delta: number) => {
    setPrintQueue(printQueue.map(item => {
      if (item.sku === sku) {
        const newQty = item.qty + delta;
        return { ...item, qty: newQty > 0 ? newQty : 1 };
      }
      return item;
    }));
  };

  const removeFromQueue = (sku: string) => {
    setPrintQueue(printQueue.filter(item => item.sku !== sku));
  };

  const handlePrint = () => {
    window.print();
  };

  const totalLabels = printQueue.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div ref={containerRef} className="max-w-[1600px] mx-auto pb-16 font-sans print:pb-0 print:m-0 print:max-w-none">
      <style>{`
        @media print {
          @page {
            size: portrait !important;
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div className="print:hidden">
        <RimalTopBar 
          title="Barcode Center" 
          subtitle="Generate and print scannable product tags (Dynamic via DB)" 
          emoji="🖨️" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 print:block print:gap-0">
        
        {/* Left Column - Builder & Queue (Not printable) */}
        <div className="xl:col-span-7 space-y-6 print:hidden">
          
          {/* Create Product Inline Form */}
          <RimalCard className="animate-on-load bg-gray-50 border border-gray-100">
            <h2 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#33040D]" /> Add New Product to DB
            </h2>
            <form onSubmit={handleCreateDB} className="flex gap-2 items-center flex-wrap">
              <input type="text" placeholder="Name" required value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} className="px-3 py-2 rounded-lg border text-sm w-40" />
              <input type="text" placeholder="SKU" required value={newProd.sku} onChange={e => setNewProd({...newProd, sku: e.target.value})} className="px-3 py-2 rounded-lg border text-sm w-32" />
              <input type="number" placeholder="Price" required value={newProd.price || ''} onChange={e => setNewProd({...newProd, price: Number(e.target.value)})} className="px-3 py-2 rounded-lg border text-sm w-24" />
              <button disabled={isAddingDB} type="submit" className="bg-[#33040D] text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-[#4a0614] flex items-center gap-2">
                {isAddingDB ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save to DB'}
              </button>
            </form>
          </RimalCard>

          <RimalCard className="animate-on-load">
            <h2 className="text-[18px] font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#33040D]" /> Search Database & Add to Queue
            </h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-[16px] text-[14px] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all shadow-inner"
                placeholder="Search catalog by SKU or Product Name..."
              />
              <div className="absolute inset-y-2 right-2 flex items-center">
                {isPending && <Loader2 className="w-5 h-5 text-gray-400 animate-spin mr-3" />}
                <button className="px-6 bg-[#33040D] text-white rounded-xl hover:bg-[#4a0614] transition-colors font-bold text-[13px] shadow-md h-full">
                  Browse
                </button>
              </div>
            </div>
            
            {/* Catalog Search Results Preview */}
            <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              {catalog.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No products found in DB.</div>
              ) : catalog.map((item, idx) => (
                <div key={item._id || idx} className="flex justify-between items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">{item.name} <span className="text-gray-400 font-normal">| {item.size} / {item.color}</span></p>
                    <p className="text-[11px] font-mono text-gray-500 mt-0.5">{item.sku} • ৳{item.price}</p>
                  </div>
                  <button onClick={() => addToQueue(item)} className="text-[11px] font-bold bg-[#33040D]/5 text-[#33040D] px-3 py-1.5 rounded-full hover:bg-[#33040D] hover:text-white transition-colors">
                    Add to Queue
                  </button>
                </div>
              ))}
            </div>
          </RimalCard>

          <RimalCard className="animate-on-load !p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center">
              <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#33040D]" /> Print Queue ({printQueue.length} SKUs)
              </h2>
              <button onClick={() => setPrintQueue([])} className="text-[12px] font-bold text-red-500 hover:underline flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>
            
            <div className="p-6 bg-gray-50/50 space-y-4 max-h-96 overflow-y-auto">
              {printQueue.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">Queue is empty</p>
              )}
              {printQueue.map((item, idx) => (
                <div key={idx} className="bg-white rounded-[16px] border border-gray-200 p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="text-[14px] font-bold text-gray-900">{item.name} <span className="text-gray-400 font-medium">| {item.size} / {item.color}</span></h4>
                    <p className="text-[12px] font-mono text-gray-500 mt-0.5">{item.sku}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Print Qty</span>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1 border border-gray-200">
                        <button onClick={() => updateQty(item.sku, -1)} className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm hover:text-[#33040D]"><Minus className="w-4 h-4" /></button>
                        <span className="text-[14px] font-bold w-8 text-center text-[#33040D]">{item.qty}</span>
                        <button onClick={() => updateQty(item.sku, 1)} className="w-7 h-7 rounded-full bg-[#33040D] flex items-center justify-center text-white shadow-sm hover:bg-[#4a0614]"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <button onClick={() => removeFromQueue(item.sku)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Total Labels</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-[32px] font-black text-[#33040D] leading-none">{totalLabels}</span>
                    <span className="text-xs font-semibold text-gray-400">stickers</span>
                  </div>
                  <p className="text-[11px] text-green-700 bg-green-50 border border-green-200/80 rounded-md px-2 py-0.5 mt-2 font-bold inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Enforced: Portrait Mode (No Landscape)
                  </p>
                </div>

                {/* Print Direction / Orientation Toggle */}
                <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Print Layout:
                  </span>
                  <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => handleOrientationChange('normal')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        orientation === 'normal'
                          ? 'bg-[#33040D] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📄 Portrait (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOrientationChange('rotate90')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        orientation === 'rotate90'
                          ? 'bg-[#33040D] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ↻ Rotate 90°
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handlePrint}
                  disabled={totalLabels === 0}
                  className="w-full lg:w-auto py-3.5 px-8 bg-[#33040D] hover:bg-[#4a0614] disabled:opacity-50 text-white rounded-xl font-bold text-[15px] shadow-[0_8px_20px_rgba(51,4,13,0.25)] hover:shadow-[0_8px_25px_rgba(51,4,13,0.35)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Printer className="w-5 h-5" /> Print All Labels
                </button>
              </div>

              {/* Helpful Hint banner */}
              <div className="flex items-center gap-2 p-2.5 bg-green-50/80 border border-green-200/60 rounded-xl text-xs text-green-900 font-medium">
                <span className="font-bold text-green-700">✓ Portrait Ready:</span>
                <span>
                  প্রিন্ট উইন্ডো স্বয়ংক্রিয়ভাবে <strong>Portrait</strong> মোডে ওপেন হবে (কোনো Landscape সিলেক্ট হবে না)।
                </span>
              </div>
            </div>
          </RimalCard>

        </div>

        {/* Right Column - Thermal Printer Preview */}
        <div className="xl:col-span-5 animate-on-load barcode-print-area">
          <div className="flex justify-between items-center mb-4 print:hidden">
            <h3 className="text-[16px] font-bold text-gray-900">Live Print Preview</h3>
            <span className="text-[12px] font-bold text-[#33040D] bg-[#33040D]/10 px-3 py-1 rounded-full">
              Standard 1.50″ × 1.00″ {orientation !== 'normal' ? `(${orientation === 'rotate90' ? '+90°' : '-90°'})` : ''}
            </span>
          </div>
          
          <div className="bg-gray-100 p-8 rounded-[8px] flex flex-row flex-wrap justify-center gap-6 overflow-y-auto max-h-[842px] print:block print:shadow-none print:bg-white print:border-none print:p-0 print:m-0 print:max-h-none print:overflow-visible">
            {/* On-screen preview */}
            {printQueue.length === 0 && (
              <div className="text-center text-gray-500 font-medium py-10 print:hidden">
                Queue is empty. Add items to preview.
              </div>
            )}
            
            {printQueue.flatMap(item => 
              Array.from({ length: item.qty }).map((_, i) => (
                <div 
                  key={`${item.sku}-${i}`} 
                  className="barcode-page-wrapper transform scale-[1.5] origin-top mb-14 mt-4 print:transform-none print:scale-100 print:mb-0 print:mt-0 print:w-[1.5in] print:h-[1in] print:flex print:items-center print:justify-center print:overflow-hidden"
                >
                  <div className="barcode-sticker w-[1.5in] h-[1in] overflow-hidden bg-white border border-gray-300 rounded shadow-sm mx-auto print:border-none print:rounded-none print:shadow-none box-border flex items-center justify-center p-0 select-none">
                    
                    <div 
                      className="w-[1.5in] h-[1in] flex flex-col items-center justify-center p-1 text-center"
                      style={{
                        transform: orientation === 'rotate90' 
                          ? 'rotate(90deg) scale(0.66)' 
                          : orientation === 'rotate270' 
                          ? 'rotate(-90deg) scale(0.66)' 
                          : 'none',
                        transformOrigin: 'center center'
                      }}
                    >
                      {/* Product Name */}
                      <p className="text-[9.5px] font-bold text-black leading-tight truncate w-full px-1">
                        {item.name}
                      </p>

                      {/* Size & Color */}
                      <p className="text-[8.5px] font-semibold text-gray-700 leading-none mt-0.5">
                        {item.size || 'Free Size'}{item.color && item.color !== 'Standard' ? ` / ${item.color}` : ''}
                      </p>

                      {/* Barcode SVG */}
                      <div className="w-full flex justify-center items-center my-0.5">
                        <Barcode 
                          value={item.sku} 
                          format="CODE128"
                          width={1.15} 
                          height={24} 
                          fontSize={9} 
                          font="monospace"
                          textMargin={1}
                          background="transparent"
                          lineColor="#000000"
                          margin={0}
                        />
                      </div>

                      {/* Price */}
                      <p className="text-[12px] font-black text-black leading-none flex items-baseline justify-center gap-1">
                        ৳ {item.price} 
                        <span className="text-[8.5px] font-bold text-gray-600">(VAT Incl.)</span>
                      </p>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
