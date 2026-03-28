import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, ShoppingBag, Plus, Minus, Trash2, Tag, ChevronRight } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { useCart } from '../../hooks'
import type { CartItem } from '../../types'

export default function CartDrawer() {
  const { isOpen, closeCart, cart, totals } = useCartStore()
  const { updateQuantity, removeFromCart } = useCart()

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-50 cart-overlay"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
              <ShoppingBag size={18} className="text-primary-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-900">My Cart</h2>
              <p className="text-xs text-gray-500">{cart?.items.length || 0} item{cart?.items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Delivery badge */}
        {(totals?.subtotal || 0) > 0 && (
          <div className={`mx-4 mt-3 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
            (totals?.subtotal || 0) >= 199
              ? 'bg-green-50 text-green-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            {(totals?.subtotal || 0) >= 199 ? (
              '🎉 You got FREE delivery!'
            ) : (
              `Add ₹${199 - (totals?.subtotal || 0)} more for FREE delivery`
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {!cart?.items?.length ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={36} className="text-gray-300" />
              </div>
              <h3 className="font-display font-bold text-gray-700 mb-1">Your cart is empty</h3>
              <p className="text-sm text-gray-400 mb-6">Add items to get started</p>
              <button onClick={closeCart} className="btn-primary">
                Start Shopping
              </button>
            </div>
          ) : (
            cart.items.map((item: CartItem) => {
              const product = item.product
              const productId = typeof product === 'string' ? product : product._id
              const price = item.discountedPrice || item.price

              return (
                <div key={productId} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                  <img
                    src={typeof product !== 'string' ? product.images?.[0]?.url || '/placeholder.png' : '/placeholder.png'}
                    alt={typeof product !== 'string' ? product.name : ''}
                    className="w-16 h-16 object-cover rounded-xl bg-white flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {typeof product !== 'string' ? product.name : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {typeof product !== 'string' ? product.weight || product.unit : ''}
                    </p>
                    <p className="text-sm font-bold text-primary-600 mt-1">₹{price}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-white border border-primary-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity({ productId, quantity: item.quantity - 1 })}
                        className="w-8 h-8 flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity({ productId, quantity: item.quantity + 1 })}
                        className="w-8 h-8 flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">₹{price * item.quantity}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {cart?.items?.length ? (
          <div className="border-t border-gray-100 px-4 py-4 space-y-3 bg-white">
            {/* Coupon */}
            {cart.coupon ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <Tag size={14} className="text-green-600" />
                <span className="text-sm text-green-700 font-medium flex-1">
                  {typeof cart.coupon === 'object' ? cart.coupon.code : 'Coupon'} applied!
                </span>
                <span className="text-sm font-bold text-green-600">-₹{totals?.couponDiscount}</span>
              </div>
            ) : (
              <Link to="/checkout" onClick={closeCart}
                className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-3 py-2 hover:border-primary-300 transition-colors">
                <Tag size={14} className="text-gray-400" />
                <span className="text-sm text-gray-500 flex-1">Have a coupon? Apply at checkout</span>
                <ChevronRight size={14} className="text-gray-300" />
              </Link>
            )}

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>₹{totals?.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery</span>
                <span className={totals?.deliveryCharges === 0 ? 'text-green-600 font-medium' : ''}>
                  {totals?.deliveryCharges === 0 ? 'FREE' : `₹${totals?.deliveryCharges}`}
                </span>
              </div>
              {(totals?.couponDiscount || 0) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Coupon Discount</span><span>-₹{totals?.couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (5%)</span><span>₹{totals?.tax}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1.5 border-t border-gray-100">
                <span>Total</span><span>₹{totals?.totalAmount}</span>
              </div>
            </div>

            <Link to="/checkout" onClick={closeCart}
              className="btn-primary w-full flex items-center justify-between">
              <span>Proceed to Checkout</span>
              <span>₹{totals?.totalAmount}</span>
            </Link>
          </div>
        ) : null}
      </div>
    </>
  )
}
