'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { router.push('/'); return; }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data);
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing._id}`, formData);
        toast.success('Category updated!');
      } else {
        await api.post('/categories', formData);
        toast.success('Category created!');
      }
      setShowForm(false); setEditing(null);
      setFormData({ name: '', description: '', isActive: true });
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:ml-64 flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <button onClick={() => { setEditing(null); setFormData({ name:'', description:'', isActive: true }); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-6 max-w-lg">
            <h2 className="font-bold text-gray-900 mb-4">{editing ? 'Edit Category' : 'New Category'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="Category name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field resize-none" rows={2} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded" />
                <span className="text-sm font-medium">Active</span>
              </label>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 flex-1">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary py-2.5 flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? [...Array(6)].map((_,i) => <div key={i} className="card h-24 skeleton-pulse bg-gray-200" />)
          : categories.map((cat: any) => (
            <div key={cat._id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{cat.name}</p>
                {cat.description && <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>}
                <span className={`badge text-xs mt-1 ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(cat); setFormData({ name: cat.name, description: cat.description || '', isActive: cat.isActive }); setShowForm(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(cat._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
