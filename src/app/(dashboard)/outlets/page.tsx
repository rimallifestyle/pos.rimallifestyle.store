'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Store, MapPin, Users, Banknote, TrendingUp, MoreVertical, Plus, Loader2, X, Edit, Trash2 } from 'lucide-react';
import { getOutlets, createOutlet, updateOutlet, deleteOutlet } from '@/actions/outlets';
import { toast } from 'react-hot-toast';

const COLORS = [
  'from-[#33040D] to-[#5a0a1a]', 
  'from-blue-900 to-blue-700', 
  'from-orange-700 to-orange-500',
  'from-emerald-700 to-emerald-500',
  'from-purple-900 to-purple-700'
];

export default function OutletsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const loadOutlets = async () => {
    setIsLoading(true);
    const data = await getOutlets();
    setOutlets(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOutlets();
  }, []);

  useEffect(() => {
    if (!containerRef.current || isLoading) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    gsap.fromTo(elements, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: 'power3.out' });
  }, [isLoading]);

  const handleOpenModal = (mode: 'add' | 'edit', outlet: any = null) => {
    setModalMode(mode);
    setSelectedOutlet(outlet);
    setIsModalOpen(true);
  };

  const handleSaveOutlet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      contactNumber: formData.get('contactNumber') as string,
    };
    
    let res;
    if (modalMode === 'add') {
      res = await createOutlet(data);
    } else {
      res = await updateOutlet(selectedOutlet._id, data);
    }
    
    if (res.success) {
      toast.success(`Outlet ${modalMode === 'add' ? 'created' : 'updated'} successfully!`);
      setIsModalOpen(false);
      loadOutlets();
    } else {
      toast.error(res.error || 'Failed to save outlet');
    }
    setIsSaving(false);
  };

  const handleDeleteOutlet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outlet?')) return;
    const res = await deleteOutlet(id);
    if (res.success) {
      toast.success('Outlet deleted successfully!');
      loadOutlets();
    } else {
      toast.error('Failed to delete outlet');
    }
  };

  return (
    <div ref={containerRef} className="max-w-[1600px] mx-auto pb-16 font-sans">
      <RimalTopBar 
        title="Outlet Management" 
        subtitle="Monitor performance across all locations" 
        emoji="🏪" 
        actionButtons={
          <button 
            onClick={() => handleOpenModal('add')}
            className="px-5 py-2.5 bg-[#33040D] text-white rounded-full text-[13px] font-bold shadow-md hover:bg-black transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Outlet
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#33040D]" />
        </div>
      ) : outlets.length === 0 ? (
        <div className="text-center py-20 animate-on-load">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="text-[18px] font-bold text-gray-900">No outlets found</h3>
          <p className="text-[13px] text-gray-500 mt-1 mb-4">You haven't added any outlets yet.</p>
          <button 
            onClick={() => handleOpenModal('add')}
            className="px-6 py-2.5 bg-[#33040D] text-white rounded-full text-[13px] font-bold shadow-md hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Your First Outlet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {outlets.map((outlet, idx) => {
            const color = COLORS[idx % COLORS.length];
            return (
              <RimalCard key={outlet._id} className="animate-on-load group hover:-translate-y-1 transition-all !p-0 overflow-hidden relative">
                {/* Top color banner */}
                <div className={`h-24 bg-gradient-to-r ${color} p-6 flex justify-between items-start`}>
                  <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                    ID: {outlet._id.slice(-6).toUpperCase()}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal('edit', outlet)} className="text-white/70 hover:text-white transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteOutlet(outlet._id)} className="text-white/70 hover:text-red-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Outlet Info */}
                <div className="px-6 relative -mt-8 mb-6">
                  <div className="w-16 h-16 rounded-[16px] bg-white shadow-lg flex items-center justify-center border-4 border-white mb-3">
                    <Store className={`w-7 h-7 ${color.split(' ')[0].replace('from-', 'text-')}`} />
                  </div>
                  <h3 className="text-[20px] font-bold text-gray-900 leading-none mb-2">{outlet.name}</h3>
                  <div className="flex items-center gap-1.5 text-gray-500 text-[13px] font-medium">
                    <MapPin className="w-3.5 h-3.5" /> {outlet.location}
                  </div>
                  {outlet.contactNumber && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-[13px] font-medium mt-1">
                      <Users className="w-3.5 h-3.5" /> {outlet.contactNumber}
                    </div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="px-6 pb-6 space-y-4">
                  <div className="bg-gray-50 rounded-[16px] p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-700">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Today's Sales</p>
                        <p className="text-[16px] font-black text-gray-900">৳ 0</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="flex items-center gap-1 text-[12px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                        <TrendingUp className="w-3 h-3" /> 0%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-100 rounded-[16px] p-4">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Stock</p>
                      <p className="text-[15px] font-bold text-gray-900">0 <span className="text-[11px] text-gray-400 font-medium">pcs</span></p>
                    </div>
                    <div className="border border-gray-100 rounded-[16px] p-4">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                      <p className={`text-[13px] font-bold ${outlet.isActive ? 'text-green-600' : 'text-red-500'}`}>
                        {outlet.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-6">
                  <button className="w-full py-3 rounded-full bg-gray-900 text-white text-[13px] font-bold shadow-md hover:bg-black transition-colors">
                    Manage Inventory
                  </button>
                </div>
              </RimalCard>
            );
          })}
        </div>
      )}

      {/* Add/Edit Outlet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-[#33040D]" /> 
                {modalMode === 'add' ? 'Add New Outlet' : 'Edit Outlet'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSaveOutlet} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Outlet Name</label>
                <input required name="name" defaultValue={selectedOutlet?.name || ''} type="text" placeholder="e.g. Rimal Uttara" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] transition-all bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Location</label>
                <input required name="location" defaultValue={selectedOutlet?.location || ''} type="text" placeholder="e.g. Sector 11, Uttara" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] transition-all bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Contact Number</label>
                <input name="contactNumber" defaultValue={selectedOutlet?.contactNumber || ''} type="text" placeholder="+880 17..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#33040D] focus:ring-1 focus:ring-[#33040D] transition-all bg-gray-50 focus:bg-white" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-[13px] font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#33040D] text-white rounded-xl text-[13px] font-bold shadow-lg shadow-[#33040D]/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSaving ? 'Saving...' : (modalMode === 'add' ? 'Create Outlet' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
