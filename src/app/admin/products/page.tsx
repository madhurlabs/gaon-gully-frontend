'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ name: '', description: '', retailPrice: '', wholesalePrice: '', stock: '', category: '', colors: '', sizes: '', isFeatured: false, isActive: true, minOrderQuantity: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { router.push('/'); return; }
    fetchProducts();
    api.get('/categories').then(r => setCategories(r.data.data));
  }, [search, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15', ...(search && { search }) });
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.retailPrice || !formData.category) {
      toast.error('Name, price, and category are required'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        retailPrice: Number(formData.retailPrice),
        wholesalePrice: Number(formData.wholesalePrice),
        stock: Number(formData.stock),
        colors: formData.colors ? formData.colors.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        sizes: formData.sizes ? formData.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        minOrderQuantity: Number(formData.minOrderQuantity) || 1,
      };
      if (editing) {
        await api.put(`/products/${editing._id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', description: '', retailPrice: '', wholesalePrice: '', stock: '', category: '', colors: '', sizes: '', isFeatured: false, isActive: true, minOrderQuantity: 1 });
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleEdit = (product: any) => {
    setEditing(product);
    setFormData({
      name: product.name, description: product.description,
      retailPrice: product.retailPrice, wholesalePrice: product.wholesalePrice,
      stock: product.stock, category: product.category?._id || product.category,
      colors: product.colors?.join(', '), sizes: product.sizes?.join(', '),
      isFeatured: product.isFeatured, isActive: product.isActive,
      minOrderQuantity: product.minOrderQuantity || 1,
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  const toggleFeatured = async (product: any) => {
    try {
      await api.put(`/products/${product._id}`, { isFeatured: !product.isFeatured });
      fetchProducts();
      toast.success(product.isFeatured ? 'Removed from featured' : 'Added to featured');
    } catch {}
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:ml-64 flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-500 text-sm">{pagination?.totalProducts || 0} total products</p>
          </div>
          <button onClick={() => { setEditing(null); setFormData({ name:'',description:'',retailPrice:'',wholesalePrice:'',stock:'',category:'',colors:'',sizes:'',isFeatured:false,isActive:true,minOrderQuantity:1 }); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {/* Product Form */}
        {showForm && (
          <div className="card p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-5">{editing ? 'Edit Product' : 'Add New Product'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="Product name" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field resize-none" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field">
                  <option value="">Select Category</option>
                  {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="input-field" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (₹) *</label>
                <input type="number" value={formData.retailPrice} onChange={e => setFormData({...formData, retailPrice: e.target.value})} className="input-field" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price (₹)</label>
                <input type="number" value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: e.target.value})} className="input-field" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colors (comma separated)</label>
                <input value={formData.colors} onChange={e => setFormData({...formData, colors: e.target.value})} className="input-field" placeholder="Red, Blue, Green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma separated)</label>
                <input value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} className="input-field" placeholder="S, M, L, XL" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Qty (Wholesale)</label>
                <input type="number" value={formData.minOrderQuantity} onChange={e => setFormData({...formData, minOrderQuantity: e.target.value})} className="input-field" min="1" />
              </div>
              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="rounded text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 flex-1">{saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}</button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary py-2.5 flex-1">Cancel</button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="card p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search products..."
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Product','Category','Retail Price','Wholesale Price','Stock','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-8 skeleton-pulse bg-gray-200 rounded" /></td></tr>
                  ))
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No products found</td></tr>
                ) : products.map((product: any) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.images?.[0]?.url ? <img src={product.images[0].url} alt="" className="w-full h-full object-cover" /> : <span className="text-lg flex items-center justify-center h-full">📦</span>}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm max-w-[180px] truncate">{product.name}</p>
                          {product.isFeatured && <span className="text-xs text-amber-600 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400" />Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{product.retailPrice?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">₹{product.wholesalePrice?.toLocaleString('en-IN') || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${product.stock === 0 ? 'text-red-600' : product.stock <= 10 ? 'text-orange-500' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(product)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => toggleFeatured(product)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg" title="Toggle Featured"><Star className={`w-4 h-4 ${product.isFeatured ? 'fill-amber-400' : ''}`} /></button>
                        <button onClick={() => handleDelete(product._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t flex justify-between items-center text-sm">
              <span className="text-gray-500">Page {pagination.currentPage} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
