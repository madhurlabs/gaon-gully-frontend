'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronRight, Phone, MapPin } from 'lucide-react';
import StoreLayout from '@/components/layout/StoreLayout';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['placed','confirmed','processing','shipped','out_for_delivery','delivered'];
const STATUS_ICONS: Record<string, any> = {
  placed: Clock, confirmed: CheckCircle, processing: Package, shipped: Truck, delivered: CheckCircle, cancelled: XCircle,
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    api.get(`/orders/${params.id}`)
      .then(r => setOrder(r.data.data))
      .catch(() => { toast.error('Order not found'); router.push('/orders'); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await api.put(`/orders/${params.id}/cancel`, { reason: 'Cancelled by customer' });
      toast.success('Order cancelled successfully');
      const res = await api.get(`/orders/${params.id}`);
      setOrder(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cannot cancel order');
    } finally { setCancelling(false); }
  };

  const STATUS_COLORS: Record<string,string> = {
    placed: 'bg-blue-100 text-blue-700', confirmed: 'bg-cyan-100 text-cyan-700',
    processing: 'bg-yellow-100 text-yellow-700', shipped: 'bg-purple-100 text-purple-700',
    out_for_delivery: 'bg-indigo-100 text-indigo-700', delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) return <StoreLayout><div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div></StoreLayout>;
  if (!order) return null;

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/orders" className="hover:text-primary-600">My Orders</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-800">{order.orderId}</span>
        </nav>

        {/* Order Header */}
        <div className="card p-5 mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-bold text-lg text-gray-900">{order.orderId}</p>
            <p className="text-sm text-gray-400 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge px-3 py-1.5 text-sm font-semibold ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
              {order.orderStatus.replace('_', ' ').toUpperCase()}
            </span>
            {['placed', 'confirmed'].includes(order.orderStatus) && (
              <button onClick={cancelOrder} disabled={cancelling} className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {/* Progress tracker */}
        {order.orderStatus !== 'cancelled' && (
          <div className="card p-5 mb-5">
            <h3 className="font-semibold text-gray-900 mb-5">Order Progress</h3>
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-primary-500 transition-all duration-500"
                style={{ width: `${currentStep >= 0 ? (currentStep / (STATUS_STEPS.length - 1)) * 100 : 0}%` }}
              />
              <div className="relative flex justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all ${done ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'}`}>
                        {done ? <CheckCircle className="w-5 h-5 text-white" /> : <div className="w-3 h-3 rounded-full bg-gray-300" />}
                      </div>
                      <span className={`text-xs font-medium capitalize text-center ${done ? 'text-primary-700' : 'text-gray-400'}`}>
                        {step.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {order.trackingNumber && (
              <div className="mt-5 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-semibold text-blue-800">Tracking: {order.trackingNumber}</p>
                {order.trackingUrl && <a href={order.trackingUrl} target="_blank" className="text-blue-600 hover:underline text-xs">Track on courier website →</a>}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Order Items ({order.items?.length})</h3>
              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item._id} className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                      {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      {(item.color || item.size) && (
                        <p className="text-xs text-gray-500 mt-0.5">{[item.color, item.size].filter(Boolean).join(' · ')}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-gray-500">Qty: {item.quantity} × ₹{item.unitPrice?.toLocaleString('en-IN')}</p>
                        <p className="font-semibold text-gray-900">₹{item.totalPrice?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary & Address */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{order.pricing?.subtotal?.toLocaleString('en-IN')}</span></div>
                {order.pricing?.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.pricing.discount?.toLocaleString('en-IN')}</span></div>}
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.pricing?.shippingCost === 0 ? 'FREE' : `₹${order.pricing?.shippingCost}`}</span></div>
                <hr className="border-gray-100" />
                <div className="flex justify-between font-bold text-gray-900 text-base"><span>Total</span><span>₹{order.pricing?.total?.toLocaleString('en-IN')}</span></div>
              </div>
              <div className={`mt-3 text-xs px-3 py-2 rounded-lg font-medium ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                Payment: {order.paymentStatus?.toUpperCase()}
                {order.paymentMethod && ` · ${order.paymentMethod}`}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-600" />Delivery Address</h3>
              {order.shippingAddress && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                  <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{order.shippingAddress.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
