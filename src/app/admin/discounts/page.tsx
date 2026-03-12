'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Tag } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminDiscountsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({ code: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', validUntil: '', isActive: true, applicableFor: 'all' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { router.push('/'); return; }
    api.get('/admin/coupons').then(r => setCoupons(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!formData.code || !formData.value) { toast.error('Code and value required'); return; }
    setSaving(true);
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        validUntil: formData.validUntil || undefined,
        isActive: formData.isActive,
        applicableFor: formData.applicableFor,
      };
      if (editing) {
        await api.put(`/admin/coupons/${editing._id}`, payload);
        toast.success('Coupon updated!');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Coupon created!');
      }
      setShowForm(false); setEditing(null);
      const res = await api.get('/admin/coupons');
      setCoupons(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:ml-64 flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Discount Coupons</h1>
          <button onClick={() => { setEditing(null); setFormData({ code:'',type:'percentage',value:'',minOrderAmount:'',maxDiscount:'',usageLimit:'',validUntil:'',isActive:true,applicableFor:'all' }); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-6 max-w-2xl">
            <h2 className="font-bold text-gray-900 mb-5">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="input-field font-mono" placeholder="SAVE20" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input-field">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value * ({formData.type === 'percentage' ? '%' : '₹'})</label>
                <input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Order Amount (₹)</label>
                <input type="number" value={formData.minOrderAmount} onChange={e => setFormData({...formData, minOrderAmount: e.target.value})} className="input-field" placeholder="0" />
              </div>
              {formData.type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Max Discount (₹)</label>
                  <input type="number" value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: e.target.value})} className="input-field" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Usage Limit</label>
                <input type="number" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value})} className="input-field" placeholder="Unlimited" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valid Until</label>
                <input type="datetime-local" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Applicable For</label>
                <select value={formData.applicableFor} onChange={e => setFormData({...formData, applicableFor: e.target.value})} className="input-field">
                  <option value="all">All Users</option>
                  <option value="retail">Retail Only</option>
                  <option value="wholesale">Wholesale Only</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded" />
                <label htmlFor="isActive" className="text-sm font-medium">Active</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 flex-1">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary py-2.5 flex-1">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? [...Array(4)].map((_,i) => <div key={i} className="card h-32 skeleton-pulse bg-gray-200" />)
          : coupons.map((coupon: any) => (
            <div key={coupon._id} className={`card p-5 border-2 ${coupon.isActive ? 'border-primary-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary-600" />
                  <span className="font-bold text-gray-900 font-mono">{coupon.code}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(coupon); setFormData({ code: coupon.code, type: coupon.type, value: String(coupon.value), minOrderAmount: String(coupon.minOrderAmount||''), maxDiscount: String(coupon.maxDiscount||''), usageLimit: String(coupon.usageLimit||''), validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0,16) : '', isActive: coupon.isActive, applicableFor: coupon.applicableFor }); setShowForm(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-primary-700">{coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`} OFF</p>
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                {coupon.minOrderAmount > 0 && <p>Min order: ₹{coupon.minOrderAmount}</p>}
                <p>Used: {coupon.usedCount || 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''} times</p>
                {coupon.validUntil && <p>Expires: {new Date(coupon.validUntil).toLocaleDateString('en-IN')}</p>}
                <span className={`badge ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{coupon.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
