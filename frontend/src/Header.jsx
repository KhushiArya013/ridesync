import { useAuthStore } from './Authstore'
import { driversAPI } from './Api'
import { getSocket } from './Usesocket'
import { useState } from 'react'
import { useToast } from './Toast'

export default function Header({ title, isOnline, setIsOnline }) {
  const { user } = useAuthStore()
  const toast = useToast()
  const isDriver = user?.role === 'driver'

  const toggleOnline = async () => {
    const next = !isOnline
    try {
      await driversAPI.setStatus(next)
      const socket = getSocket()
      socket?.emit(next ? 'driver:goOnline' : 'driver:goOffline')
      setIsOnline(next)
      toast(`You are now ${next ? 'Online ✅' : 'Offline ⚫'}`, next ? 'success' : 'warn')
    } catch {
      toast('Failed to update status', 'error')
    }
  }

  return (
    <header style={{ height: 56, background: '#0e1018', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '1rem', flexShrink: 0 }}>
      <span style={{ fontFamily: 'Space Mono', fontSize: 13, color: '#8a92a8', textTransform: 'uppercase', letterSpacing: 2 }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8a92a8' }}>
        <div className="dot-live" />Live
      </div>
      {isDriver && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: '0.5rem' }}>
          <span style={{ fontSize: 12, color: '#8a92a8' }}>Status:</span>
          <label className="toggle-wrap">
            <input type="checkbox" checked={isOnline} onChange={toggleOnline} />
            <span className="toggle-slider" />
          </label>
          <span style={{ fontSize: 12, color: isOnline ? '#00ff99' : '#8a92a8' }}>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: '#8a92a8' }}>{user?.role === 'driver' ? '🛺' : '🎓'} {user?.name}</span>
        <span className={`chip chip-${isDriver ? 'green' : 'cyan'}`}>{isDriver ? 'Driver' : 'Passenger'}</span>
      </div>
    </header>
  )
}
