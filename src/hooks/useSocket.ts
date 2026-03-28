import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

let globalSocket: Socket | null = null

export const useSocket = () => {
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!isAuthenticated || !token) return

    if (globalSocket?.connected) {
      socketRef.current = globalSocket
      return
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => console.log('🔌 Socket connected'))
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'))
    socket.on('connect_error', (err) => console.warn('Socket error:', err.message))

    // Admin: new order placed
    socket.on('new_order', () => {
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast('📦 New order received!', { icon: '🛒' })
    })

    // Admin: order status changed
    socket.on('order_status_changed', () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
    })

    // Delivery: new assignment
    socket.on('new_assignment', () => {
      qc.invalidateQueries({ queryKey: ['delivery-orders'] })
      toast('🚴 New order assigned to you!', { icon: '⚡' })
    })

    globalSocket = socket
    socketRef.current = socket

    return () => {
      // Don't disconnect — keep socket alive across route changes
    }
  }, [isAuthenticated])

  const trackOrder = useCallback((orderId: string, onUpdate: (data: any) => void) => {
    const socket = socketRef.current || globalSocket
    if (!socket) return () => {}

    socket.emit('track_order', orderId)
    socket.on('order_status_changed', onUpdate)
    socket.on('delivery_location_update', onUpdate)
    socket.on('delivery_otp_sent', onUpdate)

    return () => {
      socket.emit('untrack_order', orderId)
      socket.off('order_status_changed', onUpdate)
      socket.off('delivery_location_update', onUpdate)
      socket.off('delivery_otp_sent', onUpdate)
    }
  }, [])

  return { socket: socketRef.current || globalSocket, trackOrder }
}
