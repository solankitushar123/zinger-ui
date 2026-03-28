import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Loader2, Shield, ShieldOff, User2, ChevronDown, X, CheckCircle, Bike } from 'lucide-react'
import { orderAPI, adminAPI } from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_OPTIONS = ['placed','confirmed','preparing','picked_up','out_for_delivery','delivered','cancelled']
const STATUS_COLORS: Record<string,string> = {
  placed:'bg-blue-100 text-blue-700',
  confirmed:'bg-indigo-100 text-indigo-700',
  preparing:'bg-yellow-100 text-yellow-700',
  picked_up:'bg-orange-100 text-orange-700',
  out_for_delivery:'bg-purple-100 text-purple-700',
  delivered:'bg-green-100 text-green-700',
  cancelled:'bg-red-100 text-red-700',
}

// ── Assign Partner Modal ──────────────────────────────────────────────────────
function AssignModal({ order, onClose }: { order: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<string>(order.deliveryPartner?._id || '')

  const { data: partnerData, isLoading } = useQuery({
    queryKey: ['available-partners'],
    queryFn: () => orderAPI.getAvailablePartners().then(r => r.data.partners),
    staleTime: 30000,
  })

  const assignMutation = useMutation({
    mutationFn: () => orderAPI.adminAssignDelivery(order._id, selected),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Delivery partner assigned!')
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to assign'),
  })

  const partners = partnerData || []

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-lg text-gray-900">Assign Delivery Partner</h3>
            <p className="text-xs text-gray-400 mt-0.5">Order #{order.orderId} • {order.deliveryAddress?.city}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
        ) : partners.length === 0 ? (
          <div className="text-center py-8">
            <Bike size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No delivery partners found</p>
            <p className="text-gray-400 text-xs mt-1">Add delivery partners in User Management</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto mb-5">
            {partners.map((p: any) => (
              <label key={p._id}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  selected === p._id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'
                }`}>
                <input type="radio" name="partner" value={p._id} checked={selected === p._id}
                  onChange={() => setSelected(p._id)} className="accent-primary-600" />
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                  {p.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">{p.name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${p.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isAvailable ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{p.phone} • {p.activeOrders} active order{p.activeOrders !== 1 ? 's' : ''}</p>
                </div>
                {order.deliveryPartner?._id === p._id && (
                  <span className="text-xs text-primary-600 font-semibold flex-shrink-0">Current</span>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => assignMutation.mutate()} disabled={!selected || assignMutation.isPending}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-3">
            {assignMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            Assign Partner
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AdminOrders ───────────────────────────────────────────────────────────────
export function AdminOrders() {
  const [search, setSearch]       = useState('')
  const [statusFilter, setFilter] = useState('')
  const [assigningOrder, setAssigning] = useState<any>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter],
    queryFn: () => orderAPI.adminGetAll({ search, status: statusFilter, limit: 50 }).then(r => r.data),
    staleTime: 15000,
    refetchInterval: 30000,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderAPI.adminUpdateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Status updated') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  return (
    <div className="space-y-4">
      {assigningOrder && <AssignModal order={assigningOrder} onClose={() => setAssigning(null)} />}

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Orders</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{data?.pagination?.total || 0} total</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID..." className="pl-9 input max-w-[200px] py-2.5" />
        </div>
        <select value={statusFilter} onChange={e => setFilter(e.target.value)}
          className="input max-w-[180px] py-2.5">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Delivery Partner</th>
                <th className="px-4 py-3 font-semibold">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-10">
                  <Loader2 size={24} className="animate-spin text-primary-600 mx-auto" />
                </td></tr>
              ) : data?.orders?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No orders found</td></tr>
              ) : data?.orders?.map((o: any) => (
                <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-800 text-xs">#{o.orderId}</p>
                    <p className="text-[10px] text-gray-400">{format(new Date(o.createdAt), 'dd MMM, HH:mm')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{o.user?.name}</p>
                    <p className="text-xs text-gray-400">{o.user?.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-800">₹{o.totalAmount}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{o.paymentMethod}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${o.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : o.paymentStatus === 'refunded' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${STATUS_COLORS[o.deliveryStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {o.deliveryStatus?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.deliveryPartner ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                          {o.deliveryPartner.name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate max-w-[80px]">{o.deliveryPartner.name}</p>
                          <button onClick={() => setAssigning(o)} className="text-[10px] text-primary-600 hover:underline">Change</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAssigning(o)}
                        className="text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1.5 rounded-xl transition-colors whitespace-nowrap">
                        + Assign
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select value={o.deliveryStatus}
                      onChange={e => updateStatusMutation.mutate({ id: o._id, status: e.target.value })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── AdminUsers ────────────────────────────────────────────────────────────────
export function AdminUsers() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRole] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => adminAPI.getUsers({ search, role: roleFilter || undefined, limit: 50 }).then(r => r.data),
    staleTime: 30000,
  })

  const blockMutation = useMutation({
    mutationFn: (id: string) => adminAPI.toggleBlock(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User status updated') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-gray-900">User Management</h1>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..." className="pl-9 input max-w-xs py-2.5" />
        </div>
        <select value={roleFilter} onChange={e => setRole(e.target.value)} className="input max-w-[150px] py-2.5">
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="delivery">Delivery</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10"><Loader2 size={24} className="animate-spin text-primary-600 mx-auto" /></td></tr>
              ) : data?.users?.map((u: any) => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {u.name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      <button onClick={() => blockMutation.mutate(u._id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${u.isBlocked ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'}`}>
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminOrders
