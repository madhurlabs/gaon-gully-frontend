'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, ShoppingCart, Users, Tag, Settings,
  TrendingUp, AlertTriangle, Clock, BarChart2, Plus, List
} from 'lucide-react';
import { useAuthStore } from '@/store';
import api from '@/lib/api';

function StatCard({ title, value, icon: Icon, color, subtitle }: any) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-green-600 mt-1">{subtitle}</p>}
    </div>
  );
}

const quickLinks = [
  { href: '/admin/products', label: 'Manage Products', icon: Package, color: 'bg-green-500', desc: 'Add, edit, delete products' },
  { href: '/admin/orders', label: 'Manage Orders', icon: ShoppingCart, color: 'bg-purple-500', desc: 'View and update orders' },
  { href: '/admin/users', label: 'Manage Users', icon: Users, color: 'bg-blue-500', desc: 'View and manage users' },
  { href: '/admin/wholesale', label: 'Wholesale Requests', icon: Tag, color: 'bg-amber-500', desc: 'Approve or reject requests' },
  { href: '/admin/categories', label: 'Categories', icon: Settings, color: 'bg-pink-500', desc: 'Add and manage categories' },
  { href: '/admin/discounts', label: 'Discounts & Coupons', icon: BarChart2, color: 'bg-indigo-500', desc: 'Create coupon codes' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/login');
      return;
    }
    api.get('/admin/dashboard')
      .then(r => setDashboard(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hydrated, isAuthenticated, user]);

  if (!hydrated) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-gray-900">GaonGully Admin</h1>
          <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
        </div>
        <Link href="/" className="text-sm text-primary-600 border border-primary-200 px-3 py-1.5 rounded-lg">
          View Store
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5 h-28 skeleton-pulse bg-gray-200" />
            ))}
          </div>
        ) : dashboard && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard title="Total Users" value={dashboard.stats.totalUsers} icon={Users} color="bg-blue-500" subtitle={`+${dashboard.stats.newUsersThisMonth} this month`} />
            <StatCard title="Total Products" value={dashboard.stats.totalProducts} icon={Package} color="bg-green-500" subtitle={`${dashboard.stats.activeProducts} active`} />
            <StatCard title="Total Orders" value={dashboard.stats.totalOrders} icon={ShoppingCart} color="bg-purple-500" subtitle={`${dashboard.stats.monthOrders} this month`} />
            <StatCard title="Monthly Revenue" value={`₹${dashboard.stats.monthRevenue?.toLocaleString('en-IN') || 0}`} icon={TrendingUp} color="bg-orange-500" />
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {quickLinks.map(({ href, label, icon: Icon, color, desc }) => (
            <Link
              key={href}
              href={href}
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-95"
            >
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Alerts */}
        {dashboard && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Wholesale pending */}
            {dashboard.stats.pendingWholesaleRequests > 0 && (
              <div className="card p-4 border-l-4 border-amber-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Wholesale Requests</p>
                      <p className="text-xs text-gray-500">{dashboard.stats.pendingWholesaleRequests} pending review</p>
                    </div>
                  </div>
                  <Link href="/admin/wholesale" className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-medium">
                    Review
                  </Link>
                </div>
              </div>
            )}

            {/* Low stock */}
            {dashboard.lowStockProducts?.length > 0 && (
              <div className="card p-4 border-l-4 border-red-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Low Stock Alert</p>
                      <p className="text-xs text-gray-500">{dashboard.lowStockProducts.length} products low</p>
                    </div>
                  </div>
                  <Link href="/admin/products" className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium">
                    View
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Orders */}
        {dashboard?.recentOrders?.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-primary-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {dashboard.recentOrders.slice(0, 5).map((order: any) => (
                <div key={order._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderId}</p>
                    <p className="text-xs text-gray-500">{order.user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹{order.pricing?.total?.toLocaleString('en-IN')}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{order.orderStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
