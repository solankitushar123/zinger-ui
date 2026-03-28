import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, Clock } from 'lucide-react'
import { orderAPI } from '../../api'
import { format } from 'date-fns'
import { OrderCardSkeleton } from '../../components/common/Skeletons'

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  picked_up: 'bg-orange-100 text-orange-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  return_requested: 'bg-pink-100 text-pink-700',
  returned: 'bg-gray-100 text-gray-700',
}

const STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  returned: 'Returned',
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderAPI.getAll().then(r => r.data),
  })

  const orders = data?.orders || []

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Package size={24} className="text-primary-600" /> My Orders
      </h1>

      {isLoading ? (
        <div className="space-y-4">{Array(3).fill(0).map((_, i) => <OrderCardSkeleton key={i} />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={56} className="text-gray-200 mx-auto mb-4" />
          <h2 className="font-display font-bold text-gray-600 mb-2">No orders yet</h2>
          <p className="text-gray-400 text-sm mb-6">Start shopping to see your orders here</p>
          <Link to="/" className="btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">#{order.orderId}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={12} /> {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
                <span className={`badge ${STATUS_COLORS[order.deliveryStatus] || 'bg-gray-100 text-gray-600'} text-xs font-semibold px-2.5 py-1`}>
                  {STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus}
                </span>
              </div>

              {/* Item thumbnails */}
              <div className="flex gap-2 mb-3">
                {order.items.slice(0, 4).map((item: any, i: number) => (
                  <div key={i} className="relative">
                    <img src={item.image || '/placeholder.png'} alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
                    {i === 3 && order.items.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xs font-bold">+{order.items.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                </div>
                <Link to={`/orders/${order._id}`}
                  className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:gap-2 transition-all">
                  Details <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
