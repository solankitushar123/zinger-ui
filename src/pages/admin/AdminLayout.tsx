import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Users, Grid, Tag, Image, LogOut, Menu, X, Bell, TrendingUp, BarChart2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { to: '/admin',            icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/admin/products',   icon: <Package size={17} />,         label: 'Products' },
  { to: '/admin/orders',     icon: <ShoppingBag size={17} />,     label: 'Orders' },
  { to: '/admin/users',      icon: <Users size={17} />,           label: 'Users' },
  { to: '/admin/categories', icon: <Grid size={17} />,            label: 'Categories' },
  { to: '/admin/coupons',    icon: <Tag size={17} />,             label: 'Coupons' },
  { to: '/admin/banners',    icon: <Image size={17} />,           label: 'Banners' },
]

export default function AdminLayout() {
  const location = useLocation()
  const { logout } = useAuth()
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path: string) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
          <span className="text-white font-display font-black text-xl leading-none">Z</span>
        </div>
        <div>
          <span className="font-display font-black text-white text-base tracking-tight">ZINGER</span>
          <p className="text-[9px] text-gray-500 font-semibold tracking-widest uppercase">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest px-3 mb-2">Main Menu</p>
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive(item.to)
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={isActive(item.to) ? 'text-white' : 'text-gray-500'}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-gray-950 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-60 bg-gray-950 z-50 flex flex-col md:hidden animate-slide-in-right">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-14 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu size={20} className="text-gray-600" />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 capitalize hidden sm:block">
              {NAV.find(n => isActive(n.to))?.label || 'Dashboard'}
            </p>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank"
              className="text-xs font-semibold text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors hidden sm:block">
              View Store →
            </Link>
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
