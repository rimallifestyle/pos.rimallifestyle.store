'use client';

import React, { useState, useEffect } from 'react';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Search, FileText, CheckCircle2, Clock, Calendar, Hash, Banknote, CreditCard, ChevronDown, ChevronUp, Store } from 'lucide-react';
import { getSales } from '@/actions/sales';
import { format } from 'date-fns';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSales() {
      const data = await getSales();
      setSales(data);
      setIsLoading(false);
    }
    fetchSales();
  }, []);

  const filteredSales = sales.filter(s => 
    s.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customerPhone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full pb-24 font-sans animate-on-load">
      <RimalTopBar 
        title="Sales History" 
        subtitle="View and manage all POS transactions" 
        showSearch={false}
        emoji="🧾"
      />

      <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 focus:border-[#33040D] outline-none shadow-sm transition-all bg-white"
            placeholder="Search by Invoice ID, Customer Name or Phone..."
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <RimalCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Invoice & Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Outlet</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#33040D] rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-sm font-medium">Loading sales history...</p>
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1} />
                      <p className="text-sm font-medium">No sales records found</p>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <React.Fragment key={sale._id}>
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#33040D] flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />{sale.invoiceId}</span>
                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mt-1"><Calendar className="w-3 h-3" />{format(new Date(sale.createdAt), 'MMM dd, yyyy - hh:mm a')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{sale.customerName || 'Walk-in Customer'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{sale.customerPhone || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md w-fit">
                              <Store className="w-3.5 h-3.5 text-gray-500" />
                              {sale.outletId?.name || 'Mirpur'}
                            </span>
                            {sale.outletId?.location && (
                              <span className="text-[11px] font-medium text-gray-500 mt-1 pl-1">
                                📍 {sale.outletId.location}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider ${sale.paymentMethod === 'CASH' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                            {sale.paymentMethod === 'CASH' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">৳ {sale.total.toLocaleString()}</span>
                            {sale.discount > 0 && <span className="text-[11px] font-medium text-green-600 mt-0.5">- ৳ {sale.discount} Discount</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider ${
                            sale.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            sale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {sale.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : sale.status === 'PENDING' ? <Clock className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => toggleExpand(sale._id)}
                            className="p-2 text-gray-400 hover:text-[#33040D] hover:bg-gray-100 rounded-lg transition-colors inline-flex cursor-pointer"
                          >
                            {expandedId === sale._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {expandedId === sale._id && (
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <td colSpan={7} className="px-6 py-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm max-w-3xl">
                              <h4 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <FileText className="w-4 h-4 text-gray-400" /> Order Items
                              </h4>
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="border-b border-gray-100">
                                    <th className="pb-2 text-[12px] font-medium text-gray-500">Product</th>
                                    <th className="pb-2 text-[12px] font-medium text-gray-500 text-center">Qty</th>
                                    <th className="pb-2 text-[12px] font-medium text-gray-500 text-right">Price</th>
                                    <th className="pb-2 text-[12px] font-medium text-gray-500 text-right">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {sale.items.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                      <td className="py-2.5">
                                        <p className="text-[13px] font-bold text-gray-900">{item.productId?.title || 'Unknown Product'}</p>
                                        {item.productId && <p className="text-[11px] text-gray-500">SKU: {item.productId.sku || 'N/A'}</p>}
                                      </td>
                                      <td className="py-2.5 text-center text-[13px] font-bold text-gray-700">{item.quantity}</td>
                                      <td className="py-2.5 text-right text-[13px] font-bold text-gray-700">৳ {item.priceAtSale.toLocaleString()}</td>
                                      <td className="py-2.5 text-right text-[13px] font-bold text-[#33040D]">৳ {(item.quantity * item.priceAtSale).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </RimalCard>
      </div>

      {/* Mobile Card-Based Transaction View */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#33040D] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-medium text-gray-500">Loading sales history...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1} />
            <p className="text-sm font-medium text-gray-500">No sales records found</p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div key={sale._id} className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm transition-all">
              {/* Header: Invoice ID, Status */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#33040D]/5 text-[#33040D] flex items-center justify-center font-bold text-xs">
                    #
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#33040D]">{sale.invoiceId}</h3>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {format(new Date(sale.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${
                  sale.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  sale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {sale.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : sale.status === 'PENDING' ? <Clock className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  {sale.status}
                </span>
              </div>

              {/* Customer & Outlet details */}
              <div className="py-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Customer</p>
                  <p className="font-bold text-gray-900 mt-0.5 truncate">{sale.customerName || 'Walk-in'}</p>
                  <p className="text-[11px] text-gray-500 truncate">{sale.customerPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Outlet</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mt-0.5">
                    <Store className="w-3 h-3 text-gray-500" />
                    {sale.outletId?.name || 'Mirpur'}
                  </span>
                </div>
              </div>

              {/* Total & Payment Method */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                    sale.paymentMethod === 'CASH' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {sale.paymentMethod === 'CASH' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                    {sale.paymentMethod}
                  </span>
                  {sale.discount > 0 && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      -৳{sale.discount}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block font-medium">Total</span>
                  <span className="text-base font-black text-gray-900">৳ {sale.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Accordion Toggle for Items */}
              <button 
                type="button"
                onClick={() => toggleExpand(sale._id)}
                className="w-full mt-3 pt-2.5 border-t border-gray-100 text-xs font-bold text-[#33040D] flex items-center justify-center gap-1.5 hover:bg-gray-50 rounded-lg py-1.5 transition-colors cursor-pointer"
              >
                <span>{expandedId === sale._id ? 'Hide Items' : `View ${sale.items?.length || 0} Items`}</span>
                {expandedId === sale._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Mobile Expanded Items */}
              {expandedId === sale._id && (
                <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100 animate-in fade-in duration-200">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Items Breakdown</p>
                  {sale.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-200/60 last:border-0 text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-gray-900 truncate">{item.productId?.title || 'Unknown Product'}</p>
                        <p className="text-[10px] text-gray-500">Qty: {item.quantity} × ৳{item.priceAtSale.toLocaleString()}</p>
                      </div>
                      <span className="font-black text-[#33040D] shrink-0">
                        ৳ {(item.quantity * item.priceAtSale).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
