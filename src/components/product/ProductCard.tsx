'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore, useWishlistStore, useCartStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  slug: string;
  images: { url: string; alt?: string }[];
  retailPrice: number;
  wholesalePrice?: number;
  discountedRetailPrice?: number;
  discountedWholesalePrice?: number;
  ratings: { average: number; count: number };
  stock: number;
  category?: { name: string };
}

export default function ProductCard({ product }: { product: Product }) {
  const { user, isAuthenticated } = useAuthStore();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { incrementCount } = useCartStore();
  const [addingToCart, setAddingToCart] = useState(false);

  const isWholesale = user?.role === 'wholesale';
  const price = isWholesale
    ? (product.discountedWholesalePrice || product.wholesalePrice || product.retailPrice)
    : (product.discountedRetailPrice || product.retailPrice);
  const originalPrice = isWholesale ? product.wholesalePrice : product.retailPrice;
  const hasDiscount = price < (originalPrice || 0);
  const discount = hasDiscount ? Math.round(((originalPrice! - price) / originalPrice!) * 100) : 0;
  const inWishlist = isInWishlist(product._id);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to add to wishlist'); return; }
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${product._id}`);
        toggleItem(product._id);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/wishlist/${product._id}`);
        toggleItem(product._id);
        toast.success('Added to wishlist');
      }
    } catch { toast.error('Something went wrong'); }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to add to cart'); return; }
    if (product.stock === 0) { toast.error('Product is out of stock'); return; }
    setAddingToCart(true);
    try {
      await api.post('/cart', { productId: product._id, quantity: 1 });
      incrementCount();
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="group card hover:shadow-md transition-all duration-200">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.images?.[0]?.url ? (
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📦</div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="badge bg-red-500 text-white">{discount}% OFF</span>
          )}
          {product.stock === 0 && (
            <span className="badge bg-gray-800 text-white">Out of Stock</span>
          )}
          {isWholesale && (
            <span className="badge bg-amber-500 text-white">Wholesale</span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            inWishlist ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100'
          } shadow-sm`}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>

        {/* Add to cart overlay */}
        {!isWholesale && product.stock > 0 && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        )}
      </div>

      <div className="p-3">
        {product.category && (
          <span className="text-xs text-gray-500 uppercase tracking-wide">{product.category.name}</span>
        )}
        <h3 className="text-sm font-medium text-gray-800 mt-1 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.ratings.count > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-gray-700">{product.ratings.average.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({product.ratings.count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-gray-900">₹{price.toLocaleString('en-IN')}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">₹{originalPrice!.toLocaleString('en-IN')}</span>
          )}
        </div>

        {/* Stock alert */}
        {product.stock > 0 && product.stock <= 10 && (
          <p className="text-xs text-red-500 mt-1">Only {product.stock} left!</p>
        )}
      </div>
    </Link>
  );
}
