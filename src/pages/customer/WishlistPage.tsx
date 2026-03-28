import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { wishlistAPI } from '../../api'
import ProductCard from '../../components/customer/ProductCard'
import { ProductCardSkeleton } from '../../components/common/Skeletons'

export default function WishlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistAPI.get().then(r => r.data.wishlist),
  })
  const products = data?.products || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Heart size={24} className="text-red-500 fill-red-500" /> My Wishlist
      </h1>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={56} className="text-gray-200 mx-auto mb-4" />
          <h2 className="font-display font-bold text-gray-600 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-400 text-sm mb-6">Save products you love</p>
          <Link to="/" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {products.map((p: any) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  )
}
