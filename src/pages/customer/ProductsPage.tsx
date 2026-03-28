import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { categoryAPI } from '../../api'
import { useProducts } from '../../hooks'
import ProductCard from '../../components/customer/ProductCard'
import { ProductCardSkeleton } from '../../components/common/Skeletons'

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: '-rating', label: 'Top Rated' },
  { value: 'discountedPrice', label: 'Price: Low to High' },
  { value: '-discountedPrice', label: 'Price: High to Low' },
  { value: '-discountPercent', label: 'Best Discount' },
]

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || '-createdAt'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const rating = searchParams.get('rating') || ''
  const inStock = searchParams.get('inStock') || ''
  const page = Number(searchParams.get('page') || 1)

  const { data, isLoading } = useProducts({ category, sort, minPrice, maxPrice, rating, inStock, page, limit: 24 })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoryAPI.getAll().then(r => r.data.categories) })

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    setSearchParams(params)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className={`md:w-56 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-5 sticky top-20">
            <h3 className="font-display font-bold text-gray-900">Filters</h3>

            {/* Category */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Category</p>
              <div className="space-y-1">
                <button onClick={() => setParam('category', '')}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${!category ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  All Categories
                </button>
                {categories?.map((cat: any) => (
                  <button key={cat._id} onClick={() => setParam('category', cat._id)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center gap-2 ${category === cat._id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span>{cat.icon}</span> {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Price Range</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minPrice}
                  onChange={(e) => setParam('minPrice', e.target.value)}
                  className="input text-sm py-2 px-3" />
                <input type="number" placeholder="Max" value={maxPrice}
                  onChange={(e) => setParam('maxPrice', e.target.value)}
                  className="input text-sm py-2 px-3" />
              </div>
            </div>

            {/* Rating */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Min Rating</p>
              <div className="space-y-1">
                {[4, 3, 2].map((r) => (
                  <button key={r} onClick={() => setParam('rating', rating === String(r) ? '' : String(r))}
                    className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${rating === String(r) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {'⭐'.repeat(r)} & above
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={inStock === 'true'} onChange={(e) => setParam('inStock', e.target.checked ? 'true' : '')}
                className="rounded text-primary-600" />
              <span className="text-sm text-gray-700">In Stock Only</span>
            </label>

            <button onClick={() => setSearchParams({})}
              className="w-full text-sm text-red-500 hover:text-red-600 font-medium py-2">
              Clear All Filters
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-2 text-sm font-medium border border-gray-200 rounded-xl px-3 py-2">
                <Filter size={16} /> Filters
              </button>
              <p className="text-sm text-gray-500">
                {isLoading ? '...' : `${data?.pagination?.total || 0} products`}
              </p>
            </div>
            <select value={sort} onChange={(e) => setParam('sort', e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {isLoading
              ? Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : data?.products?.map((p: any) => <ProductCard key={p._id} product={p} />)
            }
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setParam('page', String(p))}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${page === p ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
