import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, MapPin, X, RefreshCw, Loader2, CheckCircle, Clock, Package, Truck } from 'lucide-react'
import { orderAPI } from '../../api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const TIMELINE = ['placed','confirmed','preparing','picked_up','out_for_delivery','delivered']

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getById(id!).then(r => r.data.order),
  })

  const cancelMutation = useMutation({
    mutationFn: () => orderAPI.cancel(id!, cancelReason),
    onSuccess: () => {
      toast.success('Order cancelled')
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      setShowCancelModal(false)
    }
  })

  const downloadInvoice = async () => {
    const res = await orderAPI.getInvoice(id!)
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${data?.orderId}.pdf`
    a.click()
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (!data) return <div className="text-center py-20 text-gray-500">Order not found</div>

  const order = data
  const currentStep = TIMELINE.indexOf(order.deliveryStatus)
  const canCancel = ['placed','confirmed'].includes(order.deliveryStatus)
  const canReturn = order.deliveryStatus === 'delivered'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-gray-900">#{order.orderId}</h1>
            <p className="text-xs text-gray-400">{format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.deliveryStatus === 'delivered' && (
            <button onClick={downloadInvoice} className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 border border-primary-200 rounded-xl px-3 py-2 hover:bg-primary-50 transition-colors">
              <Download size={15} /> Invoice
            </button>
          )}
          <Link to={`/orders/${id}/track`} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary-600 rounded-xl px-3 py-2">
            <MapPin size={15} /> Track
          </Link>
        </div>
      </div>

      {/* Progress tracker */}
      {!['cancelled','return_requested','returned'].includes(order.deliveryStatus) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Order Progress</h2>
          <div className="flex items-center gap-0">
            {TIMELINE.map((step, i) => {
              const isDone = i <= currentStep
              const isCurrent = i === currentStep
              const labels: Record<string,string> = { placed:'Placed', confirmed:'Confirmed', preparing:'Preparing', picked_up:'Picked Up', out_for_delivery:'On the Way', delivered:'Delivered' }
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isDone ? 'bg-primary-600' : 'bg-gray-200'} ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}>
                      {isDone ? <CheckCircle size={14} className="text-white" /> : <span className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-[9px] text-center text-gray-500 mt-1 leading-tight w-12">{labels[step]}</span>
                  </div>
                  {i < TIMELINE.length - 1 && <div className={`flex-1 h-1 rounded-full mx-0.5 ${i < currentStep ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-4 text-sm">Items ({order.items.length})</h2>
        <div className="space-y-3">
          {order.items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <img src={item.image || '/placeholder.png'} alt={item.name}
                className="w-14 h-14 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity} × ₹{item.discountedPrice || item.price}</p>
              </div>
              <p className="font-bold text-gray-900 text-sm flex-shrink-0">₹{item.total}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address & Payment */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-xs text-gray-400 uppercase tracking-wide mb-2">Deliver To</h3>
          <p className="font-semibold text-sm text-gray-800">{order.deliveryAddress.fullName}</p>
          <p className="text-sm text-gray-600 mt-0.5">{order.deliveryAddress.street}</p>
          <p className="text-sm text-gray-600">{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
          <p className="text-sm text-gray-600">{order.deliveryAddress.pincode}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-xs text-gray-400 uppercase tracking-wide mb-2">Payment</h3>
          <p className="font-semibold text-sm text-gray-800 capitalize">{order.paymentMethod}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {order.paymentStatus}
          </span>
          <div className="mt-3 space-y-1 text-xs text-gray-500">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{order.deliveryCharges === 0 ? 'Free' : `₹${order.deliveryCharges}`}</span></div>
            {order.couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.couponDiscount}</span></div>}
            <div className="flex justify-between font-bold text-gray-800 border-t border-gray-100 pt-1"><span>Total</span><span>₹{order.totalAmount}</span></div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {canCancel && (
          <button onClick={() => setShowCancelModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-2xl hover:bg-red-50 transition-colors text-sm">
            <X size={16} /> Cancel Order
          </button>
        )}
        {canReturn && (
          <button className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors text-sm">
            <RefreshCw size={16} /> Return Order
          </button>
        )}
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="font-display font-bold text-gray-900 mb-4">Cancel Order</h3>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)" rows={3}
              className="input resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-semibold text-gray-600">Keep Order</button>
              <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2">
                {cancelMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null} Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
