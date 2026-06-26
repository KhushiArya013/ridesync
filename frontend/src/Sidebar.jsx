import { NavLink } from 'react-router-dom'
import { useAuthStore } from './Authstore'

const passengerNav = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/rides', icon: '🚗', label: 'My Rides' },
  { to: '/map', icon: '🗺️', label: 'Live Map' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]
const driverNav = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/rides', icon: '📋', label: 'Requests' },
  { to: '/map', icon: '🗺️', label: 'Live Map' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]

export default function Sidebar({ pendingCount = 0 }) {
  const { user, logout } = useAuthStore()
  const nav = user?.role === 'driver' ? driverNav : passengerNav

  return (
    <aside style={{ width: 72, background: '#0e1018', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0', gap: 6, flexShrink: 0, zIndex: 10 }}>
      <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#00efff,#00ff99)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Mono', fontWeight: 700, fontSize: 14, color: '#000', marginBottom: '1rem' }}>CR</div>
      {nav.map(n => (
        <NavLink key={n.to} to={n.to} title={n.label}
          style={({ isActive }) => ({ width: 44, height: 44, borderRadius: 10, border: 'none', background: isActive ? '#151824' : 'transparent', color: isActive ? '#00efff' : '#8a92a8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none', position: 'relative', transition: 'all .2s' })}>
          {n.icon}
          {n.label === 'Requests' && pendingCount > 0 && (
            <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#ff4d6d', borderRadius: '50%', border: '2px solid #0e1018' }} />
          )}
        </NavLink>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
      <button onClick={logout} title="Logout" style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: 'transparent', color: '#8a92a8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all .2s' }}>⏻</button>
    </aside>
  )
}
