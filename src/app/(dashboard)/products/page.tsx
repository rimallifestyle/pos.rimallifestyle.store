'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Plus, Filter, Download, Package, MoreHorizontal, Edit, Trash2, Loader2, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { getProductSummaries, deleteProduct } from '@/actions/products';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ProductsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    const res = await deleteProduct(productToDelete.id);
    setIsDeleting(false);
    
    if (res.success) {
      toast.success('Product deleted successfully');
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
    } else {
      toast.error(res.error || 'Failed to delete product');
    }
  };
  
  useEffect(() => {
    getProductSummaries().then(data => {
      setProducts(data);
      setIsLoading(false);
    });

    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    
    gsap.fromTo(
      elements,
      { y: 30, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        stagger: 0.05, 
        duration: 0.6, 
        ease: 'power3.out',
      }
    );
  }, []);

  return (
    <div ref={containerRef} className="max-w-[1600px] mx-auto pb-16 font-sans">
      <RimalTopBar 
        title="Product Catalog" 
        subtitle="Manage your inventory and variants" 
        emoji="📦" 
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 animate-on-load">
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] font-semibold text-gray-700 hover:border-gray-300 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] font-semibold text-gray-700 hover:border-gray-300 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
        
        <Link href="/products/add" className="px-6 py-2.5 bg-[#33040D] text-white rounded-full text-[13px] font-bold shadow-[0_8px_20px_rgba(51,4,13,0.25)] hover:shadow-[0_8px_25px_rgba(51,4,13,0.35)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <RimalCard className="animate-on-load !p-0" glass>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-5 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Product Info</th>
                <th className="py-5 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider">SKU</th>
                <th className="py-5 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="py-5 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                <th className="py-5 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Total Stock</th>
                <th className="py-5 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-5 px-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#33040D] mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading products...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium text-lg">No products found</p>
                    <Link href="/products/add" className="inline-block mt-4 text-[#33040D] font-bold hover:underline">Add your first product</Link>
                  </td>
                </tr>
              ) : products.map((product, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[12px] overflow-hidden bg-gray-100 shadow-sm border border-gray-200/50">
                        <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-gray-900 group-hover:text-[#33040D] transition-colors">{product.name}</p>
                        <p className="text-[12px] text-gray-500 font-medium">{product.variantCount} Variants</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[13px] font-mono text-gray-500 font-medium">{product.sku}</td>
                  <td className="py-4 px-6 text-[13px] font-medium text-gray-600">{product.category}</td>
                  <td className="py-4 px-6 text-[14px] font-bold text-gray-900">{product.price}</td>
                  <td className="py-4 px-6 text-[14px] font-bold text-gray-700">{product.stock} <span className="text-[11px] text-gray-400 font-medium ml-1">pcs</span></td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      product.status === 'Draft' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                      product.status === 'In Stock' ? 'bg-green-50 text-green-600 border border-green-100' :
                      product.status === 'Low Stock' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                      'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/products/edit/${product.id}`} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#33040D] hover:border-[#33040D] transition-colors shadow-sm">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button 
                        onClick={() => {
                          setProductToDelete({ id: product.id, name: product.name });
                          setShowDeleteModal(true);
                        }}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-colors shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="border-t border-gray-100 px-6 py-5 flex items-center justify-between">
          <p className="text-[13px] text-gray-500 font-medium">Showing {products.length} products</p>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">&lt;</button>
            <button className="w-8 h-8 rounded-full bg-[#33040D] text-white font-bold flex items-center justify-center shadow-md">1</button>
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 font-medium hover:bg-gray-50 transition-colors shadow-sm">2</button>
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 font-medium hover:bg-gray-50 transition-colors shadow-sm">3</button>
            <span className="w-8 h-8 flex items-center justify-center text-gray-400">...</span>
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">&gt;</button>
          </div>
        </div>
      </RimalCard>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-[400px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setShowDeleteModal(false);
                setProductToDelete(null);
              }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              
              <h2 className="text-[22px] font-black text-gray-900 mb-2">Delete Product?</h2>
              <p className="text-[14px] text-gray-500 font-medium mb-8">
                Are you sure you want to delete <strong className="text-gray-900">{productToDelete?.name}</strong>? This action cannot be undone and will also remove its inventory data.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-[16px] font-bold text-[14px] hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-500 text-white rounded-[16px] font-bold text-[14px] shadow-[0_8px_20px_rgba(239,68,68,0.25)] hover:bg-red-600 hover:shadow-[0_8px_25px_rgba(239,68,68,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
