import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { useCart } from '../../hooks'

export default function CartPage() {
  const { openCart } = useCartStore()
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <ShoppingCart size={56} className="text-primary-600 mx-auto mb-4" />
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Your Cart</h1>
      <p className="text-gray-500 mb-6">View and manage your cart from the cart drawer.</p>
      <button onClick={openCart} className="btn-primary">Open Cart</button>
    </div>
  )
}
