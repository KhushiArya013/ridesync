import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "./Authstore";
import { PageLayout } from "./Layout";
import { getSocket } from "./Socket";

const CAMPUSES = ["Main Gate","Library","Academic Block A","Academic Block B","Hostel Zone 1","Hostel Zone 2","Cafeteria","Sports Complex","Admin Block","Medical Center","Research Park","Stadium"];

const STATUS_COLOR = { requested:"#ffdd57", accepted:"#00efff", inprogress:"#00ff99", completed:"#7b5ea7", cancelled:"#ff4d6d" };
const STATUS_LABEL = { requested:"Searching for driver...", accepted:"Driver on the way", inprogress:"Ride in progress", completed:"Completed", cancelled:"Cancelled" };
const STATUS_PCT = { requested:12, accepted:40, inprogress:70, completed:100, cancelled:0 };

const api = (path, opts = {}) => {
  const token = localStorage.getItem("cr_token");
  return fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...opts,
  }).then(r => r.json());
};

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="stat-card" style={{ background: "linear-gradient(135deg,#0d0f15,#0a0c12)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1.25rem", transition: "all .2s", cursor: "default", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#4a5168", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "Space Mono,monospace", color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#4a5168" }}>{sub}</div>
    </div>
  );
}

export default function PassengerDashboard() {
  const { user } = useAuthStore();
  const [drivers, setDrivers] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ pickup:"", destination:"", isScheduled:false, scheduledAt:"" });
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const showToast = (msg, type="info") => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const loadData = useCallback(async () => {
    try {
      const [driversRes, ridesRes] = await Promise.all([
        api("/drivers/online"),
        api("/rides?limit=10"),
      ]);
      setDrivers(Array.isArray(driversRes) ? driversRes : []);
      if (ridesRes.rides) {
        const active = ridesRes.rides.find(r => ["requested","accepted","inprogress"].includes(r.status));
        setActiveRide(active || null);
        setHistory(ridesRes.rides.filter(r => ["completed","cancelled"].includes(r.status)));
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onAccepted = (ride) => { setActiveRide(ride); showToast(`🛺 ${ride.driver?.name} accepted your ride!`, "success"); };
    const onStarted = (ride) => { setActiveRide(ride); showToast("🚗 Your ride has started!", "info"); };
    const onCompleted = (ride) => { setActiveRide(ride); showToast("✅ Ride completed! Please rate your driver.", "success"); };
    const onCancelled = (ride) => { if (String(ride.passenger?._id||ride.passenger) === String(user?._id)) { setActiveRide(ride); showToast("Ride was cancelled", "warn"); } };
    const onDriverStatus = () => api("/drivers/online").then(d => setDrivers(Array.isArray(d) ? d : []));
    socket.on("ride:accepted", onAccepted);
    socket.on("ride:started", onStarted);
    socket.on("ride:completed", onCompleted);
    socket.on("ride:cancelled", onCancelled);
    socket.on("driver:status", onDriverStatus);
    if (activeRide?._id) socket.emit("ride:join", activeRide._id);
    return () => { socket.off("ride:accepted",onAccepted); socket.off("ride:started",onStarted); socket.off("ride:completed",onCompleted); socket.off("ride:cancelled",onCancelled); socket.off("driver:status",onDriverStatus); };
  }, [activeRide?._id, user?._id]);

  const requestRide = async () => {
    if (!form.pickup || !form.destination) { showToast("Enter pickup and destination","warn"); return; }
    if (form.pickup === form.destination) { showToast("Pickup and destination can't be same","warn"); return; }
    setLoading(true);
    try {
      const ride = await api("/rides", { method:"POST", body: JSON.stringify({ pickup:{name:form.pickup}, destination:{name:form.destination}, isScheduled:form.isScheduled, scheduledAt:form.scheduledAt||null }) });
      if (ride._id) {
        setActiveRide(ride);
        setForm(f => ({...f,pickup:"",destination:""}));
        showToast("🔍 Ride requested! Searching for drivers...", "info");
        getSocket()?.emit("ride:join", ride._id);
      } else { showToast(ride.message||"Failed to request","error"); }
    } catch { showToast("Network error","error"); }
    setLoading(false);
  };

  const cancelRide = async () => {
    try { await api(`/rides/${activeRide._id}/cancel`, {method:"PATCH",body:JSON.stringify({reason:"Cancelled by passenger"})}); setActiveRide(r=>({...r,status:"cancelled"})); showToast("Ride cancelled","warn"); }
    catch { showToast("Failed to cancel","error"); }
  };

  const submitRating = async () => {
    if (!rating) { showToast("Please select stars","warn"); return; }
    try {
      await api(`/rides/${activeRide._id}/rate`, {method:"POST",body:JSON.stringify({stars:rating,feedback})});
      showToast(`⭐ ${rating}-star rating submitted!`,"success");
      setActiveRide(null); setRating(0); setFeedback(""); loadData();
    } catch (err) { showToast(err.message||"Rating failed","error"); }
  };

  const isActiveRide = activeRide && !["completed","cancelled"].includes(activeRide.status);

  return (
    <PageLayout title="Dashboard" subtitle={`${greeting}, ${user?.name?.split(" ")[0]}`}>
      <div style={{ animation: "fadeUp .4s ease" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
          <StatCard label="Total Rides" value={history.length + (activeRide?1:0)} sub="All time" color="#00efff" icon="🚗" />
          <StatCard label="Online Drivers" value={drivers.length} sub="Available now" color="#00ff99" icon="🛺" />
          <StatCard label="My Rating" value={`${user?.rating||5.0}⭐`} sub="Avg rating" color="#ffdd57" icon="⭐" />
          <StatCard label="Status" value={activeRide ? STATUS_LABEL[activeRide.status]?.split(" ")[0] : "Ready"} sub={activeRide?"Ride active":"Book a ride below"} color={activeRide?STATUS_COLOR[activeRide.status]:"#7b5ea7"} icon="📍" />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem" }}>
          {/* LEFT */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

            {/* Active ride */}
            {isActiveRide && (
              <div style={{ background:"linear-gradient(135deg,#0d0f15,#0a0c12)", border:`1px solid ${STATUS_COLOR[activeRide.status]}33`, borderRadius:16, padding:"1.5rem", animation:"fadeUp .3s ease", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, right:0, width:120, height:120, background:`radial-gradient(circle at top right,${STATUS_COLOR[activeRide.status]}10,transparent 70%)`, pointerEvents:"none" }} />
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#8a92a8", textTransform:"uppercase", letterSpacing:2 }}>Active Ride</div>
                  <span style={{ padding:"3px 12px", borderRadius:20, fontSize:11, fontWeight:700, background:`${STATUS_COLOR[activeRide.status]}18`, color:STATUS_COLOR[activeRide.status], border:`1px solid ${STATUS_COLOR[activeRide.status]}33` }}>
                    {STATUS_LABEL[activeRide.status]}
                  </span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1.25rem" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:"#00ff99", boxShadow:"0 0 6px #00ff99", flexShrink:0 }} />
                      <span style={{ color:"#e8eaf0", fontWeight:500 }}>{activeRide.pickup?.name}</span>
                    </div>
                    <div style={{ width:1, height:16, background:"rgba(255,255,255,0.08)", marginLeft:4 }} />
                    <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:"#ff4d6d", boxShadow:"0 0 6px #ff4d6d", flexShrink:0 }} />
                      <span style={{ color:"#e8eaf0", fontWeight:500 }}>{activeRide.destination?.name}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, fontFamily:"Space Mono,monospace", color:"#00ff99" }}>₹{activeRide.fare}</div>
                </div>
                <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden", marginBottom:8 }}>
                  <div style={{ height:"100%", borderRadius:2, background:`linear-gradient(90deg,${STATUS_COLOR[activeRide.status]},${STATUS_COLOR[activeRide.status]}88)`, width:`${STATUS_PCT[activeRide.status]}%`, transition:"width 2s ease", boxShadow:`0 0 10px ${STATUS_COLOR[activeRide.status]}` }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1rem" }}>
                  {["Requested","Accepted","In Progress","Completed"].map((s,i) => {
                    const steps = ["requested","accepted","inprogress","completed"];
                    const done = i <= steps.indexOf(activeRide.status);
                    return <span key={s} style={{ fontSize:10, color:done?STATUS_COLOR[steps[i]]:"#2a2d3a", fontWeight:done?600:400 }}>{s}</span>;
                  })}
                </div>
                {activeRide.driver && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#00efff22,#00ff9922)", border:"1px solid rgba(0,239,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🛺</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{activeRide.driver.name}</div>
                      <div style={{ fontSize:11, color:"#8a92a8" }}>{activeRide.driver.vehicle?.type} · ⭐{activeRide.driver.rating}</div>
                    </div>
                    {activeRide.status==="accepted" && <span style={{ fontSize:11, color:"#00efff", background:"rgba(0,239,255,0.08)", padding:"4px 10px", borderRadius:20, border:"1px solid rgba(0,239,255,0.15)" }}>En route →</span>}
                  </div>
                )}
                {activeRide.status==="requested" && (
                  <button onClick={cancelRide} style={{ marginTop:"1rem", padding:"7px 16px", border:"1px solid rgba(255,77,109,0.3)", borderRadius:8, background:"rgba(255,77,109,0.06)", color:"#ff4d6d", fontSize:12, cursor:"pointer", transition:"all .2s" }}>Cancel Ride</button>
                )}
              </div>
            )}

            {/* Rating */}
            {activeRide?.status==="completed" && !activeRide.rating && (
              <div style={{ background:"linear-gradient(135deg,#0d0f15,#0a0c12)", border:"1px solid rgba(123,94,167,0.3)", borderRadius:16, padding:"1.5rem", animation:"fadeUp .3s ease" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#8a92a8", textTransform:"uppercase", letterSpacing:2, marginBottom:"1rem" }}>Rate Your Ride</div>
                <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} onClick={() => setRating(i)} style={{ fontSize:32, cursor:"pointer", transform:i<=rating?"scale(1.2)":"scale(1)", transition:"transform .15s", display:"inline-block", filter:i<=rating?"drop-shadow(0 0 8px #ffdd57)":"grayscale(1) opacity(0.4)" }}>⭐</span>
                  ))}
                </div>
                <input value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Optional feedback for the driver..." style={{ width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:13, outline:"none", marginBottom:12, boxSizing:"border-box" }} />
                <button onClick={submitRating} style={{ padding:"9px 22px", background:"linear-gradient(135deg,#00efff,#00ff99)", border:"none", borderRadius:10, color:"#000", fontWeight:700, fontSize:13, cursor:"pointer" }}>Submit Rating</button>
              </div>
            )}

            {/* Book ride form */}
            <div style={{ background:"linear-gradient(135deg,#0d0f15,#0a0c12)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"1.5rem" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8a92a8", textTransform:"uppercase", letterSpacing:2, marginBottom:"1.25rem" }}>Book a Ride</div>
              <div style={{ position:"relative", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, transition:"border-color .2s" }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:"#00ff99", boxShadow:"0 0 8px #00ff99", flexShrink:0 }} />
                  <input list="campus-locs" value={form.pickup} onChange={e=>setForm(f=>({...f,pickup:e.target.value}))} placeholder="Pickup location" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:14 }} />
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", paddingLeft:18, marginBottom:6 }}>
                <div style={{ width:1, height:20, background:"rgba(255,255,255,0.08)" }} />
              </div>
              <div style={{ marginBottom:"1.25rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:"#ff4d6d", boxShadow:"0 0 8px #ff4d6d", flexShrink:0 }} />
                  <input list="campus-locs" value={form.destination} onChange={e=>setForm(f=>({...f,destination:e.target.value}))} placeholder="Destination" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:14 }} />
                </div>
              </div>
              <datalist id="campus-locs">{CAMPUSES.map(c=><option key={c} value={c}/>)}</datalist>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:form.isScheduled?"1rem":"1.25rem" }}>
                <div onClick={()=>setForm(f=>({...f,isScheduled:!f.isScheduled}))} style={{ position:"relative", width:40, height:22, background:form.isScheduled?"rgba(0,239,255,0.2)":"rgba(255,255,255,0.05)", border:`1px solid ${form.isScheduled?"rgba(0,239,255,0.4)":"rgba(255,255,255,0.1)"}`, borderRadius:11, cursor:"pointer", transition:"all .3s" }}>
                  <div style={{ position:"absolute", width:16, height:16, background:form.isScheduled?"#00efff":"#3d4460", borderRadius:"50%", top:2, left:form.isScheduled?21:2, transition:"all .3s", boxShadow:form.isScheduled?"0 0 6px #00efff":"none" }} />
                </div>
                <span style={{ fontSize:13, color:"#8a92a8" }}>Schedule for later</span>
              </div>
              {form.isScheduled && <input type="datetime-local" value={form.scheduledAt} onChange={e=>setForm(f=>({...f,scheduledAt:e.target.value}))} style={{ width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:13, outline:"none", marginBottom:"1rem", boxSizing:"border-box" }} />}
              <button onClick={requestRide} disabled={loading||isActiveRide}
                style={{ width:"100%", padding:13, background:loading||isActiveRide?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#00efff,#00ff99)", border:`1px solid ${loading||isActiveRide?"rgba(255,255,255,0.08)":"transparent"}`, borderRadius:12, color:loading||isActiveRide?"#3d4460":"#000", fontWeight:800, fontSize:15, cursor:loading||isActiveRide?"not-allowed":"pointer", fontFamily:"DM Sans,sans-serif", transition:"all .2s", letterSpacing:.5 }}>
                {loading?"Requesting...":isActiveRide?"Ride in Progress...":"Request Ride →"}
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
            {/* Available drivers */}
            <div style={{ background:"linear-gradient(135deg,#0d0f15,#0a0c12)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"1.5rem" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#8a92a8", textTransform:"uppercase", letterSpacing:2 }}>Available Drivers</div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#00ff99", animation:"pulseDot 2s infinite" }} />
                  <span style={{ fontSize:11, color:"#00ff99" }}>{drivers.length} online</span>
                </div>
              </div>
              {drivers.length===0 && (
                <div style={{ textAlign:"center", padding:"1.5rem", color:"#4a5168", fontSize:13 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🛺</div>
                  No drivers online right now
                </div>
              )}
              {drivers.slice(0,4).map(d => (
                <div key={d._id} className="ride-row" style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10, marginBottom:8, transition:"all .2s", cursor:"default" }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#00efff18,#00ff9918)", border:"1px solid rgba(0,255,153,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🛺</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{d.name}</div>
                    <div style={{ fontSize:11, color:"#4a5168", marginTop:2 }}>{d.vehicle?.type} · ⭐{d.rating?.toFixed(1)}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:"#00ff99", boxShadow:"0 0 6px #00ff99" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent rides */}
            <div style={{ background:"linear-gradient(135deg,#0d0f15,#0a0c12)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"1.5rem", flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8a92a8", textTransform:"uppercase", letterSpacing:2, marginBottom:"1rem" }}>Recent Rides</div>
              {history.length===0 && <div style={{ textAlign:"center", padding:"2rem", color:"#4a5168", fontSize:13 }}><div style={{ fontSize:28, marginBottom:8 }}>🚗</div>No ride history yet</div>}
              {history.slice(0,4).map(r => (
                <div key={r._id} className="ride-row" style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10, marginBottom:8, transition:"all .2s" }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:r.status==="completed"?"rgba(0,255,153,0.1)":"rgba(255,77,109,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{r.status==="completed"?"✅":"❌"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500 }}>{r.pickup?.name} → {r.destination?.name}</div>
                    <div style={{ fontSize:11, color:"#4a5168", marginTop:2 }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {r.status==="completed" && <div style={{ fontSize:13, fontWeight:700, color:"#00ff99" }}>₹{r.fare}</div>}
                    {r.rating && <div style={{ fontSize:11, color:"#ffdd57" }}>{"⭐".repeat(r.rating)}</div>}
                    {r.status==="cancelled" && <div style={{ fontSize:11, color:"#ff4d6d" }}>Cancelled</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position:"fixed", top:76, right:20, background:"rgba(13,15,21,0.95)", backdropFilter:"blur(20px)", border:`1px solid ${toast.type==="success"?"rgba(0,255,153,0.3)":toast.type==="warn"?"rgba(255,221,87,0.3)":toast.type==="error"?"rgba(255,77,109,0.3)":"rgba(0,239,255,0.3)"}`, borderRadius:12, padding:"12px 18px", fontSize:13, display:"flex", alignItems:"center", gap:10, zIndex:9999, color:"#e8eaf0", maxWidth:320, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", animation:"slideIn .3s ease" }}>
          <span style={{ fontSize:18 }}>{toast.type==="success"?"✅":toast.type==="warn"?"⚠️":toast.type==="error"?"❌":"ℹ️"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </PageLayout>
  );
}
