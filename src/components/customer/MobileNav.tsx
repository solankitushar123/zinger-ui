import { Link, useLocation } from 'react-router-dom'
import { Home, Search, ShoppingCart, Package, User } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'

export default function MobileNav() {
  const location = useLocation()
  const { toggleCart, getTotalItems } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const totalItems = getTotalItems()

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/orders', icon: Package, label: 'Orders', auth: true },
    { path: isAuthenticated ? '/profile' : '/login', icon: User, label: isAuthenticated ? 'Profile' : 'Login' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around">
        {/* Home */}
        <Link to="/" className={`flex flex-col items-center gap-0.5 px-4 py-2.5 transition-colors ${isActive('/') ? 'text-primary-600' : 'text-gray-400'}`}>
          <Home size={21} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>

        {/* Search */}
        <Link to="/search" className={`flex flex-col items-center gap-0.5 px-4 py-2.5 transition-colors ${isActive('/search') ? 'text-primary-600' : 'text-gray-400'}`}>
          <Search size={21} strokeWidth={isActive('/search') ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Search</span>
        </Link>

        {/* Cart — center button */}
        <button onClick={toggleCart} className="flex flex-col items-center gap-0.5 px-4 py-2.5 text-gray-400 relative">
          <div className={`relative ${totalItems > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
            <ShoppingCart size={21} strokeWidth={totalItems > 0 ? 2.5 : 2} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Cart</span>
        </button>

        {/* Orders */}
        {isAuthenticated && (
          <Link to="/orders" className={`flex flex-col items-center gap-0.5 px-4 py-2.5 transition-colors ${isActive('/orders') ? 'text-primary-600' : 'text-gray-400'}`}>
            <Package size={21} strokeWidth={isActive('/orders') ? 2.5 : 2} />
            <span className="text-[10px] font-semibold">Orders</span>
          </Link>
        )}

        {/* Profile / Login */}
        <Link to={isAuthenticated ? '/profile' : '/login'}
          className={`flex flex-col items-center gap-0.5 px-4 py-2.5 transition-colors ${isActive('/profile') || isActive('/login') ? 'text-primary-600' : 'text-gray-400'}`}>
          <User size={21} strokeWidth={isActive('/profile') || isActive('/login') ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">{isAuthenticated ? 'Profile' : 'Login'}</span>
        </Link>
      </div>
    </nav>
  )
}
