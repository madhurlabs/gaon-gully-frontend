'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import StoreLayout from '@/components/layout/StoreLayout';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    api.get('/cart').then(r => { setCart(r.data.data); setLoading(false); });
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedAddress && !user?.addresses?.length) {
      toast.error('Please add a delivery address'); return;
    }
    const addr = selectedAddress || user?.addresses?.find((a: any) => a.isDefault) || user?.addresses?.[0];
    if (!addr) { toast.error('Please add a delivery address'); return; }

    setPlacing(true);
    try {
      const items = cart.items.map((item: any) => ({
        product: item.product._id,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        sku: item.sku,
      }));
      const orderRes = await api.post('/orders', {
        items,
        shippingAddress: addr,
        paymentMethod: 'razorpay',
        couponCode: cart.couponCode,
      });
      const order = orderRes.data.data;

      // Load Razorpay
      const keyRes = await api.get('/payments/key');
      const { data: razorpayOrder } = await api.post('/payments/create-order', { orderId: order._id });

      const options = {
        key: keyRes.data.data.key,
        amount: razorpayOrder.data.amount,
        currency: 'INR',
        name: 'Gaon Gully',
        description: `Order ${order.orderId}`,
        order_id: razorpayOrder.data.razorpayOrderId,
        handler: async (response: any) => {
          await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: order._id,
          });
          toast.success('Payment successful! Order placed.');
          router.push(`/orders/${order._id}`);
        },
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: '#16a34a' },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <StoreLayout><div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div></StoreLayout>;

  return (
    <StoreLayout>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Delivery Address */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Delivery Address</h2>
            {user?.addresses?.length ? (
              <div className="space-y-3">
                {user.addresses.map((addr: any) => (
                  <label key={addr._id} className={`flex gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${selectedAddress?._id === addr._id || (!selectedAddress && addr.isDefault) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                    <input type="radio" name="address" checked={selectedAddress?._id === addr._id || (!selectedAddress && addr.isDefault)} onChange={() => setSelectedAddress(addr)} className="mt-1" />
                    <div className="text-sm">
                      <p className="font-semibold">{addr.fullName}</p>
                      <p className="text-gray-600">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-gray-500">{addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-3">No saved addresses</p>
                <Link href="/profile" className="btn-primary text-sm py-2">Add Address</Link>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm mb-6">
              {cart?.items?.map((item: any) => (
                <div key={item._id} className="flex justify-between">
                  <span className="text-gray-600 truncate max-w-[200px]">{item.product?.name} × {item.quantity}</span>
                  <span className="font-medium">₹{item.itemTotal?.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <hr className="border-gray-100" />
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{cart?.pricing?.subtotal?.toLocaleString('en-IN')}</span></div>
              {cart?.pricing?.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{cart?.pricing?.discount?.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{cart?.pricing?.shippingCost === 0 ? 'FREE' : `₹${cart?.pricing?.shippingCost}`}</span></div>
              <hr className="border-gray-100" />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{cart?.pricing?.total?.toLocaleString('en-IN')}</span></div>
            </div>
            <button onClick={handlePlaceOrder} disabled={placing || !cart?.items?.length} className="btn-primary w-full justify-center flex">
              {placing ? 'Processing...' : `Pay ₹${cart?.pricing?.total?.toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
