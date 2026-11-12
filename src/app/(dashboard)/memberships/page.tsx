'use client';

import React, { useEffect, useState } from 'react';
import RimalTopBar from '@/components/rimal-ui/RimalTopBar';
import { Crown, Plus, Trash2, CheckCircle2, Loader2, Star } from 'lucide-react';
import { getMembershipTiers, updateMembershipTiers } from '@/actions/memberships';
import { toast } from 'react-hot-toast';

export default function MembershipsPage() {
  const [membershipTiers, setMembershipTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const tiersRes = await getMembershipTiers();
      if (tiersRes) {
        setMembershipTiers(tiersRes);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const handleSaveMembershipTiers = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateMembershipTiers(membershipTiers);
    if (res.success) {
      toast.success(res.message || 'Successfully updated membership tiers');
    } else {
      toast.error(res.error || 'Failed to update membership tiers');
    }
    setIsSaving(false);
  };

  const handleAddTier = () => {
    setMembershipTiers([
      ...membershipTiers, 
      { name: '', discount: 0, isDefault: membershipTiers.length === 0 }
    ]);
  };

  const handleRemoveTier = (index: number) => {
    const wasDefault = membershipTiers[index]?.isDefault;
    const newTiers = [...membershipTiers];
    newTiers.splice(index, 1);
    if (wasDefault && newTiers.length > 0) {
      newTiers[0].isDefault = true;
    }
    setMembershipTiers(newTiers);
  };

  const handleSetDefault = (index: number) => {
    const newTiers = membershipTiers.map((t, i) => ({
      ...t,
      isDefault: i === index
    }));
    setMembershipTiers(newTiers);
  };

  const handleTierChange = (index: number, field: string, value: any) => {
    const newTiers = [...membershipTiers];
    newTiers[index][field] = value;
    setMembershipTiers(newTiers);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#33040D]" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] pb-24 font-sans animate-on-load">
      <RimalTopBar 
        title="Membership Tiers" 
        subtitle="Create dynamic membership plans and assign default discounts" 
        showSearch={false}
        emoji="👑"
      />

      <form onSubmit={handleSaveMembershipTiers} className="bg-white border border-gray-200 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden mt-8">
        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 mb-1">Manage Plans</h2>
            <p className="text-[13px] text-gray-500 font-medium">Add, remove or edit the membership tiers available in the POS.</p>
          </div>
          <button type="button" onClick={handleAddTier} className="px-5 py-2.5 bg-[#33040D] text-white rounded-xl font-bold text-[13px] hover:bg-[#4a0614] transition-all shadow-md flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add New Tier
          </button>
        </div>
        
        <div className="p-8 space-y-4">
          {membershipTiers.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
              <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-900 font-bold mb-1">No Tiers Found</h3>
              <p className="text-gray-500 text-sm">Click "Add New Tier" to create your first membership plan.</p>
            </div>
          ) : (
            membershipTiers.map((tier, index) => (
              <div key={index} className={`flex flex-col sm:flex-row sm:items-end gap-4 p-5 border rounded-xl transition-all group ${tier.isDefault ? 'border-amber-300 bg-amber-50/20 shadow-sm' : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm'}`}>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold text-gray-700">Tier Name</label>
                    {tier.isDefault && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 sm:hidden">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Default
                      </span>
                    )}
                  </div>
                  <input 
                    required 
                    type="text" 
                    value={tier.name} 
                    onChange={(e) => handleTierChange(index, 'name', e.target.value)} 
                    placeholder="e.g. Platinum" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-2 focus:ring-[#33040D]/20 text-[14px] font-bold text-gray-900 outline-none transition-all" 
                  />
                </div>
                <div className="w-full sm:w-36 space-y-2">
                  <label className="text-[12px] font-bold text-gray-700">Discount (%)</label>
                  <div className="relative">
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={tier.discount} 
                      onChange={(e) => handleTierChange(index, 'discount', Number(e.target.value))} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#33040D] focus:ring-2 focus:ring-[#33040D]/20 text-[14px] font-bold text-gray-900 outline-none transition-all" 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[14px]">%</div>
                  </div>
                </div>

                {/* Default Tier Selector */}
                <div className="w-full sm:w-auto space-y-2">
                  <label className="text-[12px] font-bold text-gray-700 hidden sm:block">Default Plan</label>
                  <div>
                    {tier.isDefault ? (
                      <div className="h-[48px] px-4 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 font-bold text-[13px] flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-600" /> Default Tier
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(index)}
                        className="h-[48px] w-full sm:w-auto px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 font-bold text-[13px] transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => handleRemoveTier(index)} 
                  className="p-3.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-xl transition-colors shrink-0 flex justify-center"
                  title="Delete Tier"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-[13px] text-gray-500 font-medium hidden sm:block">Please save your changes to apply them.</p>
          <button disabled={isSaving} type="submit" className="px-8 py-3 bg-[#33040D] text-white rounded-xl text-[14px] font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-70 disabled:hover:translate-y-0">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
            {isSaving ? 'Saving...' : 'Save Tiers'}
          </button>
        </div>
      </form>
    </div>
  );
}
