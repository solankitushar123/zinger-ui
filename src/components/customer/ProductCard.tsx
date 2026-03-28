/**
 * ProductCard
 *
 * FIXES APPLIED:
 *  BUG-12 – Clicking the wishlist heart when not authenticated did nothing
 *            (no toast, no redirect).  Users had no idea why the click failed.
 *
 *            FIX: Show an informative toast and redirect to /login when a guest
 *            tries to wishlist a product.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Plus, Minus, Star } from 'lucide-react'
import type { Product } from '../../types'
import { useCart, useWishlist } from '../../hooks'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
  size?: 'sm' | 'md' | 'lg'
}

// Inline SVG placeholder — no external file dependency
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Crect x='60' y='55' width='80' height='60' rx='6' fill='%23e5e7eb'/%3E%3Ccircle cx='80' cy='75' r='10' fill='%23d1d5db'/%3E%3Cpolygon points='60,115 90,80 115,100 135,82 160,115' fill='%23d1d5db'/%3E%3Crect x='50' y='135' width='100' height='8' rx='4' fill='%23e5e7eb'/%3E%3C/svg%3E`

export default function ProductCard({ product }: ProductCardProps) {
  const [imgError,  setImgError]  = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const navigate = useNavigate()

  const { addToCart, updateQuantity, isAdding } = useCart()
  const { toggleWishlist, isWishlisted }         = useWishlist()
  const { getItemQuantity, openCart }            = useCartStore()
  const { isAuthenticated }                      = useAuthStore()

  const quantity  = getItemQuantity(product._id)
  const wishlisted = isWishlisted(product._id)
  const price     = product.discountedPrice || product.price
  const imgSrc    = imgError || !product.images?.[0]?.url
    ? PLACEHOLDER_SVG
    : product.images[0].url

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({ productId: product._id, quantity: 1 })
    openCart()
  }

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity({ productId: product._id, quantity: quantity + 1 })
  }

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity({ productId: product._id, quantity: quantity - 1 })
  }

  // BUG-12 FIX: show a toast and redirect guests to login instead of silently doing nothing.
  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast('Please log in to save items to your wishlist', { icon: '💛' })
      navigate('/login')
      return
    }
    toggleWishlist(product._id)
  }

  return (
    <Link
      to={`/products/${product._id}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* ── Image area ─────────────────────────────────── */}
      <div className="relative bg-gray-50 overflow-hidden" style={{ height: '160px' }}>
        {/* Loading shimmer */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        <img
          src={imgSrc}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true) }}
          className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.2s ease, transform 0.3s ease' }}
          loading="lazy"
        />

        {/* Discount badge */}
        {product.discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-tight">
            {product.discountPercent}% off
          </span>
        )}

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
              Out of Stock
            </span>
          </div>
        )}

        {/* Low stock badge */}
        {product.stock > 0 && product.stock <= 10 && (
          <span className="absolute bottom-2 left-2 bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-tight">
            Only {product.stock} left
          </span>
        )}

        {/* Wishlist button — always visible on mobile, hover on desktop */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
        >
          <Heart
            size={13}
            className={wishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'}
          />
        </button>
      </div>

      {/* ── Info ───────────────────────────────────────── */}
      <div className="p-3 flex flex-col flex-1 min-h-0">
        {/* Weight / unit */}
        <p className="text-[11px] text-gray-400 font-medium mb-0.5 leading-none">
          {product.weight || product.unit}
        </p>

        {/* Product name */}
        <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 flex-1 mb-1.5">
          {product.name}
        </p>

        {/* Rating */}
        {product.numReviews > 0 && (
          <div className="flex items-center gap-0.5 mb-1.5">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] text-gray-500 font-medium">
              {product.rating}
              <span className="text-gray-400 font-normal ml-0.5">({product.numReviews})</span>
            </span>
          </div>
        )}

        {/* Price + Cart button */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          {/* Price */}
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-gray-900">₹{price}</span>
            {product.discountPercent > 0 && (
              <span className="text-[11px] text-gray-400 line-through">₹{product.price}</span>
            )}
          </div>

          {/* Cart control */}
          {product.stock > 0 ? (
            quantity > 0 ? (
              <div className="flex items-center bg-green-600 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                <button
                  onClick={handleDecrease}
                  className="w-7 h-7 flex items-center justify-center text-white hover:bg-green-700 active:bg-green-800 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={13} strokeWidth={2.5} />
                </button>
                <span className="w-6 text-center text-sm font-bold text-white tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrease}
                  className="w-7 h-7 flex items-center justify-center text-white hover:bg-green-700 active:bg-green-800 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="flex-shrink-0 w-8 h-8 bg-white border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 disabled:opacity-50 shadow-sm"
                title="Add to cart"
                aria-label="Add to cart"
              >
                <Plus size={17} strokeWidth={2.5} />
              </button>
            )
          ) : null}
        </div>
      </div>
    </Link>
  )
}
