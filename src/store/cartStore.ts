import { create } from 'zustand'
import type { Cart, CartTotals, Product } from '../types'

interface CartState {
  cart: Cart | null
  totals: CartTotals | null
  isOpen: boolean
  isLoading: boolean
  setCart: (cart: Cart, totals: CartTotals) => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  clearCart: () => void
  getItemQuantity: (productId: string) => number
  getTotalItems: () => number
}

const defaultTotals: CartTotals = {
  subtotal: 0,
  deliveryCharges: 0,
  couponDiscount: 0,
  tax: 0,
  totalAmount: 0,
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  totals: defaultTotals,
  isOpen: false,
  isLoading: false,

  setCart: (cart, totals) => set({ cart, totals }),

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

  clearCart: () => set({ cart: null, totals: defaultTotals }),

  getItemQuantity: (productId: string) => {
    const cart = get().cart
    if (!cart) return 0
    const item = cart.items.find(
      (i) => (typeof i.product === 'string' ? i.product : i.product._id) === productId
    )
    return item?.quantity || 0
  },

  getTotalItems: () => {
    const cart = get().cart
    if (!cart) return 0
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))
