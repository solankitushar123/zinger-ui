import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { orderAPI } from '../../api'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [confettiDone, setConfettiDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setConfettiDone(true), 3000)
    return () => clearTimeout(t)
  }, [])

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderAPI.getById(orderId!).then(r => r.data.order),
    enabled: !!orderId,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Animated check */}
        <div className="relative inline-flex mb-6">
          <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center shadow-green animate-bounce-in">
            <CheckCircle size={48} className="text-white" strokeWidth={2} />
          </div>
          {!confettiDone && (
            <div className="absolute inset-0 rounded-full border-4 border-primary-400 animate-ping opacity-30" />
          )}
        </div>

        <h1 className="font-display font-black text-3xl text-gray-900 mb-2">Order Placed! 🎉</h1>
        <p className="text-gray-500 mb-2">Your order has been confirmed.</p>

        {order && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-800">#{order.orderId}</p>
              <span className="badge bg-primary-100 text-primary-700 text-xs">Confirmed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Package size={14} className="text-primary-500" />
              {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} ordered
            </div>
            <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-100">
              <span className="text-gray-500">Total paid</span>
              <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
            </div>
            {order.paymentMethod === 'cod' && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-2">
                💵 Pay ₹{order.totalAmount} when delivered
              </p>
            )}
          </div>
        )}

        {/* Delivery estimate */}
        <div className="bg-primary-600 rounded-2xl p-4 mb-6 flex items-center gap-3 text-left">
          <div className="text-3xl">⚡</div>
          <div>
            <p className="font-display font-bold text-white text-base">Estimated delivery: 10–30 min</p>
            <p className="text-primary-200 text-xs mt-0.5">We're already picking your order!</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {orderId && (
            <Link to={`/orders/${orderId}`}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5">
              <Package size={17} /> Track Order
            </Link>
          )}
          <Link to="/" className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3.5">
            <Home size={17} /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
