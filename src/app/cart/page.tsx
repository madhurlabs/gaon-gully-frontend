'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, Tag, ArrowRight } from 'lucide-react';
import StoreLayout from '@/components/layout/StoreLayout';
import { useAuthStore, useCartStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { setItemCount } = useCartStore();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const { data } = await api.get('/cart');
      setCart(data.data);
      setItemCount(data.data.pricing.itemCount);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, [isAuthenticated]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await api.put(`/cart/${itemId}`, { quantity });
      fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await api.delete(`/cart/${itemId}`);
      fetchCart();
      toast.success('Item removed');
    } catch { }
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/cart/coupon', { code: couponInput });
      toast.success(data.message);
      fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = async () => {
    try {
      await api.delete('/cart/coupon');
      setCouponInput('');
      fetchCart();
      toast.success('Coupon removed');
    } catch { }
  };

  if (!isAuthenticated) {
    return (
      <StoreLayout>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Please login to view your cart.</p>
          <Link href="/login" className="btn-primary">Login</Link>
        </div>
      </StoreLayout>
    );
  }

  if (loading) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </StoreLayout>
    );
  }

  const isWholesale = user?.role === 'wholesale';

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {!cart?.items?.length ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
            <Link href="/products" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item: any) => (
                <div key={item._id} className="card p-4 flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                    {item.product?.images?.[0]?.url ? (
                      <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.product?.slug}`} className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2 text-sm">
                      {item.product?.name}
                    </Link>
                    {(item.color || item.size) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.color && `Color: ${item.color}`} {item.size && `| Size: ${item.size}`}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">₹{item.itemTotal?.toLocaleString('en-IN')}</span>
                        <button onClick={() => removeItem(item._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="space-y-4">
              {/* Coupon */}
              {!isWholesale && (
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary-600" /> Apply Coupon
                  </h3>
                  {cart.couponCode ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-semibold text-green-700">{cart.couponCode}</p>
                        <p className="text-xs text-green-600">-₹{cart.pricing.discount?.toLocaleString('en-IN')} saved</p>
                      </div>
                      <button onClick={removeCoupon} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="input-field py-2 text-sm flex-1"
                      />
                      <button onClick={applyCoupon} disabled={couponLoading} className="btn-primary py-2 px-4 text-sm">
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.pricing.itemCount} items)</span>
                    <span>₹{cart.pricing.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  {cart.pricing.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount</span>
                      <span>-₹{cart.pricing.discount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className={cart.pricing.shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                      {cart.pricing.shippingCost === 0 ? 'FREE' : `₹${cart.pricing.shippingCost}`}
                    </span>
                  </div>
                  {cart.pricing.subtotal < 999 && (
                    <p className="text-xs text-gray-400">Add ₹{999 - cart.pricing.subtotal} more for free shipping</p>
                  )}
                  <hr className="border-gray-100" />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{cart.pricing.total?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {isWholesale ? (
                  <div className="mt-4 space-y-2">
                    <a
                      href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=I'd like to place a wholesale order. Total: ₹${cart.pricing.total}`}
                      target="_blank"
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      📱 Order via WhatsApp
                    </a>
                    <Link href="/cart/wholesale-checkout" className="btn-secondary w-full justify-center flex">
                      Chat with Seller
                    </Link>
                  </div>
                ) : (
                  <Link href="/checkout" className="btn-primary w-full justify-center flex items-center gap-2 mt-4">
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
