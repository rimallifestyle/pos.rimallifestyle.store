'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import gsap from 'gsap';
import Barcode from 'react-barcode';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Search, Printer, Plus, Minus, Tag, Trash2, Loader2, X } from 'lucide-react';
import { searchProducts, getAllProducts } from '@/actions/products';

export default function BarcodeCenterPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [catalog, setCatalog] = useState<any[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [printQueue, setPrintQueue] = useState<any[]>([]);
  const [orientation, setOrientation] = useState<'normal' | 'rotate90' | 'rotate270'>('normal');
  const [topOffset, setTopOffset] = useState<number>(3); // Default 3mm down from top

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rimal_barcode_orientation');
      if (saved === 'normal' || saved === 'rotate90' || saved === 'rotate270') {
        setOrientation(saved);
      }
      const savedTop = localStorage.getItem('rimal_barcode_top_offset');
      if (savedTop !== null) {
        const num = Number(savedTop);
        if (!isNaN(num)) setTopOffset(num);
      }
    } catch (e) {}
  }, []);

  const handleOrientationChange = (val: 'normal' | 'rotate90' | 'rotate270') => {
    setOrientation(val);
    try {
      localStorage.setItem('rimal_barcode_orientation', val);
    } catch (e) {}
  };

  const handleTopOffsetChange = (val: number) => {
    const clamped = Math.max(0, Math.min(15, val));
    setTopOffset(clamped);
    try {
      localStorage.setItem('rimal_barcode_top_offset', String(clamped));
    } catch (e) {}
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    gsap.fromTo(elements, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out' });
    
    // Load initial products
    fetchInitialProducts();
  }, []);

  const fetchInitialProducts = async () => {
    setIsSearching(true);
    try {
      const data = await getAllProducts();
      setCatalog(data);
      setMasterCatalog(data);
    } catch (e) {
      console.error('Fetch products error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const executeSearch = async (query: string) => {
    const q = query.trim();
    if (!q) {
      setCatalog(masterCatalog);
      setIsSearching(false);
      return;
    }

    // Instant local filter from master catalog
    const qLower = q.toLowerCase();
    const localMatches = masterCatalog.filter(item => 
      (item.name || '').toLowerCase().includes(qLower) ||
      (item.sku || '').toLowerCase().includes(qLower) ||
      (item.category || '').toLowerCase().includes(qLower) ||
      (item.size || '').toLowerCase().includes(qLower) ||
      (item.color || '').toLowerCase().includes(qLower)
    );
    if (localMatches.length > 0) {
      setCatalog(localMatches);
    }

    setIsSearching(true);
    try {
      const dbResults = await searchProducts(q);
      setCatalog(dbResults);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim() === '') {
      setCatalog(masterCatalog);
      setIsSearching(false);
      return;
    }

    // Fast instant filter on keystroke
    const qLower = val.trim().toLowerCase();
    const localMatches = masterCatalog.filter(item => 
      (item.name || '').toLowerCase().includes(qLower) ||
      (item.sku || '').toLowerCase().includes(qLower) ||
      (item.category || '').toLowerCase().includes(qLower) ||
      (item.size || '').toLowerCase().includes(qLower) ||
      (item.color || '').toLowerCase().includes(qLower)
    );
    if (localMatches.length > 0) {
      setCatalog(localMatches);
    }

    // Debounce DB search (300ms)
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(val);
    }, 300);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    executeSearch(searchQuery);
  };

  const handleClearSearch = () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setSearchQuery('');
    setCatalog(masterCatalog);
    setIsSearching(false);
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
            background: #fff !important;
          }
          .barcode-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .barcode-page-wrapper {
            width: 100% !important;
            height: 100vh !important;
            min-height: 100vh !important;
            max-height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .barcode-page-wrapper:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .barcode-sticker {
            width: 1.5in !important;
            height: 1in !important;
            max-width: 1.5in !important;
            max-height: 1in !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            margin: auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            text-align: center !important;
          }
          .barcode-sticker svg {
            max-width: 96% !important;
            height: auto !important;
            display: block !important;
            margin: 0 auto !important;
            shape-rendering: crispEdges !important;
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
          
          <RimalCard className="animate-on-load">
            <h2 className="text-[18px] font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#33040D]" /> Search product Add to Queue
            </h2>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-12 pr-28 py-3.5 border border-gray-200 rounded-[16px] text-[14px] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all shadow-inner"
                placeholder="Search by SKU (e.g. RL-211-S) or Product Name..."
              />
              <div className="absolute inset-y-1.5 right-1.5 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer mr-1"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="px-5 bg-[#33040D] text-white rounded-xl hover:bg-[#4a0614] transition-colors font-bold text-[13px] shadow-sm h-full flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </div>
            </form>
            
            {/* Catalog Search Results Preview */}
            <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              {catalog.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500 font-medium">
                  {searchQuery ? `No products found matching "${searchQuery}".` : 'No products found in DB.'}
                </div>
              ) : catalog.map((item, idx) => (
                <div key={item._id ? `${item._id}-${item.sku}-${idx}` : idx} className="flex justify-between items-center p-3.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">
                      {item.name} <span className="text-gray-400 font-normal">| {item.size} / {item.color}</span>
                    </p>
                    <p className="text-[11px] font-mono text-gray-500 mt-1 flex items-center gap-2">
                      <span className="font-bold text-[#33040D] bg-[#33040D]/10 px-2 py-0.5 rounded text-[11px]">
                        {item.sku}
                      </span>
                      <span>৳{item.price}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => addToQueue(item)} 
                    className="text-[11px] font-bold bg-[#33040D]/5 text-[#33040D] px-3.5 py-1.5 rounded-full hover:bg-[#33040D] hover:text-white transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to Queue
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

                {/* Top Offset / Vertical Nudge */}
                <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Top Offset (Nudge Down):
                  </span>
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => handleTopOffsetChange(topOffset - 1)}
                      disabled={topOffset <= 0}
                      className="w-7 h-7 rounded-lg bg-white disabled:opacity-40 flex items-center justify-center font-bold text-gray-700 shadow-sm hover:text-[#33040D] cursor-pointer"
                      title="Move Up (-1mm)"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-[#33040D] px-2 min-w-[50px] text-center">
                      +{topOffset} mm
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTopOffsetChange(topOffset + 1)}
                      disabled={topOffset >= 15}
                      className="w-7 h-7 rounded-lg bg-white disabled:opacity-40 flex items-center justify-center font-bold text-gray-700 shadow-sm hover:text-[#33040D] cursor-pointer"
                      title="Move Down (+1mm)"
                    >
                      <Plus className="w-3.5 h-3.5" />
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
                  Print window opens in <strong>Portrait</strong> mode automatically (no Landscape selection required).
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
          
          <div className="bg-gray-100 p-8 rounded-[8px] flex flex-row flex-wrap justify-center gap-6 overflow-y-auto max-h-[842px] print:block print:shadow-none print:bg-white print:border-none print:p-0 print:m-0 print:max-h-none print:overflow-visible print:w-full">
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
                  className="barcode-page-wrapper transform scale-[1.5] origin-top mb-14 mt-4 print:transform-none print:scale-100 print:mb-0 print:mt-0 print:w-full print:h-[100vh] print:min-h-[100vh] print:flex print:flex-col print:items-center print:justify-center print:mx-auto print:overflow-hidden"
                >
                  <div 
                    className="barcode-sticker w-[1.5in] h-[1in] overflow-hidden bg-white border border-gray-300 rounded shadow-sm mx-auto print:border-none print:rounded-none print:shadow-none box-border flex items-center justify-center p-0 select-none print:mx-auto transition-transform duration-150"
                    style={{ transform: `translateY(${topOffset}mm)` }}
                  >
                    
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center px-1 pt-1 pb-0.5 text-center box-border"
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
