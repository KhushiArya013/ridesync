import { useState, useCallback, createContext, useContext, useEffect } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#151824', border: `1px solid rgba(255,255,255,0.1)`,
            borderLeft: `3px solid ${t.type === 'success' ? '#00ff99' : t.type === 'warn' ? '#ffdd57' : t.type === 'error' ? '#ff4d6d' : '#00efff'}`,
            borderRadius: 10, padding: '10px 16px', fontSize: 13, display: 'flex',
            alignItems: 'center', gap: 8, maxWidth: 300, animation: 'slideIn .3s ease', color: '#e8eaf0'
          }}>
            <span>{t.type === 'success' ? '✓' : t.type === 'warn' ? '⚠' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
