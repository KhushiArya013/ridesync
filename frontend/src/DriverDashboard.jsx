import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "./Layout";
import { getSocket } from "./Socket";
import { useAuthStore } from "./Authstore";

const api = (path, opts = {}) => {
  const token = localStorage.getItem("cr_token");
  return fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...opts,
  }).then(r => r.json());
};

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background:"linear-gradient(135deg,#0d0f15,#0a0c12)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"1.25rem", transition:"all .2s", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, right:0, width:60, height:60, background:`radial-gradient(circle at top right,${color}15,transparent 70%)` }} />
      <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:11, color:"#4a5168", textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700, fontFamily:"Space Mono,monospace", color, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:11, color:"#4a5168" }}>{sub}</div>
    </div>
  );
}

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [stats, setStats] = useState({ total:0, completed:0, todayRides:0, avgRating:"5.0", totalEarnings:0 });
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="info") => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    const isRealId = user._id && !user._id.startsWith("mock_");
    try {
      const [ridesRes, myRides] = await Promise.all([
        api("/rides/available"),
        api("/rides?limit=5"),
      ]);
      setRequests(Array.isArray(ridesRes) ? ridesRes : []);
      if (myRides.rides) {
        const active = myRides.rides.find(r => ["accepted","inprogress"].includes(r.status));
        setActiveRide(active || null);
        setHistory(myRides.rides.filter(r => r.status==="completed"));
      }
      if (isRealId) {
        const dashRes = await api(`/drivers/${user._id}/dashboard`);
        if (dashRes.total !== undefined) setStats(dashRes);
      }
    } catch (err) { console.error(err); }
  }, [user?._id]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNewRide = (ride) => {
      if (!isOnline) return;
      setRequests(rs => [ride, ...rs.filter(r => r._id !== ride._id)]);
      showToast(`🔔 New ride from ${ride.passenger?.name}!`, "warn");
    };
    const onCancelled = (ride) => {
      setRequests(rs => rs.filter(r => r._id !== ride._id));
      if (activeRide?._id === ride._id) { setActiveRide(null); showToast("Passenger cancelled","warn"); }
    };
    socket.on("ride:new", onNewRide);
    socket.on("ride:cancelled", onCancelled);
    socket.on("ride:updated", loadData);
    return () => { socket.off("ride:new",onNewRide); socket.off("ride:cancelled",onCancelled); socket.off("ride:updated",loadData); };
  }, [isOnline, activeRide?._id, loadData]);

  const toggleOnline = async () => {
    const next = !isOnline;
    try {
      await api("/drivers/status", { method:"PATCH", body:JSON.stringify({ isOnline:next }) });
      getSocket()?.emit(next?"driver:goOnline":"driver:goOffline");
      setIsOnline(next);
      showToast(next?"✅ You are now Online!":"⚫ You are now Offline", next?"success":"warn");
      if (next) loadData();
    } catch { showToast("Failed to update status","error"); }
  };

  const acceptRide = async (id) => {
    try {
      const ride = await api(`/rides/${id}/accept`, { method:"PATCH" });
      if (ride._id) {
        setRequests(rs => rs.filter(r => r._id !== id));
        setActiveRide(ride);
        getSocket()?.emit("ride:join", ride._id);
        showToast(`✅ Accepted! Head to ${ride.pickup?.name}`, "success");
      } else { showToast(ride.message||"Could not accept","error"); loadData(); }
    } catch { showToast("Failed to accept","error"); }
  };

  const rejectRide = (id) => { setRequests(rs => rs.filter(r => r._id !== id)); showToast("Ride rejected","warn"); };
  const startRide = async () => {
    try { const ride = await api(`/rides/${activeRide._id}/start`, {method:"PATCH"}); setActiveRide(ride); showToast("🚗 Ride started!","success"); }
    catch { showToast("Failed to start","error"); }
  };
  const completeRide = async () => {
    try { const ride = await api(`/rides/${activeRide._id}/complete`, {method:"PATCH"}); setActiveRide(null); showToast(`💰 Completed! ₹${ride.fare} earned`,"success"); loadData(); }
    catch { showToast("Failed to complete","error"); }
  };

  const STATUS_COLOR = { accepted:"#00efff", inprogress:"#00ff99" };

  return (
    <PageLayout title="Driver Dashboard" isOnline={isOnline} onToggleOnline={toggleOnline} pendingCount={requests.length}>
      <div style={{ animation:"fadeUp .4s ease" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
          <StatCard label="Total Rides" value={stats.total} sub="All time" color="#00efff" icon="🚗" />
          <StatCard label="Today" value={stats.todayRides||0} sub="Completed today" color="#ffdd57" icon="📅" />
          <StatCard label="Rating" value={`${stats.avgRating||"5.0"}⭐`} sub="Average score" color="#00ff99" icon="⭐" />
          <StatCard label="Earnings" value={`₹${stats.totalEarnings||0}`} sub="Total earned" color="#7b5ea7" icon="💰" />
        </div>

        {/* Offline banner */}
        {!isOnline && (
          <div style={{ background:"linear-gradient(135deg,rgba(255,221,87,0.06),rgba(255,221,87,0.02))", border:"1px solid rgba(255,221,87,0.2)", borderRadius:14, padding:"1.25rem 1.5rem", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:14, animation:"fadeUp .3s ease" }}>
            <div style={{ fontSize:32 }}>⚠️</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#ffdd57" }}>You're currently offline</div>
              <div style={{ fontSize:13, color:"#4a5168", marginTop:3 }}>Toggle the status switch in the header to start receiving ride requests</div>
            </div>
            <button onClick={toggleOnline} style={{ marginLeft:"auto", padding:"8px 20px", background:"linear-gradient(135deg,#ffdd57,#ffba08)", border:"none", borderRadius:10, color:"#000", fontWeight:700, fontSize:13, cursor:"pointer" }}>Go Online →</button>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"1.25rem" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

            {/* Active ride */}
            {activeRide && (
              <div style={{ background:"linear-gradient(135deg,#0d0f15,#0a0c12)", border:`1px solid ${STATUS_COLOR[activeRide.status]}33`, borderRadius:16, padding:"1.5rem", position:"relative", overflow:"hidden", animation:"fadeUp .3s ease" }}>
                <div style={{ position:"absolute", top:0, right:0, width:150, height:150, background:`radial-gradient(circle at top right,${STATUS_COLOR[activeRide.status]}08,transparent 70%)` }} />
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#8a92a8", textTransform:"uppercase", letterSpacing:2 }}>Active Ride</div>
                  <span style={{ padding:"4px 14px", borderRadius:20, fontSize:11, fontWeight:700, background:`${STATUS_COLOR[activeRide.status]}15`, color:STATUS_COLOR[activeRide.status], border:`1px solid ${STATUS_COLOR[activeRide.status]}33` }}>
                    {activeRide.status==="accepted"?"Heading to Pickup":"In Progress"}
                  </span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:"1.25rem", padding:"12px", background:"rgba(255,255,255,0.02)", borderRadius:12, border:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,rgba(0,239,255,0.1),rgba(0,255,153,0.1))", border:"1px solid rgba(0,239,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🎓</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700 }}>{activeRide.passenger?.name}</div>
                    <div style={{ fontSize:12, color:"#4a5168", marginTop:3 }}>📍 {activeRide.pickup?.name} → {activeRide.destination?.name}</div>
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, fontFamily:"Space Mono,monospace", color:"#00ff99" }}>₹{activeRide.fare}</div>
                </div>
                <div style={{ height:3, background:"rgba(255,255,255,0.04)", borderRadius:2, overflow:"hidden", marginBottom:"1.25rem" }}>
                  <div style={{ height:"100%", borderRadius:2, background:`linear-gradient(90deg,${STATUS_COLOR[activeRide.status]},${STATUS_COLOR[activeRide.status]}66)`, width:activeRide.status==="accepted"?"40%":"80%", transition:"width 1s", boxShadow:`0 0 10px ${STATUS_COLOR[activeRide.status]}` }} />
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  {activeRide.status==="accepted" && <button onClick={startRide} style={{ flex:1, padding:"11px", background:"linear-gradient(135deg,#00efff,#0099aa)", border:"none", borderRadius:12, color:"#000", fontWeight:800, fontSize:14, cursor:"pointer" }}>Start Ride 🚗</button>}
                  {activeRide.status==="inprogress" && <button onClick={completeRide} style={{ flex:1, padding:"11px", background:"linear-gradient(135deg,#00ff99,#00aa66)", border:"none", borderRadius:12, color:"#000", fontWeight:800, fontSize:14, cursor:"pointer" }}>Complete Ride ✅</button>}
                </div>
              </div>
            )}

            {/* Incoming requests */}
            <div style={{ background:"linear-gradient(135deg,#0d0f15,#0a0c12)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"1.5rem" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#8a92a8", textTransform:"uppercase", letterSpacing:2 }}>Incoming Requests</div>
                {requests.length > 0 && (
                  <div style={{ padding:"3px 10px", background:"rgba(255,77,109,0.12)", border:"1px solid rgba(255,77,109,0.3)", borderRadius:20, fontSize:11, fontWeight:700, color:"#ff4d6d", animation:"ping 1s infinite" }}>
                    {requests.length} new
                  </div>
                )}
              </div>
              {requests.length===0 && (
                <div style={{ textAlign:"center", padding:"2.5rem 1rem", color:"#4a5168" }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>🛺</div>
                  <div style={{ fontSize:14, marginBottom:6 }}>{isOnline?"Waiting for requests...":"Go online to receive requests"}</div>
                  <div style={{ fontSize:12, color:"#2a2d3a" }}>Requests appear here in real-time</div>
                </div>
              )}
              {requests.map(r => (
                <div key={r._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, marginBottom:10, animation:"fadeUp .3s ease" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,rgba(0,239,255,0.08),rgba(0,255,153,0.08))", border:"1px solid rgba(0,239,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🎓</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{r.passenger?.name}</div>
                    <div style={{ fontSize:12, color:"#4a5168", marginTop:3 }}>📍 {r.pickup?.name} → {r.destination?.name}</div>
                    <div style={{ fontSize:11, color:"#2a2d3a", marginTop:3 }}>{new Date(r.createdAt).toLocaleTimeString()} · ₹{r.fare} · {r.distance?.toFixed(1)||"?"}km</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <button onClick={()=>acceptRide(r._id)} disabled={!!activeRide} style={{ padding:"7px 18px", border:"1px solid rgba(0,255,153,0.3)", borderRadius:9, background:activeRide?"transparent":"rgba(0,255,153,0.08)", color:activeRide?"#2a2d3a":"#00ff99", fontSize:12, fontWeight:700, cursor:activeRide?"not-allowed":"pointer", transition:"all .2s" }}>Accept</button>
                    <button onClick={()=>rejectRide(r._id)} style={{ padding:"7px 18px", border:"1px solid rgba(255,77,109,0.3)", borderRadius:9, background:"transparent", color:"#ff4d6d", fontSize:12, fontWeight:700, cursor:"pointer" }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right col */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
            <div style={{ background:"linear-gradient(135deg,#0d0f15,#0a0c12)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"1.5rem" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8a92a8", textTransform:"uppercase", letterSpacing:2, marginBottom:"1rem" }}>Recent Rides</div>
              {history.length===0 && <div style={{ textAlign:"center", padding:"1.5rem", color:"#4a5168", fontSize:13 }}>No completed rides yet</div>}
              {history.slice(0,5).map(r => (
                <div key={r._id} style={{ padding:"10px 12px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:10, marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                    <span style={{ fontWeight:600 }}>{r.passenger?.name||"Passenger"}</span>
                    <span style={{ color:"#00ff99", fontWeight:700 }}>₹{r.fare}</span>
                  </div>
                  <div style={{ fontSize:11, color:"#4a5168" }}>{r.pickup?.name} → {r.destination?.name}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                    <span style={{ fontSize:10, color:"#2a2d3a" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                    {r.rating && <span style={{ fontSize:11 }}>{"⭐".repeat(r.rating)}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:"linear-gradient(135deg,#0d0f15,#0a0c12)", border:`1px solid ${isOnline?"rgba(0,255,153,0.15)":"rgba(255,255,255,0.06)"}`, borderRadius:16, padding:"1.5rem" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8a92a8", textTransform:"uppercase", letterSpacing:2, marginBottom:"1rem" }}>Live Status</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:isOnline?"#00ff99":"#2a2d3a", boxShadow:isOnline?"0 0 10px #00ff99":"none", animation:isOnline?"pulseDot 2s infinite":"none" }} />
                <span style={{ fontSize:14, fontWeight:700, color:isOnline?"#00ff99":"#4a5168" }}>{isOnline?"Online & Ready":"Offline"}</span>
              </div>
              {[["Pending Requests", requests.length, "#ffdd57"],["Active Ride", activeRide?"Yes":"None", activeRide?"#00efff":"#4a5168"],["Total Today", stats.todayRides||0, "#00ff99"]].map(([l,v,c])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize:12, color:"#4a5168" }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:c }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position:"fixed", top:76, right:20, background:"rgba(13,15,21,0.95)", backdropFilter:"blur(20px)", border:`1px solid ${toast.type==="success"?"rgba(0,255,153,0.3)":toast.type==="warn"?"rgba(255,221,87,0.3)":"rgba(255,77,109,0.3)"}`, borderRadius:12, padding:"12px 18px", fontSize:13, display:"flex", alignItems:"center", gap:10, zIndex:9999, color:"#e8eaf0", maxWidth:320, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", animation:"slideIn .3s ease" }}>
          <span style={{ fontSize:18 }}>{toast.type==="success"?"✅":toast.type==="warn"?"⚠️":"❌"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </PageLayout>
  );
}