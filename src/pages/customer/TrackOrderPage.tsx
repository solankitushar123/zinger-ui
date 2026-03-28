import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Phone, Loader2, CheckCircle, Clock, Package, Truck, Navigation } from 'lucide-react'
import { orderAPI } from '../../api'
import { useEffect, useState } from 'react'
import { useSocket } from '../../hooks/useSocket'

const STEPS = ['placed','confirmed','preparing','picked_up','out_for_delivery','delivered']
const STEP_LABELS: Record<string,string> = {
  placed:'Order Placed', confirmed:'Confirmed', preparing:'Preparing',
  picked_up:'Picked Up', out_for_delivery:'Out for Delivery', delivered:'Delivered',
}
const STEP_ICONS: Record<string, React.ReactNode> = {
  placed: <Package size={14} />,
  confirmed: <CheckCircle size={14} />,
  preparing: <Clock size={14} />,
  picked_up: <Package size={14} />,
  out_for_delivery: <Truck size={14} />,
  delivered: <CheckCircle size={14} />,
}

export default function TrackOrderPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { trackOrder } = useSocket()
  const [partnerLocation, setPartnerLocation] = useState<{latitude: number; longitude: number} | null>(null)
  const [otpNotification, setOtpNotification] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getById(id!).then(r => r.data.order),
    staleTime: 10000,
  })

  // Subscribe to live updates for this order
  useEffect(() => {
    if (!id) return
    const unsubscribe = trackOrder(id, (data: any) => {
      if (data.status) {
        qc.invalidateQueries({ queryKey: ['order', id] })
        qc.invalidateQueries({ queryKey: ['orders'] })
      }
      if (data.latitude) {
        setPartnerLocation({ latitude: data.latitude, longitude: data.longitude })
      }
      if (data.message?.includes('OTP')) {
        setOtpNotification(true)
        setTimeout(() => setOtpNotification(false), 10000)
      }
    })
    return unsubscribe
  }, [id, trackOrder, qc])

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>

  const currentStep = STEPS.indexOf(order.deliveryStatus)
  const isCancelled = order.deliveryStatus === 'cancelled'
  const partner = order.deliveryPartner as any

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/orders/${id}`} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-gray-900">Live Tracking</h1>
          <p className="text-xs text-gray-400">#{order.orderId}</p>
        </div>
      </div>

      {/* OTP notification */}
      {otpNotification && (
        <div className="bg-primary-600 text-white rounded-2xl p-4 flex items-center gap-3 animate-bounce-in">
          <span className="text-2xl">📱</span>
          <div>
            <p className="font-bold text-sm">OTP Sent!</p>
            <p className="text-primary-100 text-xs">Share the OTP with your delivery partner to confirm delivery</p>
          </div>
        </div>
      )}

      {/* Progress tracker */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Order Progress</h2>
            {order.estimatedDeliveryTime && order.deliveryStatus !== 'delivered' && (
              <span className="text-xs text-primary-600 font-semibold bg-primary-50 px-2.5 py-1 rounded-full">
                ~{Math.max(0, Math.round((new Date(order.estimatedDeliveryTime).getTime() - Date.now()) / 60000))} min left
              </span>
            )}
          </div>

          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const isDone    = !isCancelled && i <= currentStep
              const isCurrent = i === currentStep && !isCancelled
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isDone
                        ? isCurrent ? 'bg-primary-600 ring-4 ring-primary-100 shadow-green' : 'bg-primary-600'
                        : 'bg-gray-200'
                    }`}>
                      <span className={isDone ? 'text-white' : 'text-gray-400'}>{STEP_ICONS[step]}</span>
                    </div>
                    <span className={`text-[9px] text-center leading-tight w-14 ${isDone ? 'text-primary-700 font-semibold' : 'text-gray-400'}`}>
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 rounded-full mx-0.5 mb-5 transition-all ${i < currentStep ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-red-600 font-bold">Order Cancelled</p>
          {order.cancelReason && <p className="text-red-400 text-sm mt-1">{order.cancelReason}</p>}
        </div>
      )}

      {/* Live map placeholder / location */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
        <div className="relative bg-gradient-to-br from-green-50 to-emerald-100 h-52 flex items-center justify-center">
          {partnerLocation ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-green animate-pulse-green">
                <Navigation size={24} className="text-white" />
              </div>
              <p className="text-sm font-bold text-gray-800">Partner is on the way!</p>
              <p className="text-xs text-gray-500 mt-1">
                Location: {partnerLocation.latitude.toFixed(4)}, {partnerLocation.longitude.toFixed(4)}
              </p>
              <a
                href={`https://maps.google.com/?q=${partnerLocation.latitude},${partnerLocation.longitude}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-primary-600 font-semibold border border-primary-200 px-3 py-1.5 rounded-xl bg-white"
              >
                <MapPin size={12} /> Open in Google Maps
              </a>
            </div>
          ) : (
            <div className="text-center">
              <MapPin size={32} className="text-primary-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600">
                {order.deliveryStatus === 'out_for_delivery'
                  ? 'Waiting for partner location...'
                  : 'Live tracking starts when order is picked up'}
              </p>
            </div>
          )}

          {/* Decorative dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            {Array(20).fill(0).map((_, i) => (
              <div key={i} className="absolute w-1.5 h-1.5 bg-primary-400 rounded-full"
                style={{ left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%` }} />
            ))}
          </div>
        </div>

        <div className="p-4 bg-primary-50 border-t border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-primary-800 capitalize">
                {order.deliveryStatus?.replace(/_/g, ' ')}
              </p>
              {order.deliveryStatus === 'out_for_delivery' && (
                <p className="text-xs text-primary-600 mt-0.5">🔴 Live — updates automatically</p>
              )}
            </div>
            {order.deliveryStatus === 'delivered' && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">✓ Delivered</span>
            )}
          </div>
        </div>
      </div>

      {/* Delivery partner card */}
      {partner && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Your Delivery Partner</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
                {partner.name?.[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900">{partner.name}</p>
                <p className="text-xs text-gray-400">{partner.phone}</p>
                {partner.vehicleType && (
                  <p className="text-xs text-primary-600 font-medium capitalize">{partner.vehicleType} • {partner.vehicleNumber}</p>
                )}
              </div>
            </div>
            <a href={`tel:${partner.phone}`}
              className="w-11 h-11 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center shadow-green transition-colors">
              <Phone size={17} className="text-white" />
            </a>
          </div>
        </div>
      )}

      {/* Status history */}
      {order.statusHistory?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Order Timeline</h3>
          <div className="space-y-3">
            {[...order.statusHistory].reverse().map((h: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-primary-600' : 'bg-gray-300'}`} />
                <div>
                  <p className={`text-sm font-semibold capitalize ${i === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                    {h.status?.replace(/_/g, ' ')}
                  </p>
                  {h.note && <p className="text-xs text-gray-400">{h.note}</p>}
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    {new Date(h.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
