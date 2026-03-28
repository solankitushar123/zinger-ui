import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Phone, Package, CheckCircle, Navigation, Loader2, User } from 'lucide-react'
import { deliveryAPI, orderAPI } from '../../api'
import toast from 'react-hot-toast'

export default function DeliveryOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['delivery-order-detail', id],
    queryFn: () => orderAPI.getById(id!).then(r => r.data.order),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => deliveryAPI.updateStatus(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-order-detail', id] })
      qc.invalidateQueries({ queryKey: ['delivery-orders'] })
      toast.success('Order status updated!')
    },
  })

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  )

  if (!order) return (
    <div className="text-center py-20 text-gray-500">Order not found</div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/delivery" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-gray-900">#{order.orderId}</h1>
          <p className="text-xs text-gray-400 capitalize">{order.deliveryStatus?.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Customer</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{order.deliveryAddress?.fullName}</p>
              <p className="text-xs text-gray-500">{order.deliveryAddress?.phone}</p>
            </div>
          </div>
          <a
            href={`tel:${order.deliveryAddress?.phone}`}
            className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center"
          >
            <Phone size={16} className="text-white" />
          </a>
        </div>
      </div>

      {/* Delivery address */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <MapPin size={12} className="text-primary-600" /> Delivery Address
        </h3>
        <p className="text-sm text-gray-800 font-medium">{order.deliveryAddress?.street}</p>
        <p className="text-sm text-gray-600">{order.deliveryAddress?.city}, {order.deliveryAddress?.state}</p>
        <p className="text-sm text-gray-600">Pincode: {order.deliveryAddress?.pincode}</p>
        {order.deliveryAddress?.landmark && (
          <p className="text-xs text-gray-400 mt-1">Landmark: {order.deliveryAddress.landmark}</p>
        )}
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(
            `${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}, ${order.deliveryAddress?.pincode}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary-600 hover:underline"
        >
          <Navigation size={14} /> Open in Google Maps
        </a>
      </div>

      {/* Order items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Package size={12} /> Items ({order.items?.length})
        </h3>
        <div className="space-y-2.5">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <img
                src={item.image || '/placeholder.png'}
                alt={item.name}
                className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-gray-800 flex-shrink-0">₹{item.total}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
          <span className="font-bold text-gray-800 text-sm">Total</span>
          <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payment</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800 capitalize">{order.paymentMethod}</span>
          {order.paymentMethod === 'cod' ? (
            <span className="badge bg-yellow-100 text-yellow-700 text-xs font-semibold">
              💵 Collect ₹{order.totalAmount}
            </span>
          ) : (
            <span className="badge bg-green-100 text-green-700 text-xs font-semibold">✅ Prepaid</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 pb-6">
        {order.deliveryStatus === 'picked_up' && (
          <button
            onClick={() => updateStatusMutation.mutate('out_for_delivery')}
            disabled={updateStatusMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {updateStatusMutation.isPending
              ? <Loader2 size={16} className="animate-spin" />
              : <Navigation size={16} />}
            Start Delivery
          </button>
        )}
        {order.deliveryStatus === 'out_for_delivery' && (
          <button
            onClick={() => updateStatusMutation.mutate('delivered')}
            disabled={updateStatusMutation.isPending}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {updateStatusMutation.isPending
              ? <Loader2 size={16} className="animate-spin" />
              : <CheckCircle size={16} />}
            Mark as Delivered
          </button>
        )}
        {order.deliveryStatus === 'delivered' && (
          <div className="w-full bg-green-50 border border-green-200 text-green-700 font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm">
            <CheckCircle size={16} className="fill-green-100" /> Order Delivered Successfully
          </div>
        )}
      </div>
    </div>
  )
}
