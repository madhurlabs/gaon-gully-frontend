'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { User, MapPin, Lock, Package, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';
import StoreLayout from '@/components/layout/StoreLayout';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const INDIAN_STATES = ['Andhra Pradesh','Bihar','Delhi','Gujarat','Haryana','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal','Other'];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>(user?.addresses || []);

  const profileForm = useForm({ defaultValues: { name: user?.name || '', phone: user?.phone || '' } });
  const passwordForm = useForm();
  const addressForm = useForm();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setAddresses(user?.addresses || []);
  }, [isAuthenticated, user]);

  const onUpdateProfile = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.put('/users/profile', data);
      updateUser(res.data.data);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const onChangePassword = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      await api.put('/users/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  const onSaveAddress = async (data: any) => {
    try {
      let res;
      if (editingAddress) {
        res = await api.put(`/users/addresses/${editingAddress._id}`, data);
      } else {
        res = await api.post('/users/addresses', data);
      }
      const freshUser = await api.get('/users/profile');
      updateUser(freshUser.data.data);
      setAddresses(freshUser.data.data.addresses || []);
      setShowAddressForm(false);
      setEditingAddress(null);
      addressForm.reset();
      toast.success(editingAddress ? 'Address updated!' : 'Address added!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const onDeleteAddress = async (addressId: string) => {
    try {
      await api.delete(`/users/addresses/${addressId}`);
      setAddresses(prev => prev.filter(a => a._id !== addressId));
      toast.success('Address removed');
    } catch { toast.error('Failed to remove address'); }
  };

  const startEditAddress = (addr: any) => {
    setEditingAddress(addr);
    addressForm.reset(addr);
    setShowAddressForm(true);
  };

  if (!isAuthenticated) return null;

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-700">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-sm">{user?.email}</span>
              {user?.isEmailVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
              <span className={`badge text-xs ml-1 ${user?.role === 'wholesale' ? 'bg-amber-100 text-amber-800' : 'bg-primary-100 text-primary-800'}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'addresses', label: 'Addresses', icon: MapPin },
            { id: 'password', label: 'Password', icon: Lock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card p-6 max-w-lg">
            <h2 className="font-bold text-gray-900 mb-5">Personal Information</h2>
            <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input {...profileForm.register('name', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input value={user?.email} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input {...profileForm.register('phone')} type="tel" maxLength={10} placeholder="9876543210" className="input-field" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary py-2.5">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Saved Addresses</h2>
              <button onClick={() => { setEditingAddress(null); addressForm.reset(); setShowAddressForm(true); }} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New Address
              </button>
            </div>

            {showAddressForm && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                <form onSubmit={addressForm.handleSubmit(onSaveAddress)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input {...addressForm.register('fullName', { required: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                    <input {...addressForm.register('phone', { required: true })} type="tel" maxLength={10} className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 1 *</label>
                    <input {...addressForm.register('addressLine1', { required: true })} placeholder="House/Flat No., Street" className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 2</label>
                    <input {...addressForm.register('addressLine2')} placeholder="Area, Landmark (optional)" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                    <input {...addressForm.register('city', { required: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                    <select {...addressForm.register('state', { required: true })} className="input-field">
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode *</label>
                    <input {...addressForm.register('pincode', { required: true })} maxLength={6} className="input-field" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input {...addressForm.register('isDefault')} type="checkbox" id="isDefault" className="rounded" />
                    <label htmlFor="isDefault" className="text-sm text-gray-600">Set as default address</label>
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <button type="submit" className="btn-primary py-2.5 flex-1">Save Address</button>
                    <button type="button" onClick={() => { setShowAddressForm(false); setEditingAddress(null); }} className="btn-secondary py-2.5 flex-1">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {addresses.length === 0 && !showAddressForm ? (
              <div className="text-center py-10 text-gray-400 card p-8">
                <MapPin className="w-12 h-12 mx-auto mb-3" />
                <p>No saved addresses yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr: any) => (
                  <div key={addr._id} className={`card p-4 border-2 ${addr.isDefault ? 'border-primary-300 bg-primary-50' : 'border-transparent'}`}>
                    {addr.isDefault && <span className="badge bg-primary-100 text-primary-700 text-xs mb-2">Default</span>}
                    <p className="font-semibold text-gray-900">{addr.fullName}</p>
                    <p className="text-sm text-gray-600 mt-1">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                    <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-sm text-gray-500 mt-1">📞 {addr.phone}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => startEditAddress(addr)} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => onDeleteAddress(addr._id)} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="card p-6 max-w-lg">
            <h2 className="font-bold text-gray-900 mb-5">Change Password</h2>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <input {...passwordForm.register(field, { required: true, minLength: field !== 'currentPassword' ? 8 : 1 })} type="password" className="input-field" placeholder="••••••••" />
                </div>
              ))}
              <button type="submit" disabled={loading} className="btn-primary py-2.5">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
