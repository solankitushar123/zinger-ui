import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { deliveryAPI } from '../../api'
import { Package, MapPin, Phone, ChevronRight, CheckCircle, Truck, Loader2,
         TrendingUp, IndianRupee, Clock, AlertCircle, History, Zap, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_LABELS: Record<string,string> = {
  placed:'Order Placed', confirmed:'Confirmed', preparing:'Preparing',
  picked_up:'Picked Up', out_for_delivery:'On the Way',
  delivered:'Delivered', cancelled:'Cancelled',
}
const STATUS_COLORS: Record<string,string> = {
  placed:'bg-blue-100 text-blue-700', confirmed:'bg-indigo-100 text-indigo-700',
  preparing:'bg-yellow-100 text-yellow-700', picked_up:'bg-orange-100 text-orange-700',
  out_for_delivery:'bg-purple-100 text-purple-700', delivered:'bg-green-100 text-green-700',
  cancelled:'bg-red-100 text-red-700',
}

// OTP Dialog
function OTPDialog({ orderId, onClose, onSuccess }: { orderId: string; onClose: () => void; onSuccess: () => void }) {
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [sent, setSent] = useState(false)

  const requestMutation = useMutation({
    mutationFn: () => deliveryAPI.requestOTP(orderId),
    onSuccess: (res) => {
      setSent(true)
      if (res.data.devOtp) setDevOtp(res.data.devOtp)
      toast.success('OTP sent to customer!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to send OTP'),
  })

  const verifyMutation = useMutation({
    mutationFn: () => deliveryAPI.verifyOTP(orderId, otp),
    onSuccess: () => { toast.success('Delivery confirmed! 🎉'); onSuccess() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Invalid OTP'),
  })

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg">Confirm Delivery</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>

        {!sent ? (
          <>
            <div className="bg-primary-50 rounded-2xl p-4 mb-5 text-center">
              <Zap size={28} className="text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">Send OTP to customer</p>
              <p className="text-xs text-gray-500 mt-1">Customer must enter this OTP to confirm delivery</p>
            </div>
            <button onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
              {requestMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
              Send OTP to Customer
            </button>
          </>
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4 text-center">
              <p className="text-sm font-semibold text-green-800">OTP sent to customer!</p>
              {devOtp && (
                <p className="text-xs text-green-600 mt-1 font-mono bg-green-100 px-2 py-1 rounded-lg inline-block mt-2">
                  DEV OTP: <strong>{devOtp}</strong>
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Enter OTP from customer</label>
              <input type="number" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
                className="input text-center text-2xl font-mono tracking-widest" placeholder="● ● ● ● ● ●" />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-semibold text-gray-600">Cancel</button>
              <button onClick={() => verifyMutation.mutate()} disabled={otp.length !== 6 || verifyMutation.isPending}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3">
                {verifyMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Confirm
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function DeliveryDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'active'|'history'>('active')
  const [otpOrderId, setOtpOrderId] = useState<string|null>(null)
  const [watchingId, setWatchingId] = useState<string|null>(null)
  const [locationActive, setLocationActive] = useState(false)

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['delivery-orders', tab],
    queryFn: () => deliveryAPI.getOrders({ tab }).then(r => r.data),
    refetchInterval: tab === 'active' ? 20000 : false,
    staleTime: 10000,
  })

  const { data: statsData } = useQuery({
    queryKey: ['delivery-stats'],
    queryFn: () => deliveryAPI.getStats().then(r => r.data.stats),
    staleTime: 60000,
  })

  const acceptMutation = useMutation({
    mutationFn: (id: string) => deliveryAPI.acceptOrder(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-orders'] }); toast.success('Order accepted!') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deliveryAPI.rejectOrder(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-orders'] }); toast.success('Order rejected') },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => deliveryAPI.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-orders'] }); toast.success('Status updated!') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  // GPS location sharing
  const startLocationSharing = useCallback((orderId: string) => {
    if (!navigator.geolocation) { toast.error('GPS not supported'); return }
    setWatchingId(orderId)
    setLocationActive(true)
    const watcher = navigator.geolocation.watchPosition(
      pos => deliveryAPI.updateLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, orderId }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watcher)
  }, [])

  const orders = ordersData?.orders || []

  return (
    <div className="py-4 space-y-4">
      {/* OTP dialog */}
      {otpOrderId && (
        <OTPDialog
          orderId={otpOrderId}
          onClose={() => setOtpOrderId(null)}
          onSuccess={() => { setOtpOrderId(null); qc.invalidateQueries({ queryKey: ['delivery-orders'] }) }}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-gray-900">Hey {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {locationActive ? '📍 Sharing live location' : orders.length > 0 ? `${orders.length} active order${orders.length > 1 ? 's' : ''}` : 'No active orders'}
        </p>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Package size={16} className="text-blue-600" />,     label: 'Today',   value: statsData.todayDeliveries,          bg: 'bg-blue-50' },
            { icon: <TrendingUp size={16} className="text-green-600" />, label: 'Total',   value: statsData.totalDeliveries,          bg: 'bg-green-50' },
            { icon: <IndianRupee size={16} className="text-orange-600" />, label: 'Earned', value: `₹${statsData.totalEarnings}`,     bg: 'bg-orange-50' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-3 text-center`}>
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="font-display font-bold text-gray-900 text-lg leading-none">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {[['active','Active Orders'], ['history','Completed']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={28} className="animate-spin text-primary-600" /></div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Package size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">{tab === 'active' ? 'No active orders' : 'No completed orders'}</p>
          <p className="text-sm text-gray-400 mt-1">{tab === 'active' ? 'New orders will appear here' : 'Your delivery history'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
              {/* Order header */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-800 text-sm">#{order.orderId}</span>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock size={10} /> {format(new Date(order.createdAt), 'dd MMM, hh:mm a')}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.deliveryStatus] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Customer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-sm">
                      {order.user?.name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{order.user?.name}</p>
                      <p className="text-xs text-gray-400">{order.user?.phone}</p>
                    </div>
                  </div>
                  <a href={`tel:${order.user?.phone}`}
                    className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone size={15} className="text-green-600" />
                  </a>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                  <MapPin size={14} className="text-primary-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-600 leading-relaxed">
                    <p className="font-semibold text-gray-800">{order.deliveryAddress?.fullName}</p>
                    <p>{order.deliveryAddress?.street}, {order.deliveryAddress?.city} — {order.deliveryAddress?.pincode}</p>
                    {order.deliveryAddress?.landmark && <p className="text-gray-400">Near: {order.deliveryAddress.landmark}</p>}
                  </div>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(`${order.deliveryAddress?.street} ${order.deliveryAddress?.city}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="ml-auto flex-shrink-0 text-xs text-primary-600 font-semibold border border-primary-200 px-2 py-1 rounded-lg">
                    Maps
                  </a>
                </div>

                {/* Items & amount */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.paymentMethod === 'cod' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {order.paymentMethod === 'cod' ? 'COD' : 'PAID'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  {/* PLACED — accept/reject */}
                  {order.deliveryStatus === 'placed' && (
                    <>
                      <button onClick={() => rejectMutation.mutate({ id: order._id, reason: 'Unavailable' })}
                        disabled={rejectMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border-2 border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold">
                        <X size={14} /> Reject
                      </button>
                      <button onClick={() => acceptMutation.mutate(order._id)}
                        disabled={acceptMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold">
                        {acceptMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Accept
                      </button>
                    </>
                  )}

                  {/* CONFIRMED / PREPARING — mark picked up */}
                  {['confirmed', 'preparing'].includes(order.deliveryStatus) && (
                    <button onClick={() => statusMutation.mutate({ id: order._id, status: 'picked_up' })}
                      disabled={statusMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
                      <Package size={14} /> Mark Picked Up
                    </button>
                  )}

                  {/* PICKED_UP — start delivery + share location */}
                  {order.deliveryStatus === 'picked_up' && (
                    <button onClick={() => { statusMutation.mutate({ id: order._id, status: 'out_for_delivery' }); startLocationSharing(order._id) }}
                      disabled={statusMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold">
                      <Truck size={14} /> Start Delivery + Share Location
                    </button>
                  )}

                  {/* OUT FOR DELIVERY — OTP confirm */}
                  {order.deliveryStatus === 'out_for_delivery' && (
                    <button onClick={() => setOtpOrderId(order._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold">
                      <CheckCircle size={14} /> Delivered — Enter OTP
                    </button>
                  )}

                  {/* DELIVERED */}
                  {order.deliveryStatus === 'delivered' && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold">
                      <CheckCircle size={14} className="fill-green-100" /> Delivered ✓
                    </div>
                  )}

                  {/* Details link always */}
                  <Link to={`/delivery/orders/${order._id}`}
                    className="px-3 py-2.5 border-2 border-gray-200 hover:border-gray-300 text-gray-600 rounded-xl">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
