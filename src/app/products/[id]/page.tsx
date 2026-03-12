'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart, Heart, Star, Truck, Shield, RotateCcw,
  MessageCircle, Share2, ChevronRight, Minus, Plus, CheckCircle
} from 'lucide-react';
import StoreLayout from '@/components/layout/StoreLayout';
import { useAuthStore, useCartStore, useWishlistStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { incrementCount } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const isWholesale = user?.role === 'wholesale';
  const inWishlist = product ? isInWishlist(product._id) : false;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [prodRes, revRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/product/${id}?limit=10`),
        ]);
        setProduct(prodRes.data.data);
        setReviews(revRes.data.data.reviews);
        if (prodRes.data.data.colors?.[0]) setSelectedColor(prodRes.data.data.colors[0]);
        if (prodRes.data.data.sizes?.[0]) setSelectedSize(prodRes.data.data.sizes[0]);
      } catch {
        toast.error('Product not found');
        router.push('/products');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const price = product
    ? (isWholesale
        ? (product.discountedWholesalePrice || product.wholesalePrice)
        : (product.discountedRetailPrice || product.retailPrice))
    : 0;

  const originalPrice = product
    ? (isWholesale ? product.wholesalePrice : product.retailPrice)
    : 0;

  const hasDiscount = price < originalPrice;
  const discount = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login to add to cart'); return; }
    if (product.stock === 0) { toast.error('Out of stock'); return; }
    setAddingToCart(true);
    try {
      const selectedVariant = product.variants?.find(
        (v: any) => v.color === selectedColor && v.size === selectedSize
      );
      await api.post('/cart', {
        productId: product._id,
        quantity,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
        sku: selectedVariant?.sku,
      });
      incrementCount();
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); return; }
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

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push('/checkout');
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square skeleton-pulse bg-gray-200 rounded-2xl" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`h-6 skeleton-pulse bg-gray-200 rounded w-${i % 2 === 0 ? 'full' : '3/4'}`} />
              ))}
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) return null;

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-primary-600">Products</Link>
          <ChevronRight className="w-3 h-3" />
          {product.category && (
            <>
              <Link href={`/products?category=${product.category._id}`} className="hover:text-primary-600">{product.category.name}</Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4">
              {product.images?.[selectedImage]?.url ? (
                <Image
                  src={product.images[selectedImage].url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">📦</div>
              )}
              {hasDiscount && (
                <div className="absolute top-4 left-4 badge bg-red-500 text-white text-sm px-3 py-1">
                  {discount}% OFF
                </div>
              )}
              {isWholesale && (
                <div className="absolute top-4 right-4 badge bg-amber-500 text-white text-sm px-3 py-1">
                  Wholesale Price
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      selectedImage === i ? 'border-primary-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image src={img.url} alt={`View ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-5">
            {product.category && (
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-widest">{product.category.name}</span>
            )}

            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>

            {/* Ratings */}
            {product.ratings.count > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= product.ratings.average ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">{product.ratings.average.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({product.ratings.count} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-gray-900">₹{price.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                  <span className="badge bg-red-100 text-red-700">Save {discount}%</span>
                </>
              )}
            </div>

            {isWholesale && product.minOrderQuantity > 1 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-amber-800">Minimum Order: {product.minOrderQuantity} units</p>
              </div>
            )}

            {/* Bulk pricing tiers */}
            {isWholesale && product.bulkPricingTiers?.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Bulk Pricing</div>
                {product.bulkPricingTiers.map((tier: any, i: number) => (
                  <div key={i} className="flex justify-between px-4 py-2 text-sm border-t border-gray-100">
                    <span className="text-gray-600">{tier.minQuantity}–{tier.maxQuantity || '+'} units</span>
                    <span className="font-semibold text-primary-700">₹{tier.pricePerUnit}/unit</span>
                  </div>
                ))}
              </div>
            )}

            {/* Color selection */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Color: <span className="font-normal text-gray-600">{selectedColor}</span></p>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-1.5 rounded-lg text-sm border-2 transition-all ${
                        selectedColor === color
                          ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            {product.sizes?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Size: <span className="font-normal text-gray-600">{selectedSize}</span></p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-lg text-sm border-2 font-medium transition-all ${
                        selectedSize === size
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(product.minOrderQuantity || 1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-10 text-center text-sm font-bold border-x border-gray-200 focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className={`text-sm ${product.stock <= 10 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                  {product.stock === 0 ? 'Out of stock' : product.stock <= 10 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            {isWholesale ? (
              <div className="flex flex-col gap-3">
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=I'm interested in ordering ${quantity} units of "${product.name}" (${selectedColor ? `Color: ${selectedColor}` : ''} ${selectedSize ? `Size: ${selectedSize}` : ''}). Total: ₹${(price * quantity).toLocaleString('en-IN')}`}
                  target="_blank"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Order via WhatsApp
                </a>
                <button className="btn-outline w-full flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat with Seller
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock === 0}
                  className="flex-1 btn-outline flex items-center justify-center gap-2 py-3"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
                >
                  Buy Now
                </button>
              </div>
            )}

            <button
              onClick={handleWishlist}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                inWishlist ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
              {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
              {[
                { icon: Truck, title: 'Free Shipping', desc: 'On orders ₹999+' },
                { icon: Shield, title: 'Secure Payment', desc: '100% protected' },
                { icon: RotateCcw, title: 'Easy Returns', desc: '7-day policy' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center text-center gap-1">
                  <Icon className="w-5 h-5 text-primary-600" />
                  <p className="text-xs font-semibold text-gray-700">{title}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: Description / Reviews */}
        <div className="mt-12">
          <div className="flex border-b border-gray-200 gap-6">
            {['description', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab} {tab === 'reviews' && `(${product.ratings.count})`}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === 'description' ? (
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                <p>{product.description}</p>
                {product.brand && <p className="mt-4"><strong>Brand:</strong> {product.brand}</p>}
                {product.weight && <p><strong>Weight:</strong> {product.weight}g</p>}
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review: any) => (
                    <div key={review._id} className="border-b border-gray-100 pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-bold text-sm">{review.user?.name?.[0]}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{review.user?.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.isVerifiedPurchase && (
                          <span className="badge bg-green-100 text-green-700 text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Verified Purchase
                          </span>
                        )}
                      </div>
                      {review.title && <p className="font-semibold text-gray-800 mt-3">{review.title}</p>}
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
