/**
 * CheckoutPage
 *
 * FIXES APPLIED:
 *  BUG-02 – Orphan orders when Razorpay modal is dismissed.
 *            Previously the order was created in DB *before* the payment UI
 *            opened.  If the user dismissed the modal, the order stayed in DB
 *            with paymentStatus:"pending" while stock had already been deducted.
 *
 *            FIX:
 *              • ondismiss handler now calls orderAPI.cancel() to clean up the
 *                orphaned order and restore stock.
 *              • A loading/cancelling state prevents double-clicks during cleanup.
 *              • The cart is also re-fetched so the user can try again.
 *
 *  BUG-12 – Address form had no frontend validation.  Users could submit empty
 *            required fields and only get feedback after the round-trip to the
 *            server (Joi error).
 *
 *            FIX: validateNewAddress() checks all required fields before the
 *            addAddressMutation is fired and shows focused toast messages.
 *
 *  BUG-12 – Wishlist heart silently did nothing for guests — see ProductCard.
 *            (Fixed in ProductCard.tsx — not this file.)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MapPin, Plus, Tag, CreditCard, Banknote, Smartphone,
  Loader2, CheckCircle, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '../../store/cartStore'
import { useCart } from '../../hooks'
import { orderAPI, paymentAPI, addressAPI } from '../../api'
import type { Address } from '../../types'

declare global { interface Window { Razorpay: any } }

const PAYMENT_METHODS = [
  {
    id:       'razorpay',
    label:    'Razorpay',
    sublabel: 'Credit / Debit / UPI / Netbanking',
    icon:     <Smartphone size={20} className="text-blue-600" />,
  },
  {
    id:       'cod',
    label:    'Cash on Delivery',
    sublabel: 'Pay when delivered',
    icon:     <Banknote size={20} className="text-green-600" />,
  },
]

const EMPTY_ADDRESS = {
  label:    'Home',
  fullName: '',
  phone:    '',
  street:   '',
  city:     '',
  state:    '',
  pincode:  '',
  landmark: '',
}

// ── Front-end address validation ──────────────────────────────────────────────
const PHONE_RE   = /^[6-9]\d{9}$/
const PINCODE_RE = /^\d{6}$/

function validateNewAddress(addr: typeof EMPTY_ADDRESS): string | null {
  if (!addr.fullName.trim())             return 'Full name is required'
  if (!PHONE_RE.test(addr.phone))        return 'Enter a valid 10-digit Indian mobile number'
  if (!addr.street.trim())               return 'Street / Flat / Area is required'
  if (!addr.city.trim())                 return 'City is required'
  if (!addr.state.trim())                return 'State is required'
  if (!PINCODE_RE.test(addr.pincode))    return 'Enter a valid 6-digit pincode'
  return null
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate      = useNavigate()
  const queryClient   = useQueryClient()
  const { cart, totals } = useCartStore()
  const { applyCoupon, isApplyingCoupon, removeCoupon } = useCart()

  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [paymentMethod,   setPaymentMethod]   = useState<string>('razorpay')
  const [couponCode,      setCouponCode]      = useState('')
  const [showAddAddress,  setShowAddAddress]  = useState(false)
  const [newAddress,      setNewAddress]      = useState({ ...EMPTY_ADDRESS })
  // BUG-02 FIX: track whether we are cancelling an orphaned order
  const [isCancellingOrphan, setIsCancellingOrphan] = useState(false)

  // ── Load addresses ──────────────────────────────────────────────────────────
  const { data: addressData } = useQuery({
    queryKey: ['addresses'],
    queryFn:  () => addressAPI.getAll().then((r) => r.data.addresses),
  })
  const addresses: Address[] = addressData || []

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const def = addresses.find((a: Address) => a.isDefault) || addresses[0]
      if (def) setSelectedAddress(def._id)
    }
  }, [addresses])

  // ── Add address mutation ────────────────────────────────────────────────────
  const addAddressMutation = useMutation({
    mutationFn: () => addressAPI.create(newAddress as any),
    onSuccess:  (res) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      const added = res.data.addresses[res.data.addresses.length - 1]
      setSelectedAddress(added._id)
      setShowAddAddress(false)
      setNewAddress({ ...EMPTY_ADDRESS })
      toast.success('Address added!')
    },
  })

  // ── Place order + payment mutation ──────────────────────────────────────────
  const placeOrderMutation = useMutation({
    mutationFn: () => orderAPI.create({ addressId: selectedAddress, paymentMethod }),
    onSuccess:  async (res) => {
      const order = res.data.order

      // Invalidate cart so item counts update
      queryClient.invalidateQueries({ queryKey: ['cart'] })

      // ── COD ────────────────────────────────────────────────────────────────
      if (paymentMethod === 'cod') {
        await paymentAPI.confirmCOD(order._id)
        navigate(`/payment/success?orderId=${order._id}`)
        return
      }

      // ── Razorpay ───────────────────────────────────────────────────────────
      if (paymentMethod === 'razorpay') {
        const rzRes = await paymentAPI.createRazorpayOrder(order._id)
        const { razorpayOrderId, amount, currency, key } = rzRes.data

        const rzp = new window.Razorpay({
          key,
          amount,
          currency,
          order_id:    razorpayOrderId,
          name:        'ZINGER',
          description: `Order #${order.orderId}`,
          prefill:     { name: '', email: '', contact: '' },
          theme:       { color: '#00b14f' },

          handler: async (response: any) => {
            await paymentAPI.verifyRazorpay({ ...response, orderId: order._id })
            navigate(`/payment/success?orderId=${order._id}`)
          },

          // BUG-02 FIX: cancel the orphaned order when the user dismisses the modal.
          // The stock was already deducted; the cancel endpoint restores it.
          modal: {
            ondismiss: async () => {
              toast.error('Payment cancelled')
              setIsCancellingOrphan(true)
              try {
                await orderAPI.cancel(order._id, 'Payment cancelled by user')
                queryClient.invalidateQueries({ queryKey: ['cart'] })
                toast('Your cart items have been restored.', { icon: '🛒' })
              } catch {
                // If cancellation fails the order stays in DB; admin can clean it up.
                toast.error(
                  'Could not restore your cart automatically. Please contact support if items are missing.',
                  { duration: 6000 }
                )
              } finally {
                setIsCancellingOrphan(false)
              }
            },
          },
        })
        rzp.open()
      }
    },
    onError: (err: any) => {
      // Axios interceptor already shows a toast; this prevents a silent failure.
      console.error('Place order error:', err)
    },
  })

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddAddress = () => {
    // BUG-12 FIX: validate address fields before submitting
    const error = validateNewAddress(newAddress)
    if (error) {
      toast.error(error)
      return
    }
    addAddressMutation.mutate()
  }

  const handlePlaceOrder = () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return }
    if (!cart?.items?.length) { toast.error('Your cart is empty'); return }
    placeOrderMutation.mutate()
  }

  const isProcessing = placeOrderMutation.isPending || isCancellingOrphan

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-primary-600" /> Delivery Address
              </h2>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-sm text-primary-600 font-semibold flex items-center gap-1"
              >
                <Plus size={16} /> Add New
              </button>
            </div>

            {/* Add address form */}
            {showAddAddress && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-800">New Address</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input text-sm col-span-2"
                    placeholder="Full Name *"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                  />
                  <input
                    className="input text-sm"
                    placeholder="Phone (10 digits) *"
                    inputMode="numeric"
                    maxLength={10}
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, '') })}
                  />
                  <select
                    className="input text-sm"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  >
                    {['Home', 'Work', 'Other'].map((l) => <option key={l}>{l}</option>)}
                  </select>
                  <input
                    className="input text-sm col-span-2"
                    placeholder="Street / Flat / Area *"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  />
                  <input
                    className="input text-sm"
                    placeholder="City *"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  />
                  <input
                    className="input text-sm"
                    placeholder="State *"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  />
                  <input
                    className="input text-sm"
                    placeholder="Pincode (6 digits) *"
                    inputMode="numeric"
                    maxLength={6}
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })}
                  />
                  <input
                    className="input text-sm"
                    placeholder="Landmark (optional)"
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddAddress}
                    disabled={addAddressMutation.isPending}
                    className="btn-primary text-sm py-2"
                  >
                    {addAddressMutation.isPending
                      ? <Loader2 size={14} className="animate-spin" />
                      : 'Save Address'}
                  </button>
                  <button
                    onClick={() => { setShowAddAddress(false); setNewAddress({ ...EMPTY_ADDRESS }) }}
                    className="text-sm text-gray-500 px-3 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Address cards */}
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr._id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedAddress === addr._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr._id}
                    checked={selectedAddress === addr._id}
                    onChange={() => setSelectedAddress(addr._id)}
                    className="mt-1 accent-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-800">{addr.fullName}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                    <p className="text-sm text-gray-600">{addr.phone}</p>
                    {addr.landmark && (
                      <p className="text-xs text-gray-400 mt-1">Near: {addr.landmark}</p>
                    )}
                  </div>
                </label>
              ))}
              {addresses.length === 0 && !showAddAddress && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No addresses saved. Add one above.
                </p>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-display font-bold text-gray-900 flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-primary-600" /> Payment Method
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === method.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                    className="accent-primary-600"
                  />
                  {method.icon}
                  <div>
                    <p className="text-sm font-bold text-gray-800">{method.label}</p>
                    <p className="text-xs text-gray-500">{method.sublabel}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Order Summary ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
            <h2 className="font-display font-bold text-gray-900 mb-4">Order Summary</h2>

            {/* Items preview */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {cart?.items?.map((item: any, i: number) => {
                const product = item.product
                const name  = typeof product === 'string' ? 'Product' : product.name
                const img   = typeof product === 'string' ? '' : product.images?.[0]?.url
                const price = item.discountedPrice || item.price
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <img
                      src={img || '/placeholder.png'}
                      alt={name}
                      className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{name}</p>
                      <p className="text-xs text-gray-500">×{item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold text-gray-800">₹{price * item.quantity}</p>
                  </div>
                )
              })}
            </div>

            {/* Coupon */}
            <div className="mb-4">
              {cart?.coupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      {typeof cart.coupon === 'object' ? cart.coupon.code : 'Coupon'} applied
                    </span>
                  </div>
                  <button
                    onClick={() => removeCoupon()}
                    className="text-xs text-red-500 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="input text-sm flex-1 py-2"
                  />
                  <button
                    onClick={() => applyCoupon(couponCode)}
                    disabled={!couponCode || isApplyingCoupon}
                    className="btn-secondary text-sm px-3 py-2 flex-shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{totals?.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={totals?.deliveryCharges === 0 ? 'text-green-600 font-medium' : ''}>
                  {totals?.deliveryCharges === 0 ? 'FREE' : `₹${totals?.deliveryCharges}`}
                </span>
              </div>
              {(totals?.couponDiscount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{totals?.couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax (5%)</span>
                <span>₹{totals?.tax}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>₹{totals?.totalAmount}</span>
              </div>
            </div>

            {/* BUG-02: isCancellingOrphan state shown to user */}
            {isCancellingOrphan && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                <Loader2 size={13} className="animate-spin flex-shrink-0" />
                Restoring your cart…
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing || !selectedAddress}
              className="btn-primary w-full mt-5 flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-60"
            >
              {isProcessing
                ? <><Loader2 size={18} className="animate-spin" /> Processing…</>
                : <><CheckCircle size={18} /> Place Order · ₹{totals?.totalAmount}</>
              }
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              By placing this order you agree to our Terms &amp; Conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
