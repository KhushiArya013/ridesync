
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./Authstore";
import { useState, useEffect } from "react";

const PASSENGER_NAV = [
  { path: "/dashboard", icon: "🏠", label: "Dashboard" },
  { path: "/rides",     icon: "🚗", label: "My Rides" },
  { path: "/map",       icon: "🗺️", label: "Live Map" },
  { path: "/analytics", icon: "📊", label: "Analytics" },
  { path: "/ai",        icon: "🤖", label: "AI Assistant" },
  { path: "/payments",  icon: "💳", label: "Payments" },
  { path: "/profile",   icon: "👤", label: "Profile" },
];

const DRIVER_NAV = [
  { path: "/dashboard", icon: "🏠", label: "Dashboard" },
  { path: "/rides",     icon: "📋", label: "Requests" },
  { path: "/map",       icon: "🗺️", label: "Live Map" },
  { path: "/earnings",  icon: "💰", label: "Earnings" },
  { path: "/analytics", icon: "📊", label: "Analytics" },
  { path: "/ai",        icon: "🤖", label: "AI Assistant" },
  { path: "/profile",   icon: "👤", label: "Profile" },
];

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end" }}>
      <div style={{ fontFamily:"Space Mono,monospace", fontSize:16, fontWeight:700, color:"#e8eaf0", letterSpacing:1 }}>
        {time.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
      </div>
      <div style={{ fontSize:10, color:"#4a5168", marginTop:1 }}>
        {time.toLocaleDateString([], { weekday:"short", day:"numeric", month:"short" })}
      </div>
    </div>
  );
}

export function Sidebar({ pendingCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const isDriver = user?.role === "driver";
  const NAV = isDriver ? DRIVER_NAV : PASSENGER_NAV;

  return (
    <aside style={{
      width: 72,
      background: "linear-gradient(180deg,#0a0b0f 0%,#08090d 100%)",
      borderRight: "1px solid rgba(255,255,255,0.05)",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "1rem 0 1rem",
      gap: 2, flexShrink: 0, position: "relative",
    }}>
      {/* Top glow */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(0,239,255,0.3),transparent)" }} />

      {/* Logo */}
      <div onClick={() => navigate("/dashboard")} style={{
        width: 40, height: 40,
        background: "linear-gradient(135deg,#00efff,#00ff99)",
        borderRadius: 10, display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "Space Mono,monospace",
        fontWeight: 700, fontSize: 13, color: "#000",
        marginBottom: "1.25rem", cursor: "pointer",
        boxShadow: "0 0 20px rgba(0,239,255,0.25)",
      }}>RS</div>

      {/* Nav */}
      {NAV.map((n) => {
        const active = location.pathname === n.path;
        return (
          <button key={n.path} title={n.label} onClick={() => navigate(n.path)}
            style={{
              width: 44, height: 44, borderRadius: 10, border: "none",
              background: active ? "rgba(0,239,255,0.1)" : "transparent",
              color: active ? "#00efff" : "#3d4460",
              cursor: "pointer", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .15s", position: "relative",
              outline: active ? "1px solid rgba(0,239,255,0.2)" : "none",
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color="#8a92a8"; }}}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#3d4460"; }}}>
            {n.icon}
            {n.label === "Requests" && pendingCount > 0 && (
              <span style={{
                position: "absolute", top: 5, right: 5,
                width: 8, height: 8, background: "#ff4d6d",
                borderRadius: "50%", border: "2px solid #08090d",
              }} />
            )}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Avatar */}
      <div onClick={() => navigate("/profile")} style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "linear-gradient(135deg,rgba(0,239,255,0.15),rgba(0,255,153,0.15))",
        border: "1px solid rgba(0,239,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "#00efff",
        marginBottom: 6, cursor: "pointer",
      }}>
        {user?.name?.charAt(0)?.toUpperCase()}
      </div>

      {/* Logout */}
      <button title="Sign Out" onClick={() => { logout(); navigate("/"); }}
        style={{
          width: 44, height: 44, borderRadius: 10, border: "none",
          background: "transparent", color: "#3d4460",
          cursor: "pointer", fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={e => { e.currentTarget.style.color="#ff4d6d"; e.currentTarget.style.background="rgba(255,77,109,0.06)"; }}
        onMouseLeave={e => { e.currentTarget.style.color="#3d4460"; e.currentTarget.style.background="transparent"; }}>
        ⏻
      </button>
    </aside>
  );
}

export function PageLayout({ title, subtitle, children, isOnline, onToggleOnline, pendingCount = 0 }) {
  const { user } = useAuthStore();
  const isDriver = user?.role === "driver";

  return (
    <div style={{ display:"flex", height:"100vh", background:"#08090d", fontFamily:"DM Sans,sans-serif", color:"#e8eaf0", overflow:"hidden" }}>
      <Sidebar pendingCount={pendingCount} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <header style={{
          height: 60,
          background: "rgba(8,9,13,0.98)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center",
          padding: "0 1.5rem", gap: "1rem", flexShrink: 0,
          position: "relative",
        }}>
          {/* Bottom accent line */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(0,239,255,0.12),transparent)" }} />

          <div>
            <div style={{ fontFamily:"Space Mono,monospace", fontSize:11, color:"#e8eaf0", textTransform:"uppercase", letterSpacing:3, fontWeight:700 }}>{title}</div>
            {subtitle && <div style={{ fontSize:11, color:"#4a5168", marginTop:1 }}>{subtitle}</div>}
          </div>

          {/* Live indicator */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ position:"relative", width:8, height:8 }}>
              <div style={{ position:"absolute", inset:0, background:"#00ff99", borderRadius:"50%", animation:"ping 1.5s ease-in-out infinite", opacity:0.4 }} />
              <div style={{ position:"absolute", inset:0, background:"#00ff99", borderRadius:"50%" }} />
            </div>
            <span style={{ fontSize:10, color:"#00ff99", fontFamily:"Space Mono,monospace", letterSpacing:1.5 }}>LIVE</span>
          </div>

          {/* Driver toggle */}
          {isDriver && onToggleOnline && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 14px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:20 }}>
              <span style={{ fontSize:11, color:"#4a5168" }}>Status</span>
              <div onClick={onToggleOnline} style={{ position:"relative", width:40, height:22, background:isOnline?"rgba(0,255,153,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${isOnline?"rgba(0,255,153,0.35)":"rgba(255,255,255,0.08)"}`, borderRadius:11, cursor:"pointer", transition:"all .3s" }}>
                <div style={{ position:"absolute", width:16, height:16, background:isOnline?"#00ff99":"#3d4460", borderRadius:"50%", top:2, left:isOnline?21:2, transition:"left .3s", boxShadow:isOnline?"0 0 8px #00ff99":"none" }} />
              </div>
              <span style={{ fontSize:11, color:isOnline?"#00ff99":"#4a5168", fontWeight:600 }}>{isOnline?"Online":"Offline"}</span>
            </div>
          )}

          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"1.5rem" }}>
            <LiveClock />
            <div style={{ width:1, height:28, background:"rgba(255,255,255,0.05)" }} />
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,rgba(0,239,255,0.12),rgba(0,255,153,0.12))", border:"1px solid rgba(0,239,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#00efff" }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#e8eaf0" }}>{user?.name}</div>
                <div style={{ fontSize:10, color:isDriver?"#00ff99":"#00efff", textTransform:"uppercase", letterSpacing:1.5 }}>{isDriver?"Driver":"Passenger"}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"1.5rem", background:"#08090d" }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.1)} }
      `}</style>
    </div>
  );
}

