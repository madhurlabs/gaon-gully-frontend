'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { router.push('/'); return; }
    fetchUsers();
  }, [search, roleFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...(search && { search }), ...(roleFilter && { role: roleFilter }) });
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  const toggleStatus = async (userId: string, name: string) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-status`);
      toast.success(`User ${name} status updated`);
      fetchUsers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const ROLE_COLORS: Record<string,string> = {
    retail: 'bg-blue-100 text-blue-700', wholesale: 'bg-amber-100 text-amber-700',
    admin: 'bg-purple-100 text-purple-700', guest: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:ml-64 flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm">{pagination?.total || 0} registered users</p>
        </div>

        <div className="card p-4 mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email..." className="input-field pl-10" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="input-field py-2 w-40">
            <option value="">All Roles</option>
            {['retail','wholesale','admin'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['User','Email','Phone','Role','Status','Joined','Action'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? [...Array(10)].map((_,i) => <tr key={i}><td colSpan={7}><div className="h-12 skeleton-pulse bg-gray-200 m-2 rounded" /></td></tr>)
                : users.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">No users found</td></tr>
                : users.map((u: any) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-700 text-sm">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">{u.email}{u.isEmailVerified && <Shield className="w-3 h-3 text-green-500" />}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.phone || '—'}</td>
                    <td className="px-4 py-3"><span className={`badge text-xs ${ROLE_COLORS[u.role] || 'bg-gray-100'}`}>{u.role}</span></td>
                    <td className="px-4 py-3"><span className={`badge text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Banned'}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button onClick={() => toggleStatus(u._id, u.name)} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} title={u.isActive ? 'Ban user' : 'Unban user'}>
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      )}
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
                <button onClick={() => setPage(p=>p-1)} disabled={page===1} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p=>p+1)} disabled={!pagination.hasNext} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
