import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight, Zap, Truck, ShieldCheck, Clock, Tag, ArrowRight } from 'lucide-react'
import { bannerAPI, categoryAPI, productAPI } from '../../api'
import { useTrendingProducts, useFeaturedProducts, useAIRecommendations } from '../../hooks'
import ProductCard from '../../components/customer/ProductCard'
import { ProductCardSkeleton, CategorySkeleton, BannerSkeleton } from '../../components/common/Skeletons'
import { useState, useEffect } from 'react'

const STALE_5M = 1000 * 60 * 5

// ─── Banner carousel ─────────────────────────────────────────────────────────
function HeroBanners() {
  const { data, isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => bannerAPI.getAll().then(r => r.data.banners),
    staleTime: STALE_5M,
  })
  const [active, setActive] = useState(0)
  const banners = data || []

  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(() => setActive(p => (p + 1) % banners.length), 4500)
    return () => clearInterval(t)
  }, [banners.length])

  if (isLoading) return <BannerSkeleton />
  if (!banners.length) return null

  const CONFIGS = [
    { from: 'from-emerald-600', to: 'to-teal-500',   emoji: '🥑', tag: 'FRESH PICKS' },
    { from: 'from-orange-500',  to: 'to-yellow-400', emoji: '🛒', tag: 'HOT DEALS' },
    { from: 'from-blue-600',    to: 'to-cyan-500',   emoji: '❄️', tag: 'FROZEN FOOD' },
    { from: 'from-purple-600',  to: 'to-pink-500',   emoji: '🎉', tag: 'SPECIAL OFFER' },
  ]

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-card-md">
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${active * 100}%)` }}>
        {banners.map((banner: any, i: number) => {
          const cfg = CONFIGS[i % CONFIGS.length]
          return (
            <div key={banner._id} className={`min-w-full bg-gradient-to-br ${cfg.from} ${cfg.to}`}>
              {banner.image?.url ? (
                <img src={banner.image.url} alt={banner.title} className="w-full h-44 sm:h-56 object-cover" />
              ) : (
                <div className="h-44 sm:h-56 px-8 flex items-center justify-between">
                  <div className="flex-1">
                    <span className="inline-block bg-white/20 text-white text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full mb-3">{cfg.tag}</span>
                    <h2 className="text-white text-2xl sm:text-3xl font-display font-black leading-tight mb-2 max-w-xs">{banner.title}</h2>
                    {banner.subtitle && <p className="text-white/80 text-sm mb-4">{banner.subtitle}</p>}
                    <Link to="/products" className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:shadow-lg transition-all">
                      Shop Now <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="hidden sm:block text-7xl opacity-90 animate-float">{cfg.emoji}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {banners.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_: any, i: number) => (
              <button key={i} onClick={() => setActive(i)}
                className={`rounded-full transition-all duration-300 ${i === active ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
            ))}
          </div>
          <button onClick={() => setActive(p => (p - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur-sm hover:bg-white/50 rounded-full flex items-center justify-center text-white font-bold text-lg">‹</button>
          <button onClick={() => setActive(p => (p + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur-sm hover:bg-white/50 rounded-full flex items-center justify-center text-white font-bold text-lg">›</button>
        </>
      )}
    </div>
  )
}

// ─── Category grid (single query) ─────────────────────────────────────────────
function CategoryGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then(r => r.data.categories),
    staleTime: STALE_5M,
  })
  if (isLoading) return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 sm:gap-3">
      {Array(10).fill(0).map((_, i) => <CategorySkeleton key={i} />)}
    </div>
  )
  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 sm:gap-3">
      {(data || []).map((cat: any) => (
        <Link key={cat._id} to={`/category/${cat.slug}`} className="flex flex-col items-center gap-1.5 group">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl md:text-3xl transition-all duration-200 group-hover:scale-110 group-hover:shadow-md"
            style={{ backgroundColor: cat.color + '18', border: `2px solid ${cat.color}25` }}>
            {cat.icon || '🛒'}
          </div>
          <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 text-center leading-tight">{cat.name}</span>
        </Link>
      ))}
    </div>
  )
}

// ─── Product section ──────────────────────────────────────────────────────────
function ProductSection({ title, emoji, products, isLoading, viewAllLink = '/products' }: {
  title: string; emoji?: string; products: any[]; isLoading: boolean; viewAllLink?: string
}) {
  if (!isLoading && !products?.length) return null
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">{emoji} {title}</h2>
        <Link to={viewAllLink} className="text-sm font-semibold text-primary-600 flex items-center gap-1 hover:gap-2 transition-all">
          See all <ChevronRight size={15} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
          : products?.slice(0, 12).map((p: any) => <ProductCard key={p._id} product={p} />)
        }
      </div>
    </section>
  )
}

// ─── USP bar ──────────────────────────────────────────────────────────────────
function USPBar() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {[
        { icon: <Zap size={15} className="text-yellow-500" />,      title: '10-Min Delivery' },
        { icon: <ShieldCheck size={15} className="text-green-500" />, title: 'Fresh Guarantee' },
        { icon: <Truck size={15} className="text-blue-500" />,       title: 'Free on ₹199+' },
        { icon: <Clock size={15} className="text-purple-500" />,     title: 'Open 24×7' },
        { icon: <Tag size={15} className="text-red-500" />,          title: 'Best Prices' },
      ].map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-2 shadow-card">
          {item.icon}
          <span className="text-xs font-semibold text-gray-700 hidden sm:block">{item.title}</span>
          <span className="text-[10px] font-semibold text-gray-600 sm:hidden leading-tight">{item.title}</span>
        </div>
      ))}
    </div>
  )
}

// ─── HomePage — optimized: 4 queries total (was 14+) ─────────────────────────
export default function HomePage() {
  // All product queries share staleTime so they don't refetch on re-render
  const { data: trending,  isLoading: tl } = useTrendingProducts()
  const { data: featured,  isLoading: fl } = useFeaturedProducts()
  const { data: aiData,    isLoading: al } = useAIRecommendations()
  // One combined "all products" query instead of 6 category queries
  const { data: allData,   isLoading: pl } = useQuery({
    queryKey: ['products', 'homepage-grid'],
    queryFn: () => productAPI.getAll({ limit: 24, sort: '-createdAt' }).then(r => r.data),
    staleTime: STALE_5M,
  })

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 space-y-8 page-enter">
      <USPBar />
      <HeroBanners />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/products" className="text-sm font-semibold text-primary-600 flex items-center gap-1">All <ChevronRight size={15} /></Link>
        </div>
        <CategoryGrid />
      </section>

      {/* Offers strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { bg:'bg-green-50 border-green-100',   emoji:'🎟️', title:'WELCOME50', desc:'50% off first order',    tag:'New User',  tc:'bg-green-100 text-green-700' },
          { bg:'bg-yellow-50 border-yellow-100', emoji:'🚚', title:'Free Delivery', desc:'Orders above ₹199', tag:'Always On', tc:'bg-yellow-100 text-yellow-700' },
          { bg:'bg-blue-50 border-blue-100',     emoji:'💰', title:'FLAT40',    desc:'₹40 off on ₹299+',       tag:'Limited',  tc:'bg-blue-100 text-blue-700' },
          { bg:'bg-purple-50 border-purple-100', emoji:'⚡', title:'SAVE20',    desc:'20% off up to ₹80',      tag:'Popular',  tc:'bg-purple-100 text-purple-700' },
        ].map((o, i) => (
          <div key={i} className={`${o.bg} border rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{o.emoji}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.tc}`}>{o.tag}</span>
            </div>
            <p className="font-display font-bold text-gray-900">{o.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{o.desc}</p>
          </div>
        ))}
      </div>

      <ProductSection title="Trending Now"       emoji="🔥" products={trending || []}          isLoading={tl} viewAllLink="/products?sort=-rating" />
      {(aiData?.products?.length > 0 || al) && (
        <ProductSection title="Recommended for You" emoji="✨" products={aiData?.products || []} isLoading={al} />
      )}

      {/* Mid CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-emerald-500 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-green">
        <div>
          <p className="text-primary-100 text-sm font-semibold mb-1">🎉 New User Offer</p>
          <h3 className="font-display font-black text-white text-2xl sm:text-3xl">50% OFF</h3>
          <p className="text-primary-100 text-sm mt-1">Use code <span className="bg-white/20 px-2 py-0.5 rounded-lg font-bold text-white">WELCOME50</span> on your first order</p>
        </div>
        <Link to="/products" className="flex-shrink-0 bg-white text-primary-700 font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all">Order Now →</Link>
      </div>

      <ProductSection title="Featured Products"  emoji="⭐" products={featured || []}          isLoading={fl} viewAllLink="/products?isFeatured=true" />
      <ProductSection title="New Arrivals"       emoji="🆕" products={allData?.products || []} isLoading={pl} viewAllLink="/products" />

      {/* Why ZINGER */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-card">
        <h2 className="section-title mb-6 text-center">Why Millions Choose ZINGER</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { emoji:'⚡', title:'10-Min Delivery',    desc:'Fastest in your city' },
            { emoji:'🌿', title:'Farm Fresh',          desc:'Direct from farms' },
            { emoji:'💯', title:'Quality Assured',     desc:'7-day freshness guarantee' },
            { emoji:'🔒', title:'Safe Payments',       desc:'UPI, card, COD — all secure' },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl">{f.emoji}</div>
              <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
