'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Settings,
  TrendingUp, AlertTriangle, Clock, BarChart2
} from 'lucide-react';
import { useAuthStore } from '@/store';
import api from '@/lib/api';

function StatCard({ title, value, icon: Icon, color, subtitle }: any) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-green-600 mt-1">{subtitle}</p>}
    </div>
  );
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/wholesale', label: 'Wholesale Requests', icon: Tag },
  { href: '/admin/categories', label: 'Categories', icon: Settings },
  { href: '/admin/discounts', label: 'Discounts', icon: Tag },
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
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-30">
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">GaonGully Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-50 hover:text-primary-700 text-gray-600 text-sm font-medium transition-colors group"
            >
              <Icon className="w-4 h-4 group-hover:text-primary-600" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 text-sm font-bold">{user?.name?.[0]}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}!</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5 h-28 skeleton-pulse bg-gray-200" />
            ))}
          </div>
        ) : dashboard && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard title="Total Users" value={dashboard.stats.totalUsers} icon={Users} color="bg-blue-500" subtitle={`+${dashboard.stats.newUsersThisMonth} this month`} />
              <StatCard title="Total Products" value={dashboard.stats.totalProducts} icon={Package} color="bg-green-500" subtitle={`${dashboard.stats.activeProducts} active`} />
              <StatCard title="Total Orders" value={dashboard.stats.totalOrders} icon={ShoppingCart} color="bg-purple-500" subtitle={`${dashboard.stats.monthOrders} this month`} />
              <StatCard title="Monthly Revenue" value={`₹${dashboard.stats.monthRevenue?.toLocaleString('en-IN')}`} icon={TrendingUp} color="bg-orange-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Recent Orders</h2>
                  <Link href="/admin/orders" className="text-sm text-primary-600 hover:underline">View all</Link>
                </div>
                {dashboard.recentOrders?.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.recentOrders?.slice(0, 8).map((order: any) => (
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
                )}
              </div>

              <div className="space-y-6">
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">Wholesale Requests</h3>
                  </div>
                  <p className="text-3xl font-bold text-amber-600">{dashboard.stats.pendingWholesaleRequests}</p>
                  <p className="text-sm text-gray-500 mt-1">Pending review</p>
                  <Link href="/admin/wholesale" className="btn-outline text-xs py-1.5 px-3 mt-3 inline-block">Review Now</Link>
                </div>

                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="font-semibold text-gray-900">Low Stock Alert</h3>
                  </div>
                  <div className="space-y-2">
                    {dashboard.lowStockProducts?.length === 0 ? (
                      <p className="text-sm text-gray-400">All products well-stocked</p>
                    ) : dashboard.lowStockProducts?.slice(0, 5).map((p: any) => (
                      <div key={p._id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 truncate max-w-[150px]">{p.name}</span>
                        <span className={`font-bold ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>{p.stock}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
