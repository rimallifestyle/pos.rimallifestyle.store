'use client';

import React, { useState, useEffect } from 'react';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Plus, Search, Loader2, Edit, Trash2, X, Users, Crown, Percent } from 'lucide-react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/actions/customers';
import { approveCustomerMembership, rejectCustomerMembership, getMembershipTiers } from '@/actions/memberships';
import { toast } from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [membershipTiers, setMembershipTiers] = useState<any[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tier: 'Regular',
    discountPercent: 0,
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const [data, tiers] = await Promise.all([getCustomers(), getMembershipTiers()]);
    setCustomers(data);
    if (tiers) setMembershipTiers(tiers);
    setIsLoading(false);
  }

  const handleOpenModal = (customer: any = null) => {
    if (customer) {
      setEditingId(customer._id);
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        tier: customer.tier || 'Regular',
        discountPercent: customer.discountPercent || 0,
        isActive: customer.isActive !== false
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        tier: 'Regular',
        discountPercent: 0,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingId) {
      const res = await updateCustomer(editingId, formData);
      if (res.success) {
        toast.success('Customer updated successfully');
        loadData();
        setIsModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to update customer');
      }
    } else {
      const res = await createCustomer(formData);
      if (res.success) {
        toast.success('Customer added successfully');
        loadData();
        setIsModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to add customer');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    const res = await deleteCustomer(id);
    if (res.success) {
      toast.success('Customer deleted');
      loadData();
    } else {
      toast.error(res.error || 'Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const pendingApprovals = customers.filter(c => c.pendingTier);

  const handleApprove = async (id: string) => {
    const res = await approveCustomerMembership(id);
    if (res.success) {
      toast.success(res.message || 'Approved successfully');
      loadData();
    } else {
      toast.error(res.error || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    const res = await rejectCustomerMembership(id);
    if (res.success) {
      toast.success(res.message || 'Rejected successfully');
      loadData();
    } else {
      toast.error(res.error || 'Failed to reject');
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-16 font-sans">
      <RimalTopBar 
        title="Memberships & CRM" 
        subtitle="Manage customer memberships and store discounts" 
        emoji="👑"
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full md:w-[350px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-white border-0 rounded-xl text-sm shadow-[0_4px_15px_rgb(0,0,0,0.03)] focus:ring-2 focus:ring-[#33040D]/20 outline-none font-medium placeholder-gray-400"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-3 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_15px_rgba(51,4,13,0.2)] whitespace-nowrap w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add Member
        </button>
      </div>

      {pendingApprovals.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Pending Membership Approvals ({pendingApprovals.length})
          </h3>
          <RimalCard className="p-0 overflow-hidden border border-orange-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-orange-50/30">
                <thead>
                  <tr className="border-b border-orange-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">Requested Tier</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">Discount</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  {pendingApprovals.map(customer => (
                    <tr key={customer._id} className="hover:bg-orange-50/50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{customer.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-white border border-orange-200 text-orange-700 rounded-lg text-[12px] font-bold flex items-center gap-1.5 inline-flex">
                          <Crown className="w-3 h-3" /> {customer.pendingTier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">
                        {customer.pendingDiscount}% Off
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleReject(customer._id)} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50">Reject</button>
                          <button onClick={() => handleApprove(customer._id)} className="px-4 py-2 bg-[#33040D] text-white rounded-lg text-sm font-bold hover:bg-[#4a0614]">Approve</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RimalCard>
        </div>
      )}

      <RimalCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Customer Info</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Membership Tier</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Default Discount</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#33040D]" />
                    <p className="text-sm font-medium">Loading customers...</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1} />
                    <p className="text-sm font-medium">No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#33040D]/5 flex items-center justify-center text-[#33040D] font-bold text-sm shrink-0 border border-gray-100">
                          {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{customer.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{customer.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider ${
                        customer.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                        customer.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                        customer.tier === 'Silver' ? 'bg-gray-200 text-gray-700' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        <Crown className="w-3.5 h-3.5" /> {customer.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-green-600">
                        <Percent className="w-4 h-4" />
                        {customer.discountPercent}% Off
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">৳ {customer.totalSpent.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(customer)}
                          className="p-2 text-gray-400 hover:text-[#33040D] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </RimalCard>

      {/* Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-[16px] font-bold text-gray-900">
                {editingId ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 focus:border-[#33040D] outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  maxLength={11}
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 focus:border-[#33040D] outline-none"
                  placeholder="e.g. 01711223344"
                />
              </div>

              <div className="w-full">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Membership Tier (Auto Discount)</label>
                  <select 
                    value={formData.tier}
                    onChange={e => {
                      const selectedTier = e.target.value;
                      const tierData = membershipTiers.find(t => t.name === selectedTier);
                      setFormData({
                        ...formData, 
                        tier: selectedTier,
                        discountPercent: tierData ? tierData.discount : 0
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 outline-none bg-white"
                  >
                    {membershipTiers.length === 0 && <option value="Regular">Regular</option>}
                    {membershipTiers.map((tier, idx) => (
                      <option key={idx} value={tier.name}>{tier.name} ({tier.discount}% Off)</option>
                    ))}
                  </select>
              </div>
            </form>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#33040D]/20 transition-all flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {editingId ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
