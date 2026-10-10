'use client';

import React, { useState, useEffect } from 'react';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import RimalCard from '@/components/rimal-ui/RimalCard';
import { Plus, Users, Search, Loader2, Edit, Trash2, X, Shield, MapPin, KeyRound } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '@/actions/users';
import { getOutlets } from '@/actions/outlets';
import { toast } from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    pin: '',
    role: 'CASHIER',
    outletId: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const [usersData, outletsData] = await Promise.all([
      getUsers(),
      getOutlets()
    ]);
    setUsers(usersData);
    setOutlets(outletsData);
    setIsLoading(false);
  }

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingId(user._id);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '', // Empty password for security
        pin: user.pin || '',
        role: user.role || 'CASHIER',
        outletId: user.outletId?._id || '',
        isActive: user.isActive
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        pin: '',
        role: 'CASHIER',
        outletId: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Process payload
    const payload = { ...formData };
    if (!payload.password) delete (payload as any).password; // Don't send empty password on update
    if (payload.outletId === '') (payload as any).outletId = null;

    if (editingId) {
      const res = await updateUser(editingId, payload);
      if (res.success) {
        toast.success('User updated successfully');
        loadData();
        setIsModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to update user');
      }
    } else {
      // Create validation
      if (!payload.password && payload.role !== 'CASHIER') {
        toast.error('Password is required for Admin and Manager roles');
        setIsSubmitting(false);
        return;
      }
      
      const res = await createUser(payload);
      if (res.success) {
        toast.success('User added successfully');
        loadData();
        setIsModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to create user');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await deleteUser(id);
    if (res.success) {
      toast.success('User deleted');
      loadData();
    } else {
      toast.error(res.error || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-16 font-sans">
      <RimalTopBar 
        title="Team Members" 
        subtitle="Manage cashiers, managers, and admin access" 
        emoji="👥"
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full md:w-[350px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-white border-0 rounded-xl text-sm shadow-[0_4px_15px_rgb(0,0,0,0.03)] focus:ring-2 focus:ring-[#33040D]/20 outline-none font-medium placeholder-gray-400"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-3 bg-[#33040D] hover:bg-[#4a0614] text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_15px_rgba(51,4,13,0.2)] whitespace-nowrap w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add Team Member
        </button>
      </div>

      <RimalCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role & PIN</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Outlet</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#33040D]" />
                    <p className="text-sm font-medium">Loading team...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1} />
                    <p className="text-sm font-medium">No team members found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#33040D] font-bold text-sm shrink-0 border border-gray-200">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex w-fit items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          <Shield className="w-3 h-3" /> {user.role}
                        </span>
                        {user.pin && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                            <KeyRound className="w-3 h-3" /> PIN: <span className="font-mono tracking-widest text-gray-900">{user.pin}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.outletId ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {user.outletId.name}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">All Outlets</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-gray-400 hover:text-[#33040D] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user._id)}
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

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-[16px] font-bold text-gray-900">
                {editingId ? 'Edit Team Member' : 'Add New Team Member'}
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 focus:border-[#33040D] outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 focus:border-[#33040D] outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 focus:border-[#33040D] outline-none"
                    placeholder="e.g. +8801700000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 outline-none bg-white"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="CASHIER">Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                  <select 
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 outline-none bg-white"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assign Outlet</label>
                <select 
                  value={formData.outletId}
                  onChange={e => setFormData({...formData, outletId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 outline-none bg-white"
                >
                  <option value="">-- All Outlets (Global) --</option>
                  {outlets.map(out => (
                    <option key={out._id} value={out._id}>{out.name} ({out.location})</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">If empty, user can access all outlets.</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Password {editingId && <span className="text-gray-400 normal-case font-normal">(Leave empty to keep)</span>}
                    </label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 outline-none"
                      placeholder="••••••••"
                      required={!editingId && formData.role !== 'CASHIER'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">POS PIN (Optional)</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={formData.pin}
                      onChange={e => setFormData({...formData, pin: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#33040D]/20 outline-none font-mono"
                      placeholder="e.g. 1234"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">PIN is used for quick login on the POS terminal.</p>
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
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {editingId ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
