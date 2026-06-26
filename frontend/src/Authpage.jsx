import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "./Authstore";

export default function Authpage() {
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("passenger");
  const [form, setForm] = useState({ name:"", email:"", password:"", vehicleType:"E-Rickshaw", licenseNumber:"" });
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { login, register, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    if (tab === "register" && !form.name) { setError("Name is required"); return; }
    let res;
    if (tab === "login") {
      res = await login(form.email, form.password, role);
    } else {
      res = await register({ name:form.name, email:form.email, password:form.password, role, vehicle: role==="driver"?{ type:form.vehicleType, licenseNumber:form.licenseNumber }:undefined });
    }
    if (res.ok) navigate("/dashboard");
    else setError(res.msg || "Something went wrong");
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"DM Sans,sans-serif", position:"relative", overflow:"hidden" }}>

      {/* ── BACKGROUND IMAGE with blur overlay ── */}
      <div style={{ position:"absolute", inset:0, zIndex:0 }}>
        {/* Unsplash campus/city night image */}
        <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
          alt=""
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", filter:"blur(2px) brightness(0.35) saturate(0.8)", transform:"scale(1.05)" }}
        />
        {/* Dark gradient overlays */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(2,3,8,0.92) 0%, rgba(2,3,8,0.75) 50%, rgba(2,3,8,0.88) 100%)" }} />
        {/* Cyan glow top left */}
        <div style={{ position:"absolute", top:"-15%", left:"-10%", width:600, height:600, background:"radial-gradient(circle, rgba(0,239,255,0.08) 0%, transparent 65%)", borderRadius:"50%" }} />
        {/* Green glow bottom right */}
        <div style={{ position:"absolute", bottom:"-15%", right:"20%", width:500, height:500, background:"radial-gradient(circle, rgba(0,255,153,0.06) 0%, transparent 65%)", borderRadius:"50%" }} />
        {/* Grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      {/* ── LEFT SIDE — Hero ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"4rem 5rem", position:"relative", zIndex:1, opacity:mounted?1:0, transform:mounted?"translateX(0)":"translateX(-30px)", transition:"all 0.9s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"4rem" }}>
          <div style={{ width:46, height:46, background:"linear-gradient(135deg,#00efff,#00ff99)", borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Space Mono,monospace", fontWeight:700, fontSize:15, color:"#000", boxShadow:"0 0 30px rgba(0,239,255,0.35)" }}>RS</div>
          <div>
            <div style={{ fontFamily:"Space Mono,monospace", fontSize:19, fontWeight:700, color:"#e8eaf0", letterSpacing:1 }}>RideSync</div>
            <div style={{ fontSize:10, color:"rgba(0,239,255,0.6)", letterSpacing:3, textTransform:"uppercase", marginTop:2 }}>Campus Mobility</div>
          </div>
        </div>

        {/* Tag line */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1.25rem" }}>
          <div style={{ width:28, height:1.5, background:"linear-gradient(90deg,#00efff,transparent)" }} />
          <span style={{ fontSize:11, color:"#00efff", letterSpacing:4, textTransform:"uppercase", fontWeight:700 }}>Real-Time Platform</span>
        </div>

        {/* Hero heading */}
        <h1 style={{ fontSize:60, fontWeight:800, lineHeight:1.05, margin:"0 0 1.5rem", color:"#e8eaf0", textShadow:"0 0 60px rgba(0,0,0,0.8)" }}>
          Campus rides,<br />
          <span style={{ background:"linear-gradient(135deg,#00efff 0%,#00ff99 60%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            redefined.
          </span>
        </h1>

        <p style={{ fontSize:17, color:"rgba(255,255,255,0.45)", lineHeight:1.75, maxWidth:420, marginBottom:"2.5rem" }}>
          Connect passengers and drivers in real-time. AI-powered matching, live tracking, and smart analytics — all in one platform.
        </p>

        {/* Feature tags */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:"3rem" }}>
          {["⚡ Real-time Socket.IO","🤖 AI Assistant","📊 Live Analytics","💳 UPI Payments","🗺️ Live Map","🔒 JWT Auth"].map(f => (
            <div key={f} style={{ padding:"6px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, fontSize:12, color:"rgba(255,255,255,0.5)", backdropFilter:"blur(10px)" }}>{f}</div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:"3rem" }}>
          {[["Real-Time","WebSocket Updates"],["AI-Powered","Demand Forecasting"],["Full-Stack","React + Node + MongoDB"]].map(([v,l]) => (
            <div key={v}>
              <div style={{ fontSize:18, fontWeight:800, fontFamily:"Space Mono,monospace", background:"linear-gradient(135deg,#00efff,#00ff99)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{v}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT SIDE — Auth form ── */}
      <div style={{ width:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", position:"relative", zIndex:1, opacity:mounted?1:0, transform:mounted?"translateX(0)":"translateX(30px)", transition:"all 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s" }}>

        <div style={{ width:"100%", background:"rgba(8,9,13,0.75)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:"2.5rem", position:"relative", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)" }}>

          {/* Top glow line */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(0,239,255,0.6),transparent)" }} />
          {/* Subtle inner glow */}
          <div style={{ position:"absolute", top:"-50%", right:"-30%", width:300, height:300, background:"radial-gradient(circle,rgba(0,239,255,0.04),transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />

          <h2 style={{ fontSize:26, fontWeight:700, margin:"0 0 6px", color:"#e8eaf0" }}>
            {tab==="login"?"Welcome back":"Get started"}
          </h2>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.3)", margin:"0 0 2rem" }}>
            {tab==="login"?"Sign in to your RideSync account":"Create your account in seconds"}
          </p>

          {/* Tabs */}
          <div style={{ display:"flex", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:4, marginBottom:"1.5rem", gap:4 }}>
            {["login","register"].map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:tab===t?"rgba(255,255,255,0.08)":"transparent", color:tab===t?"#e8eaf0":"rgba(255,255,255,0.3)", fontFamily:"DM Sans,sans-serif", fontSize:13, cursor:"pointer", fontWeight:tab===t?700:400, transition:"all .2s" }}>
                {t==="login"?"Sign In":"Register"}
              </button>
            ))}
          </div>

          {/* Role */}
          <div style={{ display:"flex", gap:8, marginBottom:"1.5rem" }}>
            {[["passenger","🎓","Passenger"],["driver","🛺","Driver"]].map(([r,emoji,label])=>(
              <button key={r} onClick={()=>setRole(r)} style={{ flex:1, padding:"14px 10px", border:`1px solid ${role===r?"rgba(0,239,255,0.5)":"rgba(255,255,255,0.07)"}`, borderRadius:12, background:role===r?"rgba(0,239,255,0.08)":"rgba(255,255,255,0.02)", color:role===r?"#00efff":"rgba(255,255,255,0.3)", fontFamily:"DM Sans,sans-serif", fontSize:13, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:"all .2s", boxShadow:role===r?"0 0 20px rgba(0,239,255,0.1)":"none" }}>
                <span style={{ fontSize:28 }}>{emoji}</span>
                <span style={{ fontWeight:700, letterSpacing:.5 }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem", marginBottom:"1.25rem" }}>
            {tab==="register" && (
              <div>
                <label style={{ display:"block", fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:7, textTransform:"uppercase", letterSpacing:2, fontWeight:700 }}>Full Name</label>
                <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Your name" style={{ width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:14, outline:"none", boxSizing:"border-box" }} onFocus={e=>{ e.target.style.borderColor="rgba(0,239,255,0.4)"; e.target.style.boxShadow="0 0 0 3px rgba(0,239,255,0.06)"; }} onBlur={e=>{ e.target.style.borderColor="rgba(255,255,255,0.08)"; e.target.style.boxShadow="none"; }} />
              </div>
            )}
            <div>
              <label style={{ display:"block", fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:7, textTransform:"uppercase", letterSpacing:2, fontWeight:700 }}>Email</label>
              <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder={role==="passenger"?"student@campus.ac.in":"driver@ridesync.in"} style={{ width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:14, outline:"none", boxSizing:"border-box" }} onFocus={e=>{ e.target.style.borderColor="rgba(0,239,255,0.4)"; e.target.style.boxShadow="0 0 0 3px rgba(0,239,255,0.06)"; }} onBlur={e=>{ e.target.style.borderColor="rgba(255,255,255,0.08)"; e.target.style.boxShadow="none"; }} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:7, textTransform:"uppercase", letterSpacing:2, fontWeight:700 }}>Password</label>
              <input type="password" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="••••••••" style={{ width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:14, outline:"none", boxSizing:"border-box" }} onFocus={e=>{ e.target.style.borderColor="rgba(0,239,255,0.4)"; e.target.style.boxShadow="0 0 0 3px rgba(0,239,255,0.06)"; }} onBlur={e=>{ e.target.style.borderColor="rgba(255,255,255,0.08)"; e.target.style.boxShadow="none"; }} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
            </div>
            {tab==="register" && role==="driver" && <>
              <div>
                <label style={{ display:"block", fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:7, textTransform:"uppercase", letterSpacing:2, fontWeight:700 }}>Vehicle Type</label>
                <select value={form.vehicleType} onChange={e=>set("vehicleType",e.target.value)} style={{ width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:14, outline:"none", boxSizing:"border-box" }}>
                  {["E-Rickshaw","Golf Cart","Mini Bus","Auto"].map(v=><option key={v} value={v} style={{ background:"#0a0b0f" }}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:"block", fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:7, textTransform:"uppercase", letterSpacing:2, fontWeight:700 }}>License / Vehicle ID</label>
                <input value={form.licenseNumber} onChange={e=>set("licenseNumber",e.target.value)} placeholder="UP32AB1234" style={{ width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:14, outline:"none", boxSizing:"border-box" }} />
              </div>
            </>}
          </div>

          {error && (
            <div style={{ background:"rgba(255,77,109,0.08)", border:"1px solid rgba(255,77,109,0.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#ff4d6d", marginBottom:"1rem", display:"flex", alignItems:"center", gap:8 }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:14, background:loading?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#00efff,#00ff99)", border:"none", borderRadius:12, color:loading?"rgba(255,255,255,0.2)":"#000", fontWeight:800, fontSize:15, cursor:loading?"not-allowed":"pointer", fontFamily:"DM Sans,sans-serif", transition:"all .3s", letterSpacing:.5, boxShadow:loading?"none":"0 0 40px rgba(0,239,255,0.25)" }}>
            {loading ? "Please wait..." : `${tab==="login"?"Sign In":"Create Account"} as ${role==="passenger"?"Passenger":"Driver"} →`}
          </button>

          <p style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.25)", marginTop:"1.25rem" }}>
            {tab==="login"?"Don't have an account? ":"Already have an account? "}
            <span onClick={()=>setTab(tab==="login"?"register":"login")} style={{ color:"#00efff", cursor:"pointer", fontWeight:700 }}>
              {tab==="login"?"Register":"Sign In"}
            </span>
          </p>
        </div>
      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.15); }
        select option { background: #0a0b0f; color: #e8eaf0; }
      `}</style>
    </div>
  );
}