'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, CheckCircle, Clock, XCircle, Leaf } from 'lucide-react';
import StoreLayout from '@/components/layout/StoreLayout';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const wholesaleSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid phone number'),
  businessAddress: z.string().min(10, 'Enter full business address'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  expectedMonthlyVolume: z.string().min(1, 'Please select expected volume'),
});

type WholesaleForm = z.infer<typeof wholesaleSchema>;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

export default function WholesalePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [requestStatus, setRequestStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm<WholesaleForm>({
    resolver: zodResolver(wholesaleSchema),
    defaultValues: { fullName: user?.name || '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/wholesale/request/status')
        .then(r => setRequestStatus(r.data.data))
        .catch(() => {})
        .finally(() => setStatusLoading(false));
    } else {
      setStatusLoading(false);
    }
  }, [isAuthenticated]);

  const onSubmit = async (data: WholesaleForm) => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setLoading(true);
    try {
      await api.post('/wholesale/request', data);
      toast.success('Wholesale request submitted successfully!');
      const res = await api.get('/wholesale/request/status');
      setRequestStatus(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'wholesale') {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You Have Wholesale Access!</h1>
          <p className="text-gray-600 mb-6">Enjoy exclusive bulk pricing and wholesale features.</p>
          <Link href="/products" className="btn-primary">Start Shopping Wholesale</Link>
        </div>
      </StoreLayout>
    );
  }

  if (!statusLoading && requestStatus?.status === 'pending') {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Under Review</h1>
          <p className="text-gray-600">Your wholesale request is being reviewed. We'll notify you within 2-3 business days.</p>
          <div className="mt-6 p-4 bg-amber-50 rounded-xl text-left text-sm">
            <p><strong>Business:</strong> {requestStatus.businessName}</p>
            <p><strong>Submitted:</strong> {new Date(requestStatus.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!statusLoading && requestStatus?.status === 'rejected') {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Not Approved</h1>
          {requestStatus.adminNote && <p className="text-gray-600">Reason: {requestStatus.adminNote}</p>}
          <p className="text-gray-500 text-sm mt-2">Please contact us for more information.</p>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-600 to-amber-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-4">Apply for Wholesale Access</h1>
          <p className="text-amber-100 text-lg max-w-xl mx-auto">
            Get exclusive bulk pricing, minimum order quantities, and dedicated support for your business.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-8 max-w-lg mx-auto">
            {['Bulk Pricing', 'WhatsApp Orders', 'Priority Support'].map(feature => (
              <div key={feature} className="text-center">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {!isAuthenticated ? (
          <div className="text-center card p-8">
            <Leaf className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Sign in to Apply</h2>
            <p className="text-gray-500 mb-6">You need an account to apply for wholesale access.</p>
            <Link href="/login" className="btn-primary">Login to Continue</Link>
          </div>
        ) : (
          <div className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Business Information</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input {...register('fullName')} className="input-field" placeholder="Your full name" />
                  {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name *</label>
                  <input {...register('businessName')} className="input-field" placeholder="Your company name" />
                  {errors.businessName && <p className="mt-1 text-xs text-red-500">{errors.businessName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">GST Number <span className="text-gray-400">(optional)</span></label>
                  <input {...register('gstNumber')} className="input-field" placeholder="22AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                  <input {...register('phone')} type="tel" className="input-field" placeholder="9876543210" maxLength={10} />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Address *</label>
                <textarea {...register('businessAddress')} rows={2} className="input-field resize-none" placeholder="Full address including street, area" />
                {errors.businessAddress && <p className="mt-1 text-xs text-red-500">{errors.businessAddress.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                  <input {...register('city')} className="input-field" placeholder="City" />
                  {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                  <select {...register('state')} className="input-field">
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Monthly Order Volume *</label>
                <select {...register('expectedMonthlyVolume')} className="input-field">
                  <option value="">Select expected volume</option>
                  <option value="₹10,000 - ₹50,000">₹10,000 - ₹50,000</option>
                  <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                  <option value="₹1,00,000 - ₹5,00,000">₹1,00,000 - ₹5,00,000</option>
                  <option value="Above ₹5,00,000">Above ₹5,00,000</option>
                </select>
                {errors.expectedMonthlyVolume && <p className="mt-1 text-xs text-red-500">{errors.expectedMonthlyVolume.message}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center bg-amber-600 hover:bg-amber-700">
                {loading ? 'Submitting...' : 'Submit Wholesale Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
