import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { cartAPI, productAPI, authAPI, wishlistAPI, aiAPI } from '../api'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

// ─── Cart Hooks ──────────────────────────────────────────────────────────────
export const useCart = () => {
  const { setCart, getItemQuantity, getTotalItems, cart: storeCart, totals: storeTotals } = useCartStore()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await cartAPI.get()
      setCart(res.data.cart, res.data.totals)
      return res.data
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  })

  const addMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) =>
      cartAPI.add(productId, quantity),
    onSuccess: (res) => {
      setCart(res.data.cart, res.data.totals)
      queryClient.setQueryData(['cart'], res.data)
      toast.success('Added to cart!')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add to cart')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartAPI.update(productId, quantity),
    onSuccess: (res) => {
      setCart(res.data.cart, res.data.totals)
      queryClient.setQueryData(['cart'], res.data)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update cart')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (productId: string) => cartAPI.remove(productId),
    onSuccess: (res) => {
      setCart(res.data.cart, res.data.totals)
      queryClient.setQueryData(['cart'], res.data)
      toast.success('Removed from cart')
    },
  })

  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => cartAPI.applyCoupon(code),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success(res.data.message || 'Coupon applied!')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Invalid coupon code')
    },
  })

  const removeCouponMutation = useMutation({
    mutationFn: () => cartAPI.removeCoupon(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  return {
    cart: data?.cart ?? storeCart,
    totals: data?.totals ?? storeTotals,
    isLoading,
    addToCart: addMutation.mutate,
    isAdding: addMutation.isPending,
    updateQuantity: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    removeFromCart: removeMutation.mutate,
    applyCoupon: applyCouponMutation.mutate,
    isApplyingCoupon: applyCouponMutation.isPending,
    removeCoupon: removeCouponMutation.mutate,
    getItemQuantity,
    getTotalItems,
  }
}

// ─── Auth Hooks ──────────────────────────────────────────────────────────────
export const useAuth = () => {
  const { user, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => authAPI.login(data),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Welcome back, ' + res.data.user.name + '!')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Invalid email or password')
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; phone?: string }) =>
      authAPI.register(data),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      toast.success('Account created successfully!')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Registration failed')
    },
  })

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) await authAPI.logout(refreshToken)
    } catch {
      // ignore
    } finally {
      clearAuth()
      queryClient.clear()
      toast.success('Logged out successfully')
    }
  }, [clearAuth, queryClient])

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout,
    updateUser,
  }
}

// ─── Product Hooks ───────────────────────────────────────────────────────────
export const useProducts = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => productAPI.getAll(params).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  })

export const useProduct = (id: string) =>
  useQuery({
    queryKey: ['product', id],
    queryFn: () => productAPI.getById(id).then((r) => r.data.product),
    enabled: !!id,
  })

export const useTrendingProducts = () =>
  useQuery({
    queryKey: ['products', 'trending'],
    queryFn: () => productAPI.getTrending().then((r) => r.data.products),
    staleTime: 1000 * 60 * 5,
  })

export const useFeaturedProducts = () =>
  useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productAPI.getFeatured().then((r) => r.data.products),
    staleTime: 1000 * 60 * 5,
  })

// ─── Wishlist Hook ───────────────────────────────────────────────────────────
export const useWishlist = () => {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const { data } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistAPI.get().then((r) => r.data.wishlist),
    enabled: isAuthenticated,
  })

  const toggleMutation = useMutation({
    mutationFn: (productId: string) => wishlistAPI.toggle(productId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success(res.data.message)
    },
  })

  const isWishlisted = useCallback(
    (productId: string) =>
      data?.products?.some((p: any) =>
        typeof p === 'string' ? p === productId : p._id === productId
      ) ?? false,
    [data]
  )

  return {
    wishlist: data,
    toggleWishlist: toggleMutation.mutate,
    isWishlisted,
  }
}

// ─── AI Recommendations Hook ──────────────────────────────────────────────────
export const useAIRecommendations = () =>
  useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () => aiAPI.getRecommendations().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
    retry: false,
  })
