'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, Search, Edit2, Trash2, Star, ArrowLeft, 
  Upload, X, ImageIcon, Package
} from 'lucide-react';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '', description: '', retailPrice: '', wholesalePrice: '',
    discountedRetailPrice: '', discountedWholesalePrice: '',
    stock: '', category: '', colors: '', sizes: '',
    isFeatured: false, isActive: true, minOrderQuantity: '1',
    brand: '', weight: '',
  });

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || user?.role !== 'admin') { router.push('/login'); return; }
    fetchProducts();
    api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {});
  }, [hydrated, isAuthenticated, user, search, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15', ...(search && { search }) });
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formDataObj = new FormData();
        formDataObj.append('image', file);
        const { data } = await api.post('/upload/image', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data.data;
      });
      const results = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...results]);
      toast.success(`${results.length} image(s) uploaded!`);
    } catch {
      toast.error('Image upload failed');
    } finally { setUploadingImages(false); }
  };

  const removeImage = async (index: number, publicId: string) => {
    try {
      await api.delete(`/upload/image/${publicId}`);
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
      toast.success('Image removed');
    } catch {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', retailPrice: '', wholesalePrice: '',
      discountedRetailPrice: '', discountedWholesalePrice: '',
      stock: '', category: '', colors: '', sizes: '',
      isFeatured: false, isActive: true, minOrderQuantity: '1',
      brand: '', weight: '',
    });
    setUploadedImages([]);
    setEditing(null);
  };

  const handleEdit = (product: any) => {
    setEditing(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      retailPrice: String(product.retailPrice || ''),
      wholesalePrice: String(product.wholesalePrice || ''),
      discountedRetailPrice: String(product.discountedRetailPrice || ''),
      discountedWholesalePrice: String(product.discountedWholesalePrice || ''),
      stock: String(product.stock || ''),
      category: product.category?._id || product.category || '',
      colors: product.colors?.join(', ') || '',
      sizes: product.sizes?.join(', ') || '',
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== false,
      minOrderQuantity: String(product.minOrderQuantity || '1'),
      brand: product.brand || '',
      weight: String(product.weight || ''),
    });
    setUploadedImages(product.images || []);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error('Product name required'); return; }
    if (!formData.retailPrice) { toast.error('Retail price required'); return; }
    if (!formData.category) { toast.error('Category required'); return; }
    if (!formData.stock) { toast.error('Stock required'); return; }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        retailPrice: Number(formData.retailPrice),
        wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : undefined,
        discountedRetailPrice: formData.discountedRetailPrice ? Number(formData.discountedRetailPrice) : undefined,
        discountedWholesalePrice: formData.discountedWholesalePrice ? Number(formData.discountedWholesalePrice) : undefined,
        stock: Number(formData.stock),
        category: formData.category,
        colors: formData.colors ? formData.colors.split(',').map(s => s.trim()).filter(Boolean) : [],
        sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        minOrderQuantity: Number(formData.minOrderQuantity) || 1,
        brand: formData.brand || undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        images: uploadedImages,
      };

      if (editing) {
        await api.put(`/products/${editing._id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      setShowForm(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
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

  if (!hydrated) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Products</h1>
            <p className="text-xs text-gray-500">{pagination?.totalProducts || 0} total</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Product Form */}
        {showForm && (
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                >
                  {uploadingImages ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Click to upload images</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 5MB each</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && handleImageUpload(e.target.files)}
                />
                {uploadedImages.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {uploadedImages.map((img: any, i: number) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i, img.publicId)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="Enter product name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field resize-none" rows={3} placeholder="Product description" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field">
                    <option value="">Select</option>
                    {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="input-field" min="0" placeholder="0" />
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Retail Price (₹) *</label>
                    <input type="number" value={formData.retailPrice} onChange={e => setFormData({...formData, retailPrice: e.target.value})} className="input-field" min="0" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Discounted Retail (₹)</label>
                    <input type="number" value={formData.discountedRetailPrice} onChange={e => setFormData({...formData, discountedRetailPrice: e.target.value})} className="input-field" min="0" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Wholesale Price (₹)</label>
                    <input type="number" value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: e.target.value})} className="input-field" min="0" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Discounted Wholesale (₹)</label>
                    <input type="number" value={formData.discountedWholesalePrice} onChange={e => setFormData({...formData, discountedWholesalePrice: e.target.value})} className="input-field" min="0" placeholder="0" />
                  </div>
                </div>
              </div>

              {/* Variants */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
                  <input value={formData.colors} onChange={e => setFormData({...formData, colors: e.target.value})} className="input-field" placeholder="Red, Blue, Green" />
                  <p className="text-xs text-gray-400 mt-1">Comma separated</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sizes</label>
                  <input value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} className="input-field" placeholder="S, M, L, XL" />
                  <p className="text-xs text-gray-400 mt-1">Comma separated</p>
                </div>
              </div>

              {/* Extra */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="input-field" placeholder="Brand name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Qty (Wholesale)</label>
                  <input type="number" value={formData.minOrderQuantity} onChange={e => setFormData({...formData, minOrderQuantity: e.target.value})} className="input-field" min="1" />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="rounded text-primary-600 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">Featured Product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded text-primary-600 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-3 text-base">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary flex-1 py-3">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="input-field pl-10"
          />
        </div>

        {/* Products List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="card h-20 skeleton-pulse bg-gray-200" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 card p-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No products found</p>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary mt-4 py-2 px-6">
              Add First Product
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product: any) => (
              <div key={product._id} className="card p-4 flex items-center gap-3">
                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category?.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-bold text-primary-700">₹{product.retailPrice?.toLocaleString('en-IN')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock === 0 ? 'bg-red-100 text-red-600' : product.stock <= 10 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      Stock: {product.stock}
                    </span>
                    {product.isFeatured && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Featured</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleEdit(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleFeatured(product)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg">
                    <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-amber-400' : ''}`} />
                  </button>
                  <button onClick={() => handleDelete(product._id, product.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination?.totalPages > 1 && (
          <div className="flex justify-between items-center mt-5">
            <span className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p-1)} disabled={page === 1} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={!pagination.hasNext} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
