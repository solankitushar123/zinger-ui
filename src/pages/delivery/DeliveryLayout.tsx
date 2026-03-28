import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, History, Zap, LogOut, ToggleLeft, ToggleRight } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks'
import { useSocket } from '../../hooks/useSocket'
import { deliveryAPI } from '../../api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function DeliveryLayout() {
  const location = useLocation()
  const { logout } = useAuth()
  const { user, updateUser } = useAuthStore()
  const qc = useQueryClient()
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true)

  // Realtime: new assignment notifications
  useSocket()

  const toggleMutation = useMutation({
    mutationFn: (val: boolean) => deliveryAPI.toggleAvailability(val),
    onSuccess: (_: any, val: boolean) => {
      setIsAvailable(val)
      updateUser({ isAvailable: val })
      toast.success(val ? '🟢 You are now Online' : '🔴 You are now Offline')
    },
    onError: () => toast.error('Failed to update availability'),
  })

  const isActive = (path: string) =>
    path === '/delivery' ? location.pathname === '/delivery' : location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/delivery" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-black text-lg leading-none">Z</span>
            </div>
            <div>
              <span className="font-display font-bold text-sm text-gray-900">ZINGER</span>
              <p className="text-[9px] text-gray-400 -mt-0.5">Delivery Partner</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Online/Offline toggle */}
            <button
              onClick={() => toggleMutation.mutate(!isAvailable)}
              disabled={toggleMutation.isPending}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all border-2 ${
                isAvailable
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {isAvailable
                ? <><ToggleRight size={15} /> Online</>
                : <><ToggleLeft size={15} /> Offline</>
              }
            </button>

            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-lg mx-auto px-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-lg mx-auto flex justify-around px-4 py-2">
          <Link to="/delivery"
            className={`flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl transition-colors ${isActive('/delivery') && location.pathname === '/delivery' ? 'text-primary-600' : 'text-gray-400'}`}>
            <LayoutDashboard size={21} strokeWidth={isActive('/delivery') ? 2.5 : 2} />
            <span className="text-[10px] font-semibold">Orders</span>
          </Link>
          <Link to="/delivery?tab=history"
            className="flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl text-gray-400 transition-colors">
            <History size={21} />
            <span className="text-[10px] font-semibold">History</span>
          </Link>
          <Link to="/profile"
            className="flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl text-gray-400 transition-colors">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]}
            </div>
            <span className="text-[10px] font-semibold">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
