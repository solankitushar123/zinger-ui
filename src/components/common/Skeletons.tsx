export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
      {/* Image area — matches ProductCard fixed height */}
      <div className="bg-gray-100 animate-pulse" style={{ height: '160px' }} />
      <div className="p-3 space-y-2 flex-1">
        <div className="h-2.5 w-12 bg-gray-100 rounded animate-pulse" />
        <div className="h-3.5 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-3.5 w-3/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 w-10 bg-gray-100 rounded animate-pulse" />
          <div className="w-8 h-8 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-2.5 w-14 bg-gray-100 rounded animate-pulse" />
    </div>
  )
}

export function BannerSkeleton() {
  return <div className="bg-gray-100 h-40 sm:h-52 rounded-2xl animate-pulse" />
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
        <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
      </div>
      <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
      <div className="flex gap-2">
        <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
        <div className="h-9 w-24 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
