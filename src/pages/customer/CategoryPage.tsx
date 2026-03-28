import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { categoryAPI } from '../../api'
import { useProducts } from '../../hooks'
import ProductCard from '../../components/customer/ProductCard'
import { ProductCardSkeleton } from '../../components/common/Skeletons'

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoryAPI.getAll().then(r => r.data.categories) })
  const category = categories?.find((c: any) => c.slug === slug)
  const { data, isLoading } = useProducts(category ? { category: category._id } : {})

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {category && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: category.color + '20' }}>
            {category.icon}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-sm text-gray-500">{data?.pagination?.total || 0} products</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {isLoading ? Array(10).fill(0).map((_, i) => <ProductCardSkeleton key={i} />) : data?.products?.map((p: any) => <ProductCard key={p._id} product={p} />)}
      </div>
    </div>
  )
}

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const { data, isLoading } = useProducts({ search: q })
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-xl font-bold text-gray-900 mb-2">
        {q ? `Results for "${q}"` : 'Search Products'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">{data?.pagination?.total || 0} products found</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {isLoading ? Array(10).fill(0).map((_, i) => <ProductCardSkeleton key={i} />) : data?.products?.map((p: any) => <ProductCard key={p._id} product={p} />)}
      </div>
      {!isLoading && !data?.products?.length && q && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No products found for "{q}"</p>
          <p className="text-gray-400 text-sm">Try different keywords or browse categories</p>
        </div>
      )}
    </div>
  )
}

export default CategoryPage
