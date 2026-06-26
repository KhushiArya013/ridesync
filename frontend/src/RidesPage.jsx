import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "./Authstore";
import { PageLayout } from "./Layout";
import { getSocket } from "./Socket";

const STATUS_COLOR = { requested:"#ffdd57", accepted:"#00efff", inprogress:"#00ff99", completed:"#7b5ea7", cancelled:"#ff4d6d" };

const api = (path, opts = {}) => {
  const token = localStorage.getItem("cr_token");
  return fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...opts,
  }).then(r => r.json());
};

export default function RidesPage() {
  const { user } = useAuthStore();
  const isDriver = user?.role === "driver";
  const [filter, setFilter] = useState("all");
  const [rides, setRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total:0, completed:0, todayRides:0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="info") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isDriver) {
        const [available, myRides] = await Promise.all([api("/rides/available"), api("/rides?limit=20")]);
        setRequests(Array.isArray(available) ? available : []);
        const rideList = Array.isArray(myRides.rides) ? myRides.rides : [];
        setRides(rideList);
        const today = new Date(); today.setHours(0,0,0,0);
        setStats({ total: myRides.total||0, completed: rideList.filter(r=>r.status==="completed").length, todayRides: rideList.filter(r=>new Date(r.createdAt)>=today).length });
      } else {
        const res = await api("/rides?limit=20");
        setRides(Array.isArray(res.rides) ? res.rides : []);
      }
    } catch(err) { console.error(err); }
    setLoading(false);
  }, [isDriver]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("ride:new", loadData);
    socket.on("ride:updated", loadData);
    socket.on("ride:cancelled", loadData);
    return () => { socket.off("ride:new", loadData); socket.off("ride:updated", loadData); socket.off("ride:cancelled", loadData); };
  }, [loadData]);

  const acceptRide = async (id) => {
    try {
      const ride = await api(`/rides/${id}/accept`, { method:"PATCH" });
      if (ride._id) { showToast(`Ride accepted! Head to ${ride.pickup?.name}`, "success"); loadData(); }
      else showToast(ride.message||"Could not accept","error");
    } catch { showToast("Failed to accept","error"); }
  };

  const rejectRide = async (id) => {
    try {
      await api(`/rides/${id}/cancel`, { method:"PATCH", body: JSON.stringify({ reason:"Driver rejected" }) });
      showToast("Ride rejected","warn"); loadData();
    } catch { showToast("Failed to reject","error"); }
  };

  const filtered = filter === "all" ? rides : rides.filter(r => r.status === filter);

  return (
    <PageLayout title={isDriver ? "Ride Requests" : "My Rides"}>
      {loading ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"#8a92a8" }}>Loading rides...</div>
      ) : isDriver ? (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
            {[["Pending",requests.length,"#ffdd57"],["Today",stats.todayRides,"#00ff99"],["Total",stats.total,"#00efff"]].map(([l,v,c])=>(
              <div key={l} style={{ background:"#151824", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"1rem 1.25rem" }}>
                <div style={{ fontSize:11, color:"#8a92a8", textTransform:"uppercase", letterSpacing:".8px", marginBottom:8 }}>{l}</div>
                <div style={{ fontSize:28, fontWeight:600, fontFamily:"Space Mono,monospace", color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:"#8a92a8", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"1rem" }}>
            Pending Requests {requests.length > 0 && <span style={{ background:"rgba(255,77,109,0.2)", color:"#ff4d6d", padding:"2px 8px", borderRadius:10, fontSize:11, marginLeft:8 }}>{requests.length}</span>}
          </div>
          {requests.length === 0 && <div style={{ background:"#151824", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"2.5rem", textAlign:"center", color:"#8a92a8", marginBottom:"1.5rem" }}><div style={{ fontSize:36, marginBottom:8 }}>🛺</div>No pending requests</div>}
          {requests.map(r => (
            <div key={r._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"1rem 1.25rem", background:"#151824", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, marginBottom:8 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"#1c2130", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🎓</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{r.passenger?.name}</div>
                <div style={{ fontSize:12, color:"#8a92a8", marginTop:2 }}>📍 {r.pickup?.name} → {r.destination?.name}</div>
                <div style={{ fontSize:11, color:"#4a5168", marginTop:2 }}>{new Date(r.createdAt).toLocaleTimeString()} · ₹{r.fare}</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => acceptRide(r._id)} style={{ padding:"6px 16px", border:"1px solid #00ff99", borderRadius:8, background:"rgba(0,255,153,0.1)", color:"#00ff99", fontSize:13, cursor:"pointer" }}>Accept</button>
                <button onClick={() => rejectRide(r._id)} style={{ padding:"6px 16px", border:"1px solid #ff4d6d", borderRadius:8, background:"transparent", color:"#ff4d6d", fontSize:13, cursor:"pointer" }}>Reject</button>
              </div>
            </div>
          ))}
          <div style={{ fontSize:13, fontWeight:600, color:"#8a92a8", textTransform:"uppercase", letterSpacing:"1.5px", margin:"1.5rem 0 1rem" }}>Completed Rides</div>
          {rides.filter(r=>r.status==="completed").length === 0 && <div style={{ fontSize:13, color:"#8a92a8" }}>No completed rides yet</div>}
          {rides.filter(r=>r.status==="completed").map(r => (
            <div key={r._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"1rem 1.25rem", background:"#151824", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, marginBottom:8 }}>
              <div style={{ width:38, height:38, borderRadius:"50%", background:"#1c2130", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✅</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{r.passenger?.name} — {r.pickup?.name} → {r.destination?.name}</div>
                <div style={{ fontSize:12, color:"#8a92a8" }}>{new Date(r.createdAt).toLocaleDateString()} · ₹{r.fare}</div>
              </div>
              {r.rating && <span style={{ fontSize:13, color:"#ffdd57" }}>{"⭐".repeat(r.rating)}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:"1.5rem", flexWrap:"wrap" }}>
            {["all","completed","cancelled","requested"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding:"6px 16px", border:`1px solid ${filter===f?"#00efff":"rgba(255,255,255,0.12)"}`, borderRadius:20, background:filter===f?"rgba(0,239,255,0.08)":"transparent", color:filter===f?"#00efff":"#8a92a8", fontSize:13, cursor:"pointer", transition:"all .2s", textTransform:"capitalize" }}>
                {f === "all" ? "All Rides" : f}
              </button>
            ))}
            <span style={{ marginLeft:"auto", fontSize:13, color:"#8a92a8", alignSelf:"center" }}>{filtered.length} rides</span>
          </div>
          {filtered.length === 0 && <div style={{ background:"#151824", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"3rem", textAlign:"center", color:"#8a92a8" }}><div style={{ fontSize:40, marginBottom:12 }}>🚗</div>No rides found</div>}
          {filtered.map(r => (
            <div key={r._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"1rem 1.25rem", background:"#151824", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, marginBottom:8 }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:"#1c2130", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🚗</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500 }}>{r.pickup?.name} → {r.destination?.name}</div>
                <div style={{ fontSize:12, color:"#8a92a8", marginTop:2 }}>{new Date(r.createdAt).toLocaleDateString()} · Driver: {r.driver?.name || "—"}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                <span style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:`${STATUS_COLOR[r.status]}22`, color:STATUS_COLOR[r.status] }}>{r.status}</span>
                {r.status==="completed" && <span style={{ fontSize:13, fontWeight:600, color:"#00ff99" }}>₹{r.fare}</span>}
                {r.rating && <span style={{ fontSize:12, color:"#ffdd57" }}>{"⭐".repeat(r.rating)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <div style={{ position:"fixed", top:70, right:20, background:"#151824", border:`1px solid rgba(255,255,255,0.1)`, borderLeft:`3px solid ${toast.type==="success"?"#00ff99":toast.type==="warn"?"#ffdd57":"#ff4d6d"}`, borderRadius:10, padding:"10px 16px", fontSize:13, display:"flex", alignItems:"center", gap:8, zIndex:9999, color:"#e8eaf0" }}><span>{toast.type==="success"?"✓":"⚠"}</span><span>{toast.msg}</span></div>}
    </PageLayout>
  );
}
