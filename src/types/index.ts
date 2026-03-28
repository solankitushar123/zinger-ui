export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: 'customer' | 'admin' | 'delivery'
  isEmailVerified: boolean
  isBlocked?: boolean
  addresses: Address[]
  isAvailable?: boolean
  vehicleType?: string
  vehicleNumber?: string
  createdAt: string
}

export interface Address {
  _id: string
  label: string
  fullName: string
  phone: string
  street: string
  city: string
  state: string
  pincode: string
  landmark?: string
  isDefault: boolean
  location?: { coordinates: [number, number] }
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: { url: string; publicId: string }
  icon?: string
  color: string
  isActive: boolean
  sortOrder: number
}

export interface Product {
  _id: string
  name: string
  description: string
  price: number
  discountPercent: number
  discountedPrice: number
  images: { url: string; publicId: string }[]
  category: Category | string
  brand?: string
  unit: string
  weight?: string
  stock: number
  rating: number
  numReviews: number
  tags: string[]
  isFeatured: boolean
  isTrending: boolean
  isActive: boolean
  isInStock: boolean
  isLowStock: boolean
  createdAt: string
}

export interface CartItem {
  product: Product
  quantity: number
  price: number
  discountedPrice?: number
}

export interface Cart {
  _id: string
  user: string
  items: CartItem[]
  coupon?: Coupon
  couponDiscount: number
}

export interface CartTotals {
  subtotal: number
  deliveryCharges: number
  couponDiscount: number
  tax: number
  totalAmount: number
}

export interface Order {
  _id: string
  orderId: string
  user: User | string
  items: OrderItem[]
  deliveryAddress: Address
  subtotal: number
  deliveryCharges: number
  tax: number
  couponDiscount: number
  totalAmount: number
  paymentMethod: 'razorpay' | 'stripe' | 'cod'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  deliveryStatus: OrderStatus
  deliveryPartner?: User
  coupon?: string
  estimatedDeliveryTime?: string
  deliveredAt?: string
  cancelledAt?: string
  cancelReason?: string
  statusHistory: { status: string; timestamp: string; note?: string }[]
  createdAt: string
}

export interface OrderItem {
  product: Product | string
  name: string
  image: string
  price: number
  discountedPrice?: number
  quantity: number
  total: number
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'

export interface Coupon {
  _id: string
  code: string
  description?: string
  discountType: 'percentage' | 'flat'
  discountValue: number
  maxDiscount?: number
  minOrderAmount: number
  expiryDate: string
  isActive: boolean
  usedCount: number
  totalUsageLimit?: number
}

export interface Review {
  _id: string
  user: Pick<User, '_id' | 'name' | 'avatar'>
  product: string
  rating: number
  title?: string
  comment?: string
  isVerifiedPurchase: boolean
  helpful: string[]
  createdAt: string
}

export interface Banner {
  _id: string
  title: string
  subtitle?: string
  image?: { url: string; publicId: string }
  link?: string
  isActive: boolean
  sortOrder: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
  hasMore: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

export interface DashboardStats {
  totalOrders: number
  todayOrders: number
  monthOrders: number
  totalUsers: number
  newUsersToday: number
  totalRevenue: number
  monthRevenue: number
  pendingOrders: number
  deliveryPartners: number
}
