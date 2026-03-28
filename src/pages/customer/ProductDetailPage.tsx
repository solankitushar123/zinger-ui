import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, ShoppingCart, Heart, Plus, Minus, ArrowLeft, Shield, Truck, RefreshCw, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { reviewAPI } from '../../api'
import { useProduct, useCart, useWishlist } from '../../hooks'
import { useCartStore } from '../../store/cartStore'
import ProductCard from '../../components/customer/ProductCard'
import { useProducts } from '../../hooks'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedImg, setSelectedImg] = useState(0)
  const { data: product, isLoading } = useProduct(id!)
  const { addToCart, updateQuantity, isAdding } = useCart()
  const { getItemQuantity, openCart } = useCartStore()
  const { toggleWishlist, isWishlisted } = useWishlist()
  const { data: reviewData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewAPI.getByProduct(id!).then(r => r.data),
    enabled: !!id
  })
  const { data: related } = useProducts(product ? { category: (product.category as any)._id, limit: 6 } : {})

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (!product) return <div className="text-center py-20 text-gray-500">Product not found</div>

  const qty = getItemQuantity(product._id)
  const price = product.discountedPrice || product.price

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Images */}
        <div>
          <div className="bg-gray-50 rounded-3xl overflow-hidden aspect-square mb-3">
            <img src={product.images?.[selectedImg]?.url || '/placeholder.png'} alt={product.name}
              className="w-full h-full object-cover" />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImg ? 'border-primary-500' : 'border-gray-200'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-primary-600 font-medium mb-1">{(product.category as any)?.name}</p>
            <h1 className="font-display text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            {product.brand && <p className="text-sm text-gray-400 mt-1">by {product.brand}</p>}
          </div>

          {/* Rating */}
          {product.numReviews > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} size={16} className={i < Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
              <span className="text-sm text-gray-400">({product.numReviews} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl font-bold text-gray-900">₹{price}</span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.price}</span>
                <span className="bg-green-100 text-green-700 text-sm font-bold px-2.5 py-1 rounded-xl">{product.discountPercent}% off</span>
              </>
            )}
          </div>

          <p className="text-sm text-gray-500">{product.weight || product.unit}</p>

          {/* Stock */}
          <div>
            {product.stock === 0 ? (
              <span className="text-red-500 font-semibold text-sm">Out of Stock</span>
            ) : product.stock <= 10 ? (
              <span className="text-orange-500 font-semibold text-sm">Only {product.stock} left!</span>
            ) : (
              <span className="text-green-600 font-semibold text-sm">In Stock</span>
            )}
          </div>

          {/* Cart control */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              {qty > 0 ? (
                <div className="flex items-center gap-3 bg-primary-600 rounded-2xl px-4 py-3">
                  <button onClick={() => updateQuantity({ productId: product._id, quantity: qty - 1 })}
                    className="text-white hover:opacity-80"><Minus size={18} /></button>
                  <span className="text-white font-bold text-lg w-8 text-center">{qty}</span>
                  <button onClick={() => updateQuantity({ productId: product._id, quantity: qty + 1 })}
                    className="text-white hover:opacity-80"><Plus size={18} /></button>
                </div>
              ) : (
                <button onClick={() => { addToCart({ productId: product._id, quantity: 1 }); openCart() }}
                  disabled={isAdding} className="btn-primary flex items-center gap-2 py-3 px-6 text-base">
                  <ShoppingCart size={18} /> Add to Cart
                </button>
              )}
              <button onClick={() => toggleWishlist(product._id)}
                className="p-3 border-2 border-gray-200 rounded-2xl hover:border-red-300 transition-colors">
                <Heart size={20} className={isWishlisted(product._id) ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
              </button>
            </div>
          )}

          {/* USPs */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: <Truck size={16} />, text: '30 min delivery' },
              { icon: <Shield size={16} />, text: 'Quality assured' },
              { icon: <RefreshCw size={16} />, text: '7-day returns' },
            ].map((u, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center gap-1 text-center">
                <span className="text-primary-600">{u.icon}</span>
                <span className="text-xs text-gray-600 font-medium">{u.text}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-gray-800 mb-2">About this product</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviewData?.reviews?.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
            Customer Reviews ({reviewData.total})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviewData.reviews.slice(0, 4).map((r: any) => (
              <div key={r._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                    {r.user?.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.user?.name}</p>
                    <div className="flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Star key={i} size={12} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                  {r.isVerifiedPurchase && <span className="ml-auto text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>}
                </div>
                {r.title && <p className="text-sm font-semibold text-gray-800 mb-1">{r.title}</p>}
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related products */}
      {related?.products?.length > 1 && (
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {related.products.filter((p: any) => p._id !== id).slice(0, 6).map((p: any) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
