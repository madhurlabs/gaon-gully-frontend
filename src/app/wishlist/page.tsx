'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import StoreLayout from '@/components/layout/StoreLayout';
import { useAuthStore, useWishlistStore, useCartStore } from '@/store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { setWishlist } = useWishlistStore();
  const { incrementCount } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get('/wishlist');
      setProducts(data.data.products || []);
      setWishlist(data.data.products?.map((p: any) => p._id) || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchWishlist();
  }, [isAuthenticated]);

  const removeFromWishlist = async (productId: string) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch { toast.error('Failed to remove'); }
  };

  const addToCart = async (product: any) => {
    try {
      await api.post('/cart', { productId: product._id, quantity: 1 });
      incrementCount();
      toast.success('Added to cart!');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <StoreLayout><div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div></StoreLayout>;

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" /> My Wishlist
          <span className="text-base font-normal text-gray-400">({products.length} items)</span>
        </h1>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-6">Save items you love for later</p>
            <Link href="/products" className="btn-primary">Explore Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <div key={product._id} className="card group hover:shadow-md transition-all">
                <Link href={`/products/${product.slug}`} className="relative aspect-square block overflow-hidden bg-gray-50">
                  {product.images?.[0]?.url ? (
                    <Image src={product.images[0].url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded">Out of Stock</span>
                    </div>
                  )}
                </Link>
                <div className="p-3">
                  <Link href={`/products/${product.slug}`} className="text-sm font-medium text-gray-800 hover:text-primary-600 line-clamp-2">{product.name}</Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-gray-900">₹{(product.discountedRetailPrice || product.retailPrice)?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <ShoppingCart className="w-3 h-3" /> Add to Cart
                    </button>
                    <button onClick={() => removeFromWishlist(product._id)} className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
