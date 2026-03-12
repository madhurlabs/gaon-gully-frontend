'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['placed','confirmed','processing','shipped','out_for_delivery','delivered','cancelled'];
const STATUS_COLORS: Record<string,string> = {
  placed:'bg-blue-100 text-blue-700', confirmed:'bg-cyan-100 text-cyan-700',
  processing:'bg-yellow-100 text-yellow-700', shipped:'bg-purple-100 text-purple-700',
  out_for_delivery:'bg-indigo-100 text-indigo-700', delivered:'bg-green-100 text-green-700',
  cancelled:'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { router.push('/'); return; }
    fetchOrders();
  }, [search, statusFilter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...(statusFilter && { status: statusFilter }), ...(search && { search }) });
      const { data } = await api.get(`/orders/admin?${params}`);
      setOrders(data.data.orders);
      setPagination(data.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  const updateStatus = async () => {
    if (!newStatus) { toast.error('Select a status'); return; }
    setUpdating(true);
    try {
      await api.put(`/orders/admin/${selectedOrder._id}/status`, { status: newStatus, trackingNumber });
      toast.success('Order status updated!');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setUpdating(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:ml-64 flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{pagination?.total || 0} total orders</p>
        </div>

        {/* Update status modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="font-bold text-gray-900 mb-4">Update Order: {selectedOrder.orderId}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field">
                    <option value="">Select status</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                {(newStatus === 'shipped' || newStatus === 'out_for_delivery') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Tracking Number</label>
                    <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="input-field" placeholder="AWB / Tracking No." />
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={updateStatus} disabled={updating} className="btn-primary flex-1 py-2.5">{updating ? 'Updating...' : 'Update'}</button>
                  <button onClick={() => { setSelectedOrder(null); setNewStatus(''); setTrackingNumber(''); }} className="btn-secondary flex-1 py-2.5">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-4 mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by Order ID..." className="input-field pl-10" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field py-2 w-48">
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Order ID','Customer','Items','Amount','Type','Status','Date','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? [...Array(10)].map((_,i) => <tr key={i}><td colSpan={8}><div className="h-12 skeleton-pulse bg-gray-200 m-2 rounded" /></td></tr>)
                : orders.length === 0 ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">No orders found</td></tr>
                : orders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{order.orderId}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{order.user?.name}</p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.items?.length} items</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">₹{order.pricing?.total?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><span className={`badge text-xs ${order.orderType === 'wholesale' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{order.orderType}</span></td>
                    <td className="px-4 py-3"><span className={`badge text-xs ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>{order.orderStatus.replace('_',' ')}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedOrder(order); setNewStatus(order.orderStatus); }} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination?.totalPages > 1 && (
            <div className="p-4 border-t flex justify-between items-center text-sm">
              <span className="text-gray-500">Page {page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p-1)} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p => p+1)} disabled={!pagination.hasNext} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
