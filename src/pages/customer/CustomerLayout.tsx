import { Outlet, useLocation } from 'react-router-dom'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import CartDrawer from '../../components/customer/CartDrawer'
import AIChatbot from '../../components/customer/AIChatbot'
import MobileNav from '../../components/customer/MobileNav'
import { useCart } from '../../hooks'
import { useSocket } from '../../hooks/useSocket'

// Pages that should NOT show the footer
const NO_FOOTER_PATHS = ['/checkout', '/cart']

export default function CustomerLayout() {
  useCart()   // initialize cart on mount
  useSocket() // initialize realtime connection
  const location = useLocation()
  const showFooter = !NO_FOOTER_PATHS.some(p => location.pathname.startsWith(p))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      {showFooter && <Footer />}
      <CartDrawer />
      <AIChatbot />
      <MobileNav />
    </div>
  )
}
