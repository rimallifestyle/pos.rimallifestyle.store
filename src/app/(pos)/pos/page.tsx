'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Search, Scan, Trash2, Minus, Plus, CreditCard, Banknote, User, Percent, X, CheckCircle2, PauseCircle, Clock, History, FileText, Loader2, Crown, Undo, LogOut, LayoutDashboard } from 'lucide-react';
import RimalCard from '@/components/rimal-ui/RimalCard';

import { getPosProducts, saveSale, getSaleByInvoice, processReturn, getPosContext, getEndOfDayReport } from '@/actions/pos';
import { checkCustomerMembership, createCustomer } from '@/actions/customers';
import { getPosSettings } from '@/actions/settings';
import { getMembershipTiers, requestCustomerMembership } from '@/actions/memberships';
import { toast } from 'react-hot-toast';
import Barcode from 'react-barcode';
import { logoutUser } from '@/actions/auth';
import { useRouter } from 'next/navigation';

export default function POSPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Settings State
  const [posSettings, setPosSettings] = useState({ vatEnabled: false, vatPercentage: 0 });
  const [membershipTiers, setMembershipTiers] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('');

  // Cart state
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Payment Workflow State
  const [paymentType, setPaymentType] = useState('Cash');
  const [paymentProvider, setPaymentProvider] = useState('Visa / MC');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  
  // New State for CRM & Features
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountValue, setDiscountValue] = useState(0);
  
  // Membership State
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isCheckingMember, setIsCheckingMember] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<{tier: string, discountPercent: number, pendingTier?: string} | null>(null);

  // Return / Refund State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnInvoiceId, setReturnInvoiceId] = useState('');
  const [returnSaleData, setReturnSaleData] = useState<any>(null);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [completedInvoiceId, setCompletedInvoiceId] = useState('');
  const [posContext, setPosContext] = useState({ cashierName: 'Admin', outletName: 'RIMAL.', outletLocation: 'Sector 11, Uttara (UTT-01)' });
  
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
  const [endOfDayReport, setEndOfDayReport] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    gsap.fromTo(elements, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: 'power3.out' });
    async function loadData() {
      const [data, settingsData, tiersData, contextData] = await Promise.all([
        getPosProducts(), 
        getPosSettings(), 
        getMembershipTiers(),
        getPosContext()
      ]);
      setProducts(data);
      
      const cats = Array.from(new Set<string>(data.map((p: any) => p.category as string)));
      setCategories(['All', ...cats]);

      if (settingsData) {
        setPosSettings(settingsData);
      }
      if (tiersData) {
        setMembershipTiers(tiersData);
      }
      if (contextData) {
        setPosContext(contextData as any);
      }
    }
    loadData();
  }, []);

  // Sync state with local storage to prevent data loss on reload
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('pos_cart');
      if (savedCart) setCartItems(JSON.parse(savedCart));
      
      const savedHeld = localStorage.getItem('pos_held');
      if (savedHeld) setHeldOrders(JSON.parse(savedHeld));
      
      const savedCustPhone = localStorage.getItem('pos_cust_phone');
      if (savedCustPhone) setCustomerPhone(savedCustPhone);
      
      const savedCustName = localStorage.getItem('pos_cust_name');
      if (savedCustName) setCustomerName(savedCustName);
      
      const savedDiscount = localStorage.getItem('pos_discount');
      if (savedDiscount) setDiscountValue(Number(savedDiscount));
    } catch (e) {
      console.error('Failed to load POS state from localStorage', e);
    }
  }, []);

  const handleEndOfDayClick = async () => {
    setIsGeneratingReport(true);
    setShowEndOfDayModal(true);
    const res = await getEndOfDayReport();
    if (res.success) {
      setEndOfDayReport(res.report);
    } else {
      toast.error(res.error || 'Failed to generate report');
      setShowEndOfDayModal(false);
    }
    setIsGeneratingReport(false);
  };

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('pos_held', JSON.stringify(heldOrders));
  }, [heldOrders]);

  useEffect(() => {
    localStorage.setItem('pos_cust_phone', customerPhone);
    localStorage.setItem('pos_cust_name', customerName);
  }, [customerPhone, customerName]);

  useEffect(() => {
    localStorage.setItem('pos_discount', String(discountValue));
  }, [discountValue]);

  // Cart Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = posSettings.vatEnabled ? Math.round(subtotal * (posSettings.vatPercentage / 100)) : 0;
  const total = subtotal + tax - discountValue;

  const handleAddToCart = (product: any) => {
    if (product.stock <= 0) {
      toast.error('Out of stock!');
      return;
    }
    
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error('Cannot add more than available stock');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  // Global Barcode Scanner Listener
  useEffect(() => {
    let barcode = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input/textarea and it's not the search box
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        const inputId = document.activeElement?.id;
        // If it's a general input, we might still want to capture fast scans, but it's safer to only allow if it's the search box or not focused on any form element.
        // Barcode scanners are fast (< 30ms between keystrokes).
      }
      
      const currentTime = Date.now();
      
      // If time between keystrokes is > 50ms, it's likely manual typing. Reset barcode string.
      if (currentTime - lastKeyTime > 50) {
        barcode = '';
      }
      
      // Add character
      if (e.key.length === 1) {
        barcode += e.key;
      }
      
      // If Enter is pressed, and we accumulated a barcode fast enough
      if (e.key === 'Enter' && barcode.length >= 3) {
        if (barcode.toUpperCase().startsWith('INV-')) {
          setReturnInvoiceId(barcode.toUpperCase());
          setShowReturnModal(true);
          setSearchQuery('');
        } else {
          const exactMatch = products.find(p => p.sku.toLowerCase() === barcode.toLowerCase());
          
          if (exactMatch) {
            handleAddToCart(exactMatch);
            setSearchQuery(''); // Clear the input field in case it was focused
          } else {
            toast.error(`No product found for barcode: ${barcode}`);
            setSearchQuery('');
          }
        }
        
        barcode = '';
        e.preventDefault(); // Prevent accidental form submissions
      }
      
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products]);

  const updateCartQty = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return null as any; // We will filter it out below
        if (newQty > item.stock) {
          toast.error('Cannot exceed available stock');
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Hold Order Logic
  const handleHoldOrder = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty. Nothing to hold.');
      return;
    }
    
    const newHeldOrder = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cartItems: [...cartItems],
      customerPhone,
      customerName,
      discountValue,
      total: total
    };
    
    setHeldOrders(prev => [...prev, newHeldOrder]);
    
    // Clear current cart
    setCartItems([]);
    setCustomerPhone('');
    setCustomerName('Walk-in Customer');
    setDiscountValue(0);
    
    toast.success('Order placed on hold');
  };

  const handleResumeOrder = (heldOrder: any) => {
    setCartItems(heldOrder.cartItems);
    setCustomerPhone(heldOrder.customerPhone);
    setCustomerName(heldOrder.customerName);
    setDiscountValue(heldOrder.discountValue);
    
    // Remove from held orders
    setHeldOrders(prev => prev.filter(o => o.id !== heldOrder.id));
    setShowHeldOrdersModal(false);
    toast.success('Order resumed');
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Auto-check membership
  useEffect(() => {
    async function verifyMembership() {
      if (customerPhone.length === 11) {
        setIsCheckingMember(true);
        const member = await checkCustomerMembership(customerPhone);
        
        if (member) {
          setCustomerId(member._id);
          setCustomerName(member.name);
          setMembershipStatus({ tier: member.tier, discountPercent: member.discountPercent, pendingTier: member.pendingTier });
          // Calculate dynamic discount based on DB percentage
          setDiscountValue(Math.round(subtotal * (member.discountPercent / 100)));
        } else {
          setCustomerId(null);
          setMembershipStatus(null);
          setDiscountValue(0);
          setCustomerName('Walk-in Customer');
        }
        setIsCheckingMember(false);
      } else {
        setCustomerId(null);
        setMembershipStatus(null);
        setIsCheckingMember(false);
        setCustomerName('Walk-in Customer');
        if (membershipStatus) {
          setDiscountValue(0);
        }
      }
    }
    
    verifyMembership();
  }, [customerPhone, subtotal]);

  // Handle Confirm Payment
  const handleConfirmPayment = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    // Auto-save new customer if phone is 11 digits and not already a member
    if (customerPhone.length === 11 && !membershipStatus) {
      try {
        await createCustomer({
          name: customerName,
          phone: customerPhone,
          tier: 'Regular',
          discountPercent: 0
        });
      } catch (error) {
        console.error('Failed to auto-save customer:', error);
      }
    }
    
    // Save Sale to Backend
    const saleData = {
      customerName,
      customerPhone,
      items: cartItems.map(i => ({ productId: i.productId, sku: i.sku, quantity: i.qty, price: i.price })),
      subtotal,
      discount: discountValue,
      total,
      paymentMethod: paymentType,
      paymentProvider
    };
    
    const result = await saveSale(saleData);
    if (result.success) {
      setCompletedInvoiceId(result.invoiceId || '');
      setShowPaymentModal(false); 
      setShowReceiptModal(true); 
    } else {
      toast.error('Failed to save sale. Please try again.');
    }
  };

  return (
    <>
    <div ref={containerRef} className="h-full lg:h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-4 lg:gap-6 font-sans print:hidden">
      
      {/* Left Column - Product Grid */}
      <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-0 lg:h-full animate-on-load print:hidden">
        
        {/* POS Header / Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-3.5 md:py-4 border border-gray-200 md:border-0 rounded-xl md:rounded-[20px] text-[14px] md:text-[15px] bg-white shadow-sm md:shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus:ring-2 focus:ring-[#33040D]/20 font-medium placeholder-gray-400 outline-none transition-all"
              placeholder="Scan barcode or search..."
            />
            <button className="absolute inset-y-1.5 md:inset-y-2 right-1.5 md:right-2 px-3 md:px-4 bg-[#33040D]/5 text-[#33040D] rounded-lg md:rounded-xl hover:bg-[#33040D]/10 transition-colors flex items-center gap-1.5 md:gap-2 font-bold text-[12px] md:text-[13px]">
              <Scan className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Scan Mode</span>
            </button>
          </div>

          {/* End of Day / Utilities */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">

            <button 
              onClick={async () => {
                await logoutUser();
                router.push('/admin/login');
              }}
              className="h-[48px] md:h-[56px] px-4 md:px-5 rounded-xl md:rounded-[20px] bg-white text-gray-600 font-bold text-[12px] md:text-[13px] border border-gray-200 md:border-transparent md:shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:text-red-500 hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
            <button 
              onClick={() => setShowReturnModal(true)}
              className="h-[48px] md:h-[56px] px-4 md:px-5 rounded-xl md:rounded-[20px] bg-white text-[#d63031] font-bold text-[12px] md:text-[13px] border border-red-100 md:border-transparent md:shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:bg-[#d63031]/10 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Undo className="w-4 h-4" /> Return
            </button>
            <button 
              onClick={handleEndOfDayClick}
              disabled={isGeneratingReport}
              className="h-[48px] md:h-[56px] px-4 md:px-5 rounded-xl md:rounded-[20px] bg-[#33040D] text-white font-bold text-[12px] md:text-[13px] shadow-[0_4px_20px_rgba(51,4,13,0.15)] hover:bg-[#4a0614] hover:shadow-[0_8px_25px_rgba(51,4,13,0.25)] hover:-translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} EOD
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 md:mx-0 md:px-0">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[12px] md:text-[13px] font-bold transition-all shadow-sm ${
                activeCategory === cat 
                  ? 'bg-[#33040D] text-white shadow-[0_4px_10px_rgba(51,4,13,0.25)]' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1 md:pr-2 pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                onClick={() => handleAddToCart(product)}
                className={`bg-white rounded-2xl md:rounded-[24px] overflow-hidden shadow-sm md:shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md md:hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all cursor-pointer group border ${product.stock <= 0 ? 'opacity-60 grayscale' : 'border-gray-100 md:border-transparent hover:border-gray-200'} flex flex-col`}
              >
                <div className="h-32 md:h-40 relative overflow-hidden bg-gray-100">
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className={`absolute top-2 right-2 md:top-3 md:right-3 backdrop-blur-sm px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-[11px] font-bold shadow-sm ${product.stock > 0 ? 'bg-white/90 text-gray-700' : 'bg-red-500/90 text-white'}`}>
                    {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                  </div>
                </div>
                <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[13px] md:text-[14px] font-bold text-gray-900 leading-tight mb-0.5 md:mb-1 group-hover:text-[#33040D] transition-colors line-clamp-1">{product.name}</h3>
                    <p className="text-[11px] md:text-[12px] font-medium text-gray-500">{product.variant}</p>
                  </div>
                  <div className="mt-2 md:mt-3 flex items-center justify-between">
                    <span className="text-[14px] md:text-[16px] font-black text-[#33040D]">৳ {product.price}</span>
                    <button 
                      disabled={product.stock <= 0}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#33040D]/5 flex items-center justify-center text-[#33040D] group-hover:bg-[#33040D] group-hover:text-white transition-colors disabled:opacity-50 disabled:group-hover:bg-[#33040D]/5 disabled:group-hover:text-[#33040D]"
                    >
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-10 md:py-20 text-center text-gray-500">
                <p className="font-bold">No products found</p>
                <p className="text-sm mt-1">Try searching for something else.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Cart (Receipt) */}
      <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col animate-on-load print:hidden min-h-[600px] lg:min-h-0 lg:h-full mt-4 lg:mt-0 pb-10 lg:pb-0">
        <RimalCard className="flex-1 flex flex-col !p-0 overflow-hidden border lg:border-none shadow-sm lg:shadow-[0_4px_30px_rgb(0,0,0,0.04)]" glass>
          
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-100 bg-white/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#33040D]/5 flex items-center justify-center text-[#33040D] shadow-sm flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-gray-900 truncate max-w-[130px]">{customerName}</p>
                <button 
                  onClick={() => setShowCustomerModal(true)}
                  className="text-[11px] font-bold text-[#33040D] hover:underline uppercase tracking-wide flex items-center gap-1 mt-0.5 whitespace-nowrap"
                >
                  {customerPhone ? 'Edit Details' : 'Add Info'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 relative">
              {heldOrders.length > 0 && (
                <button 
                  onClick={() => setShowHeldOrdersModal(true)}
                  className="whitespace-nowrap text-[12px] font-bold px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <History className="w-3.5 h-3.5" /> 
                  Recall ({heldOrders.length})
                </button>
              )}
              <button 
                onClick={handleHoldOrder}
                className="whitespace-nowrap text-[12px] font-bold px-3 py-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition-colors flex items-center gap-1.5"
              >
                <PauseCircle className="w-3.5 h-3.5" /> Hold
              </button>
              <button 
                onClick={() => setCartItems([])}
                className="whitespace-nowrap text-[12px] font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
            {cartItems.map((item, i) => (
              <div key={i} className="flex gap-4 p-4 bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50">
                <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-900 leading-tight">{item.name}</h4>
                      <p className="text-[11px] font-medium text-gray-500 mt-0.5">{item.variant}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[14px] font-bold text-[#33040D]">৳ {item.price * item.qty}</span>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1 border border-gray-200">
                      <button 
                        onClick={() => updateCartQty(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm hover:text-[#33040D]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[13px] font-bold w-4 text-center">{item.qty}</span>
                      <button 
                        onClick={() => updateCartQty(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-[#33040D] flex items-center justify-center text-white shadow-sm hover:bg-[#4a0614]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-[13px] font-medium text-gray-500">
                <span>Subtotal ({cartItems.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span className="font-bold text-gray-900">৳ {subtotal}</span>
              </div>
              {posSettings.vatEnabled && (
                <div className="flex justify-between items-center text-[13px] font-medium text-gray-500">
                  <span>Tax ({posSettings.vatPercentage}%)</span>
                  <span className="font-bold text-gray-900">৳ {tax}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[13px] font-medium text-green-600 relative group">
                <span className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5" /> Discount</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold">- ৳ </span>
                  <input 
                    type="number" 
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                    className="w-[60px] text-right font-bold bg-transparent border-b border-green-200 focus:border-green-600 outline-none"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[16px] font-bold text-gray-900">Total</span>
                <span className="text-[24px] font-black text-[#33040D]">৳ {total}</span>
              </div>
            </div>

            {/* Quick Customer Info (Phone) */}
            <div className="mb-4">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer Contact</label>
                {isCheckingMember ? (
                  <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking membership...
                  </span>
                ) : membershipStatus ? (
                  <span className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${membershipStatus.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'}`}>
                    <Crown className="w-3 h-3" /> {customerName} - {membershipStatus.tier} ({membershipStatus.discountPercent}% Off)
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <input 
                  type="tel"
                  maxLength={11}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter 11-digit Phone (e.g. 017...)"
                  className={`w-full px-4 py-3 bg-gray-50 border focus:ring-1 rounded-xl text-[13px] font-medium outline-none transition-all placeholder-gray-400 ${
                    membershipStatus ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500/20' : 'border-gray-200 focus:border-[#33040D] focus:ring-[#33040D]/20'
                  }`}
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setPaymentType('Cash'); setShowPaymentModal(true); }}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-[16px] bg-[#33040D] text-white hover:bg-[#4a0614] transition-all shadow-[0_8px_20px_rgba(51,4,13,0.25)] hover:shadow-[0_8px_25px_rgba(51,4,13,0.35)] hover:-translate-y-0.5"
              >
                <Banknote className="w-6 h-6" />
                <span className="font-bold text-[14px]">Cash</span>
              </button>
              <button 
                onClick={() => { setPaymentType('Card'); setShowPaymentModal(true); }}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-[16px] bg-white border border-gray-200 text-gray-700 hover:border-[#33040D] hover:text-[#33040D] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <CreditCard className="w-6 h-6" />
                <span className="font-bold text-[14px]">Card / MFS</span>
              </button>
            </div>
          </div>

        </RimalCard>
      </div>
    </div>

      {/* --- CUSTOMER CRM MODAL --- */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 w-full max-w-[400px] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowCustomerModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            <h2 className="text-[20px] font-bold text-gray-900 mb-6 flex items-center gap-2"><User className="w-5 h-5 text-[#33040D]" /> Customer Info</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-bold text-gray-700 block mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 01700000000" 
                  autoFocus
                  className="w-full px-4 py-3 rounded-[12px] bg-gray-50 border border-gray-200 focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] text-[14px] font-medium outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-[13px] font-bold text-gray-700 block mb-2">Customer Name</label>
                <input 
                  type="text" 
                  value={customerName === 'Walk-in Customer' ? '' : customerName}
                  onChange={(e) => setCustomerName(e.target.value || 'Walk-in Customer')}
                  placeholder="e.g. Mohimenol" 
                  className="w-full px-4 py-3 rounded-[12px] bg-gray-50 border border-gray-200 focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] text-[14px] font-medium outline-none transition-all" 
                />
              </div>

              {customerId && membershipTiers.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <label className="text-[13px] font-bold text-[#33040D] block mb-2">Request Membership Upgrade</label>
                  <div className="flex gap-2">
                    <select 
                      value={selectedTier}
                      onChange={(e) => setSelectedTier(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-[12px] bg-gray-50 border border-gray-200 focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] text-[14px] font-medium outline-none"
                    >
                      <option value="">Select Tier...</option>
                      {membershipTiers.map((tier, idx) => (
                        <option key={idx} value={tier.name}>{tier.name} ({tier.discount}% Off)</option>
                      ))}
                    </select>
                    <button 
                      onClick={async () => {
                        if (!selectedTier) return toast.error('Select a tier');
                        const tierData = membershipTiers.find(t => t.name === selectedTier);
                        if (!tierData) return;
                        
                        const res = await requestCustomerMembership(customerId, tierData.name, tierData.discount);
                        if (res.success) {
                          toast.success(res.message || 'Membership requested');
                          setSelectedTier('');
                          setMembershipStatus(prev => prev ? {...prev, pendingTier: tierData.name} : null);
                        } else {
                          toast.error(res.error || 'Failed to request membership');
                        }
                      }}
                      className="px-4 py-3 bg-orange-100 text-orange-600 font-bold rounded-[12px] hover:bg-orange-200"
                    >
                      Request
                    </button>
                  </div>
                  {membershipStatus?.pendingTier && (
                    <p className="text-[11px] font-medium text-orange-500 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending approval for: {membershipStatus.pendingTier}
                    </p>
                  )}
                </div>
              )}
              
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="w-full py-3.5 mt-4 bg-[#33040D] text-white rounded-[16px] font-bold text-[15px] shadow-[0_8px_20px_rgba(51,4,13,0.25)] hover:shadow-[0_8px_25px_rgba(51,4,13,0.35)] hover:-translate-y-0.5 transition-all flex items-center justify-center"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HELD ORDERS MODAL --- */}
      {showHeldOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 w-full max-w-[500px] shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
            <button onClick={() => setShowHeldOrdersModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            <h2 className="text-[20px] font-bold text-gray-900 mb-6 flex items-center gap-2"><PauseCircle className="w-5 h-5 text-orange-500" /> Held Orders ({heldOrders.length})</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {heldOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-10 font-medium">No held orders found.</p>
              ) : (
                heldOrders.map(order => (
                  <div key={order.id} className="p-4 border border-gray-100 rounded-[16px] bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-bold text-gray-900">{order.customerName}</span>
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-md">{order.time}</span>
                      </div>
                      <p className="text-[12px] text-gray-500 font-medium">{order.cartItems.length} items • ৳ {order.total}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setHeldOrders(prev => prev.filter(o => o.id !== order.id))}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleResumeOrder(order)}
                        className="px-4 py-2 bg-[#33040D] text-white text-[12px] font-bold rounded-lg hover:bg-[#4a0614] shadow-sm"
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 w-full max-w-[400px] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            <h2 className="text-[20px] font-bold text-gray-900 mb-6 flex items-center gap-2">
              {paymentType === 'Cash' ? <Banknote className="w-5 h-5 text-[#33040D]" /> : <CreditCard className="w-5 h-5 text-[#33040D]" />} 
              {paymentType === 'Cash' ? 'Cash Payment' : 'Digital Payment'}
            </h2>
            
            <div className="space-y-5">
              {paymentType === 'Cash' ? (
                <div>
                  <label className="text-[13px] font-bold text-gray-700 block mb-2">Cash Received (৳)</label>
                  <input type="number" placeholder="Amount given by customer" autoFocus className="w-full px-4 py-3 rounded-[12px] bg-gray-50 border border-gray-200 focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] text-[18px] font-bold outline-none transition-all" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[13px] font-bold text-gray-700 block mb-2">Payment Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Visa / MC', 'bKash', 'Nagad'].map(prov => (
                        <button 
                          key={prov} 
                          onClick={() => setPaymentProvider(prov)}
                          className={`py-2 rounded-lg text-[13px] font-bold border transition-all ${paymentProvider === prov ? 'bg-[#33040D] text-white border-[#33040D]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}
                        >
                          {prov}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-gray-700 block mb-2">Transaction ID / Last 4 Digits <span className="text-gray-400 font-medium">(Optional)</span></label>
                    <input type="text" placeholder="e.g. TRX987654 or 4242" autoFocus className="w-full px-4 py-3 rounded-[12px] bg-gray-50 border border-gray-200 focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] text-[14px] font-medium outline-none transition-all" />
                  </div>
                </>
              )}
              
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center mb-6">
                <span className="text-[14px] font-bold text-gray-600">Amount to Charge</span>
                <span className="text-[24px] font-black text-[#33040D]">৳ {total}</span>
              </div>
              <button 
                onClick={handleConfirmPayment}
                className="w-full py-3.5 bg-[#33040D] text-white rounded-[16px] font-bold text-[15px] shadow-[0_8px_20px_rgba(51,4,13,0.25)] hover:shadow-[0_8px_25px_rgba(51,4,13,0.35)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RECEIPT MODAL --- */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 print:relative print:inset-auto print:bg-transparent print:p-0 print:block">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 w-full max-w-[400px] shadow-2xl relative flex flex-col items-center animate-in fade-in zoom-in duration-200 print:shadow-none print:p-0 print:block">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 print:hidden">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-[22px] font-black text-gray-900 mb-1 print:hidden">Payment Successful</h2>
            <p className="text-[14px] text-gray-500 font-medium mb-6 print:hidden">Order #{completedInvoiceId} has been saved.</p>
            
            {/* Mock Thermal Receipt */}
            <style type="text/css" media="print">
              {`
                @page { size: portrait; margin: 0; }
                body { margin: 0; padding: 0; background: white; }
                .print-area { width: 80mm !important; max-width: 80mm !important; margin: 0 auto !important; padding: 0mm 5mm !important; border: none !important; box-shadow: none !important; page-break-inside: avoid !important; break-inside: avoid !important; overflow: hidden !important; }
              `}
            </style>
            <div className="print-area w-full bg-white p-6 rounded-lg font-mono text-[12px] font-bold text-black border border-black shadow-inner mb-6 print:mb-0 relative overflow-hidden">
              <div className="text-center mb-4 print:mb-2 border-b-2 border-dashed border-black pb-4 print:pb-2">
                <h3 className="text-[18px] font-black text-black font-sans tracking-widest uppercase">{posContext.outletName}</h3>
                <p>{posContext.outletLocation}</p>
                <p>Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                <p>Cashier: {posContext.cashierName}</p>
                {customerPhone && <p className="mt-1">Customer: {customerPhone}</p>}
              </div>
              <div className="space-y-2 border-b-2 border-dashed border-black pb-4 print:pb-2 mb-4 print:mb-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="truncate pr-4">{item.qty}x {item.name}</span>
                    <span>{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 border-b-2 border-dashed border-black pb-4 print:pb-2 mb-4 print:mb-2">
                <div className="flex justify-between text-black"><span>Subtotal</span><span>{subtotal}</span></div>
                {posSettings.vatEnabled && (
                  <div className="flex justify-between text-black"><span>Tax ({posSettings.vatPercentage}%)</span><span>{tax}</span></div>
                )}
                {discountValue > 0 && <div className="flex justify-between text-black"><span>Discount</span><span>-{discountValue}</span></div>}
                <div className="flex justify-between text-[16px] font-black text-black mt-2 pt-2 border-t-2 border-dashed border-black">
                  <span>TOTAL</span><span>৳ {total}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-black">
                  PAID VIA: {paymentType === 'Cash' ? 'CASH' : paymentType === 'MFS' ? paymentProvider.toUpperCase() : `CARD (${paymentProvider})`}
                </p>
                
                <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  {completedInvoiceId && (
                    <div className="flex justify-center mt-2 mb-2 w-full overflow-hidden">
                      <div className="scale-90 origin-center">
                        <Barcode 
                          value={completedInvoiceId} 
                          width={1.2} 
                          height={35} 
                          displayValue={true} 
                          fontSize={11} 
                          margin={5} 
                          background="transparent"
                          lineColor="#000"
                        />
                      </div>
                    </div>
                  )}
                  
                  <p className="text-[10px] mt-1 text-black font-bold">Thank you for shopping at Rimal!</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full print:hidden">
              <button 
                onClick={() => {
                  setShowReceiptModal(false);
                  setCartItems([]);
                  setCustomerPhone('');
                  setCustomerName('Walk-in Customer');
                  setDiscountValue(0);
                  setPaymentType('Cash');
                }} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-[14px] hover:bg-gray-200 transition-colors"
              >
                New Sale
              </button>
              <button onClick={() => window.print()} className="flex-1 py-3 bg-[#33040D] text-white rounded-xl font-bold text-[14px] shadow-lg hover:bg-[#4a0614] transition-colors flex items-center justify-center gap-2">
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return / Refund Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-[500px] shadow-2xl relative overflow-hidden animate-slide-up border border-gray-100">
            <button onClick={() => setShowReturnModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-[#d63031]/10 flex items-center justify-center">
                <Undo className="w-6 h-6 text-[#d63031]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">Process Return</h2>
                <p className="text-gray-500 font-medium mt-1">Search invoice to refund items</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={returnInvoiceId}
                  onChange={(e) => setReturnInvoiceId(e.target.value.toUpperCase())}
                  placeholder="Enter Invoice ID (e.g. INV-123456)"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-[15px] font-bold focus:border-[#33040D] focus:ring-0 outline-none transition-all"
                />
                <button
                  onClick={async () => {
                    if (!returnInvoiceId) {
                      toast.error('Enter invoice ID');
                      return;
                    }
                    setIsProcessingReturn(true);
                    const res = await getSaleByInvoice(returnInvoiceId);
                    setIsProcessingReturn(false);
                    if (res.success) {
                      setReturnSaleData(res.sale);
                    } else {
                      toast.error(res.error || 'Failed to fetch invoice');
                    }
                  }}
                  disabled={isProcessingReturn}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-[#33040D] text-white rounded-xl font-bold hover:bg-[#4a0614] transition-colors flex items-center"
                >
                  {isProcessingReturn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </div>

              {returnSaleData && (
                <div className="mt-6 border border-gray-100 rounded-2xl p-5 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-900">Invoice: {returnSaleData.invoiceId}</span>
                    <span className="text-sm font-bold px-3 py-1 bg-gray-200 text-gray-700 rounded-full">{returnSaleData.status}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto">
                    {returnSaleData.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-600">{item.quantity}x {item.name}</span>
                        <span className="text-gray-900">৳{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 flex justify-between items-center font-black">
                    <span>Total Refund</span>
                    <span className="text-[#d63031]">৳{returnSaleData.total}</span>
                  </div>

                  <button
                    onClick={async () => {
                      setIsProcessingReturn(true);
                      const res = await processReturn(returnSaleData.invoiceId);
                      setIsProcessingReturn(false);
                      if (res.success) {
                        toast.success('Return processed successfully!');
                        setReturnSaleData(null);
                        setReturnInvoiceId('');
                        setShowReturnModal(false);
                      } else {
                        toast.error(res.error || 'Failed to process return');
                      }
                    }}
                    disabled={returnSaleData.status === 'REFUNDED' || isProcessingReturn}
                    className={`w-full mt-6 py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all shadow-lg ${
                      returnSaleData.status === 'REFUNDED'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        : 'bg-[#d63031] text-white hover:bg-red-700'
                    }`}
                  >
                    {isProcessingReturn ? <Loader2 className="w-5 h-5 animate-spin" /> : <Undo className="w-5 h-5" />}
                    {returnSaleData.status === 'REFUNDED' ? 'Already Refunded' : 'Confirm Full Refund'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- END OF DAY MODAL --- */}
      {showEndOfDayModal && endOfDayReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 print:relative print:inset-auto print:bg-transparent print:p-0 print:block">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 w-full max-w-[400px] shadow-2xl relative flex flex-col items-center animate-in fade-in zoom-in duration-200 print:shadow-none print:p-0 print:block">
            <h2 className="text-[22px] font-black text-gray-900 mb-6 print:hidden">End of Day Z-Report</h2>
            
            <style type="text/css" media="print">
              {`
                @page { size: portrait; margin: 0; }
                body { margin: 0; padding: 0; background: white; }
                .print-area { width: 80mm !important; max-width: 80mm !important; margin: 0 auto !important; padding: 0mm 5mm !important; border: none !important; box-shadow: none !important; page-break-inside: avoid !important; break-inside: avoid !important; overflow: hidden !important; }
              `}
            </style>
            
            <div className="print-area w-full bg-white p-6 rounded-lg font-mono text-[12px] font-bold text-black border border-black shadow-inner mb-6 print:mb-0 relative overflow-hidden">
              <div className="text-center mb-4 border-b-2 border-dashed border-black pb-4">
                <h3 className="text-[18px] font-black text-black font-sans tracking-widest uppercase">{posContext.outletName}</h3>
                <p>{posContext.outletLocation}</p>
                <p>Z-REPORT</p>
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>Printed: {new Date().toLocaleTimeString()}</p>
              </div>
              
              <div className="space-y-2 border-b-2 border-dashed border-black pb-4 mb-4">
                <div className="flex justify-between"><span>Transactions:</span><span>{endOfDayReport.transactionsCount}</span></div>
                <div className="flex justify-between"><span>Refunds:</span><span>{endOfDayReport.refundsCount}</span></div>
                <div className="flex justify-between"><span>Total Discounts:</span><span>{endOfDayReport.totalDiscounts}</span></div>
              </div>
              
              <div className="space-y-1 border-b-2 border-dashed border-black pb-4 mb-4">
                <div className="flex justify-between"><span>Total Cash:</span><span>{endOfDayReport.totalCash}</span></div>
                <div className="flex justify-between"><span>Total Card:</span><span>{endOfDayReport.totalCard}</span></div>
                <div className="flex justify-between text-red-600"><span>Total Refunded:</span><span>-{endOfDayReport.totalRefunds}</span></div>
              </div>
              
              <div className="flex justify-between text-[16px] font-black text-black mt-2 pt-2 pb-4 border-t-2 border-dashed border-black">
                <span>NET TOTAL:</span><span>৳ {endOfDayReport.totalSales - endOfDayReport.totalRefunds}</span>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-[10px] text-black font-bold">End of Shift</p>
              </div>
            </div>

            <div className="flex gap-3 w-full print:hidden">
              <button 
                onClick={() => setShowEndOfDayModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-[14px] hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-[#33040D] text-white rounded-xl font-bold text-[14px] shadow-lg hover:bg-[#4a0614] transition-colors"
              >
                Print Report
              </button>
            </div>
            <button 
                onClick={async () => {
                  await logoutUser();
                  router.push('/auth/login');
                }}
                className="w-full mt-3 py-3 bg-red-100 text-red-600 rounded-xl font-bold text-[14px] hover:bg-red-200 transition-colors print:hidden"
              >
                End Shift & Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
