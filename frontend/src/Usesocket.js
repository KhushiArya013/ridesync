import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let socket = null

export function useSocket(token, onEvent) {
  const cbRef = useRef(onEvent)
  cbRef.current = onEvent

  useEffect(() => {
    if (!token) return
    if (socket?.connected) socket.disconnect()

    socket = io('/', { auth: { token }, transports: ['websocket'] })

    socket.on('connect', () => console.log('[Socket] Connected:', socket.id))
    socket.on('disconnect', () => console.log('[Socket] Disconnected'))

    const events = [
      'ride:new', 'ride:accepted', 'ride:started', 'ride:completed',
      'ride:cancelled', 'ride:updated', 'ride:rated', 'ride:eta',
      'driver:status', 'driver:location', 'users:online', 'ride:message'
    ]
    events.forEach(e => socket.on(e, data => cbRef.current?.(e, data)))

    return () => { socket?.disconnect(); socket = null }
  }, [token])

  return socket
}

export function getSocket() { return socket }