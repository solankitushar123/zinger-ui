import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, User, Heart, LogOut, Package, MapPin, ChevronDown, X, Zap, Bell, Grid } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks'
import { productAPI } from '../../api'
import type { Product } from '../../types'

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { toggleCart, getTotalItems } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const totalItems = getTotalItems()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSuggestions(false)
      if (showUserMenu) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUserMenu])

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    clearTimeout(debounceRef.current)
    if (value.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await productAPI.autocomplete(value)
        setSuggestions(res.data.suggestions || [])
        setShowSuggestions(true)
      } catch {}
    }, 280)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        <div className="flex items-center gap-3 h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-green group-hover:scale-105 transition-transform">
              <span className="text-white font-display font-black text-xl leading-none">Z</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-black text-xl text-gray-900 tracking-tight">ZINGER</span>
              <span className="block text-[9px] text-primary-600 font-semibold -mt-1 tracking-widest uppercase">Grocery</span>
            </div>
          </Link>

          {/* ── Delivery slot ── */}
          <button className="hidden md:flex items-center gap-1.5 border border-gray-200 hover:border-primary-400 rounded-xl px-3 py-2 transition-colors flex-shrink-0 group">
            <MapPin size={13} className="text-primary-600" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 font-medium leading-none">Deliver to</p>
              <p className="text-xs font-semibold text-gray-800 leading-tight">Home • 30 min</p>
            </div>
            <ChevronDown size={13} className="text-gray-400 ml-0.5" />
          </button>

          {/* ── Search ── */}
          <div ref={searchRef} className="flex-1 relative max-w-2xl">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder='Search "milk", "eggs", "atta"...'
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-transparent
                             transition-all placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={15} />
                  </button>
                )}
              </div>
            </form>

            {/* Autocomplete */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-card-md border border-gray-100 overflow-hidden z-50 animate-fade-in">
                {suggestions.map((product) => (
                  <Link key={product._id} to={`/products/${product._id}`}
                    onClick={() => { setShowSuggestions(false); setSearchQuery('') }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={product.images?.[0]?.url} alt={product.name}
                        className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                      <p className="text-xs text-primary-600 font-bold">₹{product.discountedPrice || product.price}</p>
                    </div>
                    <Search size={13} className="text-gray-300 flex-shrink-0" />
                  </Link>
                ))}
                <button onClick={handleSearch}
                  className="w-full px-4 py-3 text-sm text-primary-600 font-semibold hover:bg-primary-50 transition-colors text-left border-t border-gray-100">
                  See all results for "{searchQuery}" →
                </button>
              </div>
            )}
          </div>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-1 flex-shrink-0">

            {/* All Categories — desktop only */}
            <Link to="/products" className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
              <Grid size={16} className="text-primary-600" /> Browse
            </Link>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link to="/wishlist" className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all hidden sm:flex">
                <Heart size={20} />
              </Link>
            )}

            {/* Cart */}
            <button onClick={toggleCart}
              className="relative flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2.5 rounded-xl transition-all font-semibold text-sm shadow-green active:scale-95">
              <ShoppingCart size={18} />
              <span className="hidden sm:block">{totalItems > 0 ? `${totalItems} item${totalItems > 1 ? 's' : ''}` : 'Cart'}</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 text-gray-900 text-[10px] font-black rounded-full flex items-center justify-center sm:hidden">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center p-1 hover:bg-gray-50 rounded-xl transition-all">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center font-bold text-white text-sm">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-card-md border border-gray-100 overflow-hidden z-50 animate-fade-in">
                    <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-green-50 border-b border-gray-100">
                      <p className="font-bold text-sm text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      {[
                        { to: '/profile', icon: <User size={15} />, label: 'My Profile' },
                        { to: '/orders', icon: <Package size={15} />, label: 'My Orders' },
                        { to: '/wishlist', icon: <Heart size={15} />, label: 'Wishlist' },
                      ].map(item => (
                        <Link key={item.to} to={item.to} onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <span className="text-gray-400">{item.icon}</span> {item.label}
                        </Link>
                      ))}
                      <hr className="border-gray-100 my-1" />
                      <button onClick={() => { logout(); setShowUserMenu(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-all border border-gray-200">
                <User size={16} /> Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
