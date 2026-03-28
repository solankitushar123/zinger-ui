import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../api'
import { useSocket } from '../../hooks/useSocket'
import {
  TrendingUp, Users, ShoppingBag, Package, IndianRupee,
  Loader2, AlertTriangle, ChevronRight, Clock, RefreshCw
} from 'lucide-react'

function StatCard({ icon, label, value, sub, color, trend }: {
  icon: React.ReactNode; label: string; value: string|number; sub?: string; color: string; trend?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card hover:shadow-card-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>{icon}</div>
        {trend && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{trend}</span>}
      </div>
      <p className="text-2xl font-display font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-primary-600 font-medium mt-1">{sub}</p>}
    </div>
  )
}

// Simple bar chart using pure CSS
function BarChart({ data }: { data: { label: string; value: number; orders: number }[] }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-32">
      {data.slice(-12).map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            ₹{d.value.toLocaleString()} • {d.orders} orders
          </div>
          <div
            className="w-full bg-primary-500 hover:bg-primary-600 rounded-t-lg transition-all duration-300 min-h-[4px]"
            style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
          />
          <span className="text-[8px] text-gray-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const qc = useQueryClient()
  const [salesRange, setSalesRange] = useState<'daily'|'monthly'>('monthly')

  // Socket for real-time dashboard updates
  useSocket()

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.getDashboard().then(r => r.data),
    staleTime: 60000,
    refetchInterval: 60000,
  })

  const { data: salesData } = useQuery({
    queryKey: ['sales-report', salesRange],
    queryFn: () => adminAPI.getSalesReport({ groupBy: salesRange === 'daily' ? 'day' : 'month' }).then(r => r.data.report),
    staleTime: 60000,
  })

  if (isLoading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  )

  const { stats, recentOrders, lowStockProducts, charts } = data || {}

  const STATUS_COLORS: Record<string,string> = {
    placed:'bg-blue-100 text-blue-700', confirmed:'bg-indigo-100 text-indigo-700',
    preparing:'bg-yellow-100 text-yellow-700', picked_up:'bg-orange-100 text-orange-700',
    out_for_delivery:'bg-purple-100 text-purple-700', delivered:'bg-green-100 text-green-700',
    cancelled:'bg-red-100 text-red-700',
  }

  // Build chart data
  const chartData = (salesData || []).map((d: any) => ({
    label: salesRange === 'daily'
      ? `${d._id.day}/${d._id.month}`
      : ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d._id.month] || d._id.month,
    value: d.revenue || 0,
    orders: d.orders || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
            <Clock size={11} /> Last updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
          </p>
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['admin-dashboard'] })}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary-600 border border-gray-200 hover:border-primary-300 px-3 py-2 rounded-xl transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<IndianRupee size={20} className="text-green-600" />}
          label="Total Revenue" color="bg-green-100"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
          sub={`₹${(stats?.monthRevenue || 0).toLocaleString('en-IN')} this month`}
        />
        <StatCard
          icon={<ShoppingBag size={20} className="text-blue-600" />}
          label="Total Orders" color="bg-blue-100"
          value={stats?.totalOrders || 0}
          sub={`${stats?.todayOrders || 0} today`}
          trend={stats?.todayOrders > 0 ? `+${stats.todayOrders} today` : undefined}
        />
        <StatCard
          icon={<Users size={20} className="text-purple-600" />}
          label="Customers" color="bg-purple-100"
          value={stats?.totalUsers || 0}
          sub={`${stats?.newUsersToday || 0} new today`}
        />
        <StatCard
          icon={<Package size={20} className="text-orange-600" />}
          label="Pending Orders" color="bg-orange-100"
          value={stats?.pendingOrders || 0}
          sub={`${stats?.deliveryPartners || 0} delivery partners`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-gray-800">Revenue Overview</h2>
            <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
              {(['daily','monthly'] as const).map(r => (
                <button key={r} onClick={() => setSalesRange(r)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all capitalize ${salesRange === r ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <BarChart data={chartData} />
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <h2 className="font-display font-bold text-gray-800 mb-4">Order Status</h2>
          <div className="space-y-2.5">
            {(charts?.ordersByStatus || []).map((s: any) => {
              const total = charts?.ordersByStatus?.reduce((sum: number, x: any) => sum + x.count, 0) || 1
              const pct = Math.round((s.count / total) * 100)
              return (
                <div key={s._id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`badge text-[10px] ${STATUS_COLORS[s._id] || 'bg-gray-100 text-gray-600'}`}>
                      {s._id?.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-800">{s.count}</span>
                      <span className="text-[10px] text-gray-400">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {!charts?.ordersByStatus?.length && <p className="text-xs text-gray-400 text-center py-4">No orders yet</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-display font-bold text-gray-800">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {recentOrders?.slice(0, 8).map((o: any) => (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-xs text-gray-800">#{o.orderId}</p>
                      <p className="text-[10px] text-gray-400">{o.user?.name}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">₹{o.totalAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${STATUS_COLORS[o.deliveryStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {o.deliveryStatus?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/admin/orders" className="text-xs text-primary-600 hover:underline">Manage</Link>
                    </td>
                  </tr>
                ))}
                {!recentOrders?.length && (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock + Top products */}
        <div className="space-y-4">
          {/* Low stock */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
            <h2 className="font-display font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <AlertTriangle size={15} className="text-orange-500" /> Low Stock Alert
            </h2>
            {lowStockProducts?.length ? (
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 5).map((p: any) => (
                  <div key={p._id} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt={p.name} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">{p.name?.[0]}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex-1 h-1 bg-gray-100 rounded-full">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min((p.stock/p.lowStockThreshold)*100, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-orange-600 font-bold flex-shrink-0">{p.stock} left</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/admin/products" className="text-xs text-primary-600 font-semibold hover:underline">
                  Manage inventory →
                </Link>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">✅ All products well-stocked</p>
            )}
          </div>

          {/* Top products */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
            <h2 className="font-display font-bold text-gray-800 mb-3 text-sm">🏆 Top Sellers</h2>
            <div className="space-y-2.5">
              {(charts?.topProducts || []).slice(0, 4).map((tp: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-gray-300 w-4 text-right">{i+1}</span>
                  <div className="w-7 h-7 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {tp.product?.images?.[0]?.url ? (
                      <img src={tp.product.images[0].url} alt={tp.product.name} className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">{tp.product?.name?.[0]}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{tp.product?.name}</p>
                    <p className="text-[10px] text-gray-400">{tp.totalSold} sold • ₹{(tp.revenue||0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {!charts?.topProducts?.length && <p className="text-xs text-gray-400 text-center py-2">No sales yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
