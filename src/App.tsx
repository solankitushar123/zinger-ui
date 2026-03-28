import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Customer pages
import HomePage from './pages/customer/HomePage'
import ProductsPage from './pages/customer/ProductsPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrdersPage from './pages/customer/OrdersPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
import WishlistPage from './pages/customer/WishlistPage'
import ProfilePage from './pages/customer/ProfilePage'
import LoginPage from './pages/customer/LoginPage'
import RegisterPage from './pages/customer/RegisterPage'
import ForgotPasswordPage from './pages/customer/ForgotPasswordPage'
import ResetPasswordPage from './pages/customer/ResetPasswordPage'
import VerifyEmailPage from './pages/customer/VerifyEmailPage'
import PaymentSuccessPage from './pages/customer/PaymentSuccessPage'
import CategoryPage from './pages/customer/CategoryPage'
import SearchPage from './pages/customer/SearchPage'
import TrackOrderPage from './pages/customer/TrackOrderPage'

// Admin pages
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCategories from './pages/admin/AdminCategories'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminBanners from './pages/admin/AdminBanners'

// Delivery pages
import DeliveryLayout from './pages/delivery/DeliveryLayout'
import DeliveryDashboard from './pages/delivery/DeliveryDashboard'
import DeliveryOrderDetail from './pages/delivery/DeliveryOrderDetail'

// Layout
import CustomerLayout from './pages/customer/CustomerLayout'

// Guards
const ProtectedRoute = ({ children, roles }: { children: JSX.Element; roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'delivery') return <Navigate to="/delivery" replace />
    return <Navigate to="/" replace />
  }
  return children
}

const GuestRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />
    if (user?.role === 'delivery') return <Navigate to="/delivery" replace />
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Customer routes */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="wishlist" element={<ProtectedRoute roles={['customer']}><WishlistPage /></ProtectedRoute>} />
        <Route path="checkout" element={<ProtectedRoute roles={['customer']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="payment/success" element={<ProtectedRoute roles={['customer']}><PaymentSuccessPage /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute roles={['customer']}><OrdersPage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute roles={['customer']}><OrderDetailPage /></ProtectedRoute>} />
        <Route path="orders/:id/track" element={<ProtectedRoute roles={['customer']}><TrackOrderPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute roles={['customer']}><ProfilePage /></ProtectedRoute>} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="banners" element={<AdminBanners />} />
      </Route>

      {/* Delivery routes */}
      <Route path="/delivery" element={<ProtectedRoute roles={['delivery']}><DeliveryLayout /></ProtectedRoute>}>
        <Route index element={<DeliveryDashboard />} />
        <Route path="orders/:id" element={<DeliveryOrderDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
