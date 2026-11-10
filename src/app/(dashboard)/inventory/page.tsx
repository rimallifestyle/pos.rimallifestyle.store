'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { 
  Truck, 
  ArrowRightLeft, 
  ScanLine, 
  Search, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  Box, 
  RefreshCw, 
  X, 
  Loader2, 
  Package, 
  Store, 
  Edit3,
  Layers,
  Check
} from 'lucide-react';
import { 
  getWarehouseStock, 
  getWarehouseMetrics, 
  adjustWarehouseStock, 
  dispatchToOutlet, 
  getTransfers,
  WarehouseStockItem 
} from '@/actions/inventory';
import { getOutlets } from '@/actions/outlets';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface BatchItem {
  productId: string;
  sku: string;
  name: string;
  variant: string;
  availableStock: number;
  quantity: number;
}

export default function InventoryDistributionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Data States
  const [stockItems, setStockItems] = useState<WarehouseStockItem[]>([]);
  const [metrics, setMetrics] = useState({
    masterStock: 0,
    outletStock: 0,
    lowStockCount: 0,
    transfersCount: 0,
    totalSkus: 0
  });
  const [outlets, setOutlets] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dispatch Builder States
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WarehouseStockItem[]>([]);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [driverName, setDriverName] = useState('Warehouse Staff');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Stock Table Filters
  const [tableSearch, setTableSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Adjust Stock Modal State
  const [adjustItem, setAdjustItem] = useState<WarehouseStockItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<'add' | 'set' | 'subtract'>('add');
  const [adjustQty, setAdjustQty] = useState<number | ''>(10);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Load All Initial Data
  const loadData = async () => {
    try {
      const [stockData, metricsData, outletsData, transfersData] = await Promise.all([
        getWarehouseStock(),
        getWarehouseMetrics(),
        getOutlets(),
        getTransfers(10)
      ]);

      setStockItems(stockData);
      setMetrics(metricsData);
      setOutlets(outletsData);
      setTransfers(transfersData);

      if (outletsData.length > 0 && !selectedOutletId) {
        setSelectedOutletId(outletsData[0]._id);
      }
    } catch (err) {
      console.error('Error loading inventory data:', err);
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    gsap.fromTo(elements, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: 'power3.out' });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    toast.success('Inventory synced with database');
  };

  // Product Search for Dispatch Builder
  useEffect(() => {
    if (!productSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = productSearchQuery.toLowerCase();
    const filtered = stockItems.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.sku.toLowerCase().includes(q) ||
      item.variant.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    ).slice(0, 8);
    setSearchResults(filtered);
  }, [productSearchQuery, stockItems]);

  // Add Item to Dispatch Batch
  const handleAddToBatch = (item: WarehouseStockItem) => {
    if (item.warehouseStock <= 0) {
      toast.error(`${item.name} (${item.sku}) is currently out of stock in the warehouse.`);
      return;
    }

    const existingIndex = batchItems.findIndex(b => b.sku === item.sku);
    if (existingIndex > -1) {
      const existing = batchItems[existingIndex];
      if (existing.quantity >= item.warehouseStock) {
        toast.error(`Cannot add more than available warehouse stock (${item.warehouseStock} pcs).`);
        return;
      }
      const updated = [...batchItems];
      updated[existingIndex].quantity += 1;
      setBatchItems(updated);
    } else {
      setBatchItems([
        ...batchItems,
        {
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          variant: item.variant,
          availableStock: item.warehouseStock,
          quantity: 1
        }
      ]);
    }
    setProductSearchQuery('');
    setSearchResults([]);
  };

  // Update Batch Item Quantity
  const updateBatchQty = (sku: string, delta: number) => {
    setBatchItems(prev => prev.map(item => {
      if (item.sku === sku) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.availableStock) {
          toast.error(`Maximum available warehouse stock is ${item.availableStock} pcs.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as BatchItem[]);
  };

  const removeBatchItem = (sku: string) => {
    setBatchItems(prev => prev.filter(item => item.sku !== sku));
  };

  // Dispatch Action
  const handleDispatch = async () => {
    if (!selectedOutletId) {
      toast.error('Please select a destination outlet.');
      return;
    }
    if (batchItems.length === 0) {
      toast.error('Please add at least one item to the dispatch batch.');
      return;
    }

    setIsDispatching(true);
    try {
      const res = await dispatchToOutlet({
        outletId: selectedOutletId,
        items: batchItems.map(i => ({
          productId: i.productId,
          sku: i.sku,
          name: i.name,
          variant: i.variant,
          quantity: i.quantity
        })),
        notes: dispatchNotes,
        driver: driverName
      });

      if (res.success) {
        toast.success(`Batch #${res.transferNumber} dispatched successfully! (${res.totalItems} items sent to ${res.outletName})`);
        setBatchItems([]);
        setDispatchNotes('');
        await loadData();
      } else {
        toast.error(res.error || 'Failed to dispatch stock');
      }
    } catch (err: any) {
      toast.error(err.message || 'Dispatch error occurred');
    } finally {
      setIsDispatching(false);
    }
  };

  // Stock Adjustment Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || adjustQty === '' || Number(adjustQty) < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIsAdjusting(true);
    try {
      const res = await adjustWarehouseStock({
        productId: adjustItem.productId,
        sku: adjustItem.sku,
        quantity: Number(adjustQty),
        mode: adjustMode
      });

      if (res.success) {
        toast.success(`Warehouse stock updated for ${adjustItem.sku}: ${res.newQuantity} pcs`);
        setAdjustItem(null);
        await loadData();
      } else {
        toast.error(res.error || 'Failed to adjust stock');
      }
    } catch (err: any) {
      toast.error(err.message || 'Adjustment failed');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Filtered Stock Items for Master Table
  const filteredStock = stockItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.variant.toLowerCase().includes(tableSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (stockFilter === 'low') return item.isLowStock;
    if (stockFilter === 'out') return item.isOutOfStock;
    return true;
  });

  const totalBatchItemsCount = batchItems.reduce((sum, i) => sum + i.quantity, 0);
  const selectedOutletName = outlets.find(o => o._id === selectedOutletId)?.name || 'Outlet';

  return (
    <div ref={containerRef} className="max-w-[1600px] mx-auto pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <RimalTopBar 
          title="Stock & Warehouse Management" 
          subtitle="Real-time master inventory, stock transfers, and outlet distribution" 
          emoji="🏭" 
        />
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#33040D] ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Sync Warehouse'}
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-on-load">
        <RimalCard className="bg-gradient-to-br from-[#33040D] to-[#5a0a1a] text-white">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <Box className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-[11px] sm:text-[13px] font-bold text-white/80 uppercase tracking-wider mb-1">Master Stock</p>
          <h3 className="text-[24px] sm:text-[32px] font-black leading-tight">
            {isLoading ? '...' : metrics.masterStock.toLocaleString()}{' '}
            <span className="text-[12px] font-medium text-white/70">pcs</span>
          </h3>
        </RimalCard>

        <RimalCard>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
            <Store className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-[11px] sm:text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-1">Outlet Allocated</p>
          <h3 className="text-[24px] sm:text-[32px] font-black text-gray-900 leading-tight">
            {isLoading ? '...' : metrics.outletStock.toLocaleString()}{' '}
            <span className="text-[12px] font-medium text-gray-400">pcs</span>
          </h3>
        </RimalCard>

        <RimalCard>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-[11px] sm:text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-1">Completed Transfers</p>
          <h3 className="text-[24px] sm:text-[32px] font-black text-gray-900 leading-tight">
            {isLoading ? '...' : metrics.transfersCount}{' '}
            <span className="text-[12px] font-medium text-gray-400">batches</span>
          </h3>
        </RimalCard>

        <RimalCard className="border border-red-100 bg-red-50/30">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-[11px] sm:text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-1">Low Stock Alerts</p>
          <h3 className="text-[24px] sm:text-[32px] font-black text-red-600 leading-tight">
            {isLoading ? '...' : metrics.lowStockCount}{' '}
            <span className="text-[12px] font-medium text-red-400">SKUs</span>
          </h3>
        </RimalCard>
      </div>

      {/* Main Interactive Grid: Dispatch Builder (Left) & Active Queues (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
        
        {/* Left Column: Live Dispatch Builder (7 cols) */}
        <div className="xl:col-span-7 animate-on-load">
          <RimalCard className="h-full flex flex-col !p-0 overflow-hidden shadow-sm" glass>
            
            {/* Header with Destination Outlet Selector */}
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-white/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-bold text-gray-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-[#33040D]" /> New Distribution Batch
                </h2>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Transfer stock from master warehouse to retail store</p>
              </div>
              
              <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Destination Outlet</span>
                {outlets.length === 0 ? (
                  <Link href="/outlets" className="text-xs text-red-600 font-bold hover:underline">
                    + Create Outlet First
                  </Link>
                ) : (
                  <select 
                    className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-gray-900 text-[13px] font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#33040D]/20 cursor-pointer"
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                  >
                    {outlets.map(o => (
                      <option key={o._id} value={o._id}>{o.name} ({o.location})</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Product Live Search & Add */}
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-white relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all"
                  placeholder="Search warehouse stock by SKU or Product name to add..."
                />
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-4 right-4 sm:left-6 sm:right-6 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-200/80 z-30 max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                  {searchResults.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleAddToBatch(item)}
                      className="p-3.5 hover:bg-[#33040D]/5 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img src={item.img} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                        <div>
                          <p className="text-[13px] font-bold text-gray-900">{item.name}</p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {item.sku} <span className="mx-1">•</span> <span className="font-semibold text-gray-700">{item.variant}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                          item.warehouseStock > 10 ? 'bg-green-50 text-green-700' :
                          item.warehouseStock > 0 ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {item.warehouseStock} in warehouse
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Click to add</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Batch Item List */}
            <div className="flex-1 p-4 sm:p-6 bg-gray-50/50 space-y-3 min-h-[220px] max-h-[360px] overflow-y-auto">
              {batchItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 text-gray-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <p className="text-[14px] font-bold text-gray-700">Dispatch Batch is Empty</p>
                  <p className="text-[12px] text-gray-400 max-w-[280px] mt-1">Search and select items above to add them to this transfer batch.</p>
                </div>
              ) : (
                batchItems.map((item) => (
                  <div key={item.sku} className="bg-white rounded-xl border border-gray-200/80 p-3.5 sm:p-4 flex items-center justify-between shadow-xs">
                    <div className="min-w-0 pr-3">
                      <h4 className="text-[13px] sm:text-[14px] font-bold text-gray-900 truncate">
                        {item.name} <span className="text-gray-400 font-medium">| {item.variant}</span>
                      </h4>
                      <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                        {item.sku} <span className="mx-1.5">•</span> 
                        <span className="text-green-600 font-semibold">{item.availableStock} available</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-1 border border-gray-200">
                        <button 
                          type="button"
                          onClick={() => updateBatchQty(item.sku, -1)}
                          className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-xs hover:text-[#33040D] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[13px] font-black w-8 text-center text-[#33040D]">
                          {item.quantity}
                        </span>
                        <button 
                          type="button"
                          onClick={() => updateBatchQty(item.sku, 1)}
                          className="w-6 h-6 rounded-full bg-[#33040D] flex items-center justify-center text-white shadow-xs hover:bg-[#4a0614] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button 
                        type="button"
                        onClick={() => removeBatchItem(item.sku)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer Summary & Submit Button */}
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <input 
                  type="text" 
                  value={driverName} 
                  onChange={(e) => setDriverName(e.target.value)} 
                  placeholder="Driver / Handled by (e.g. Rahim)" 
                  className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white outline-none"
                />
                <input 
                  type="text" 
                  value={dispatchNotes} 
                  onChange={(e) => setDispatchNotes(e.target.value)} 
                  placeholder="Optional Notes / Batch memo..." 
                  className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white outline-none"
                />
              </div>

              <div className="flex justify-between items-center mb-4 text-[13px] font-medium text-gray-600">
                <span>Total Items in Batch: <strong className="text-gray-900 text-[16px] sm:text-[18px]">{totalBatchItemsCount} pcs</strong></span>
                <span>Destination: <strong className="text-gray-900">{selectedOutletName}</strong></span>
              </div>

              <button 
                type="button"
                disabled={isDispatching || batchItems.length === 0}
                onClick={handleDispatch}
                className="w-full py-3.5 sm:py-4 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-xl sm:rounded-2xl font-bold text-[14px] sm:text-[15px] shadow-[0_8px_20px_rgba(51,4,13,0.25)] hover:shadow-[0_8px_25px_rgba(51,4,13,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isDispatching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                {isDispatching ? 'Processing Transfer...' : `Dispatch to ${selectedOutletName}`}
              </button>
            </div>
          </RimalCard>
        </div>

        {/* Right Column: Active Dispatch Queue / Recent Transfers (5 cols) */}
        <div className="xl:col-span-5 space-y-6 animate-on-load">
          <RimalCard className="!p-0 h-full flex flex-col shadow-sm">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-white/70">
              <h2 className="text-[17px] sm:text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#33040D]" /> Recent Dispatches
              </h2>
              <span className="bg-[#33040D]/10 text-[#33040D] text-[11px] font-bold px-3 py-1 rounded-full">
                {transfers.length} Batches
              </span>
            </div>

            <div className="flex-1 p-4 sm:p-6 space-y-3 bg-gray-50/40 overflow-y-auto max-h-[500px]">
              {transfers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-gray-600">No dispatches recorded yet</p>
                  <p className="text-[11px] text-gray-400 mt-1">Dispatches created on the left will appear here with live logs.</p>
                </div>
              ) : (
                transfers.map((item) => (
                  <div key={item._id} className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs hover:border-[#33040D]/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-[#33040D] bg-[#33040D]/10 px-2 py-0.5 rounded-md">
                          {item.transferNumber}
                        </span>
                        <h4 className="text-[14px] font-bold text-gray-900 mt-1.5 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-gray-400" />
                          To: {item.destinationOutletId?.name || 'Outlet'}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                        {item.status || 'Completed'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[12px] pt-2 border-t border-gray-100 text-gray-500">
                      <span>Items: <strong className="text-gray-900 font-bold">{item.totalItems} pcs</strong></span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </RimalCard>
        </div>

      </div>

      {/* Bottom Section: Warehouse Master Stock Table with Live Filters & Restock Button */}
      <div className="animate-on-load">
        <RimalCard className="!p-0 overflow-hidden shadow-sm">
          
          {/* Table Controls */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70">
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <Box className="w-5 h-5 text-[#33040D]" /> Warehouse Master Stock Catalog
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Real database stock items. Click 'Adjust / Restock' to modify quantity.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    stockFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All ({stockItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('low')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    stockFilter === 'low' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Low Stock
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('out')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    stockFilter === 'out' ? 'bg-white text-red-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Out of Stock
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter by SKU, Name..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white outline-none w-full sm:w-[220px]"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Product & Variant</th>
                  <th className="py-4 px-6">SKU (Barcode)</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Master Warehouse</th>
                  <th className="py-4 px-6 text-right">Outlets Stock</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#33040D]" />
                      Loading warehouse stock...
                    </td>
                  </tr>
                ) : filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 font-medium">
                      No stock items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <img src={item.img} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-gray-200" />
                          <div>
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <p className="text-[11px] text-gray-500 font-medium">{item.variant}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-6 font-mono text-gray-600 font-medium">{item.sku}</td>
                      <td className="py-3.5 px-6 text-gray-600 font-medium">{item.category}</td>
                      
                      <td className="py-3.5 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.isOutOfStock ? 'bg-red-50 text-red-600 border border-red-200' :
                          item.isLowStock ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {item.isOutOfStock ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <span className="text-[14px] font-black text-gray-900">
                          {item.warehouseStock}{' '}
                          <span className="text-[11px] text-gray-400 font-normal">pcs</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right text-gray-500 font-bold">
                        {item.outletStock} pcs
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustItem(item);
                            setAdjustMode('add');
                            setAdjustQty(10);
                          }}
                          className="px-3 py-1.5 bg-[#33040D]/10 hover:bg-[#33040D] text-[#33040D] hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Adjust / Restock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </RimalCard>
      </div>

      {/* Adjust / Restock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-[460px] w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Adjust Warehouse Stock</h3>
                <p className="text-xs text-gray-500 mt-0.5">{adjustItem.name} ({adjustItem.variant})</p>
                <p className="text-[11px] font-mono text-[#33040D] mt-0.5">SKU: {adjustItem.sku}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setAdjustItem(null)} 
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl mb-4 border border-gray-100 flex justify-between items-center text-xs font-semibold text-gray-600">
              <span>Current Master Stock:</span>
              <span className="text-sm font-black text-[#33040D]">{adjustItem.warehouseStock} pcs</span>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Action Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustMode('add')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      adjustMode === 'add' ? 'bg-[#33040D] text-white border-[#33040D]' : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    + Add (Restock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode('set')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      adjustMode === 'set' ? 'bg-[#33040D] text-white border-[#33040D]' : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    Set Exact Qty
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode('subtract')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      adjustMode === 'subtract' ? 'bg-[#33040D] text-white border-[#33040D]' : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    - Reduce Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {adjustMode === 'add' ? 'Quantity to Add' : adjustMode === 'subtract' ? 'Quantity to Reduce' : 'New Total Stock'}
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#33040D]/20"
                />
              </div>

              {/* Quick Presets */}
              {adjustMode === 'add' && (
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAdjustQty(val)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-colors cursor-pointer"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="flex-1 py-2.5 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isAdjusting ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
