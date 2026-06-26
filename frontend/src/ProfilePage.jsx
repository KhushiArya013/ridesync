import { useState, useEffect } from "react";
import { PageLayout } from "./Layout";
import { useAuthStore } from "./Authstore";

const api = (path, opts = {}) => {
  const token = localStorage.getItem("cr_token");
  return fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...opts,
  }).then(r => r.json());
};

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const isDriver = user?.role === "driver";
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name||"", phone: user?.phone||"" });
  const [stats, setStats] = useState({ totalRides:0, rating:5.0, totalEarnings:0 });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type="info") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    api("/users/profile").then(data => {
      if (data._id) {
        updateUser(data);
        setForm({ name: data.name||"", phone: data.phone||"" });
        setStats({ totalRides: data.totalRides||0, rating: data.rating||5.0, totalEarnings: data.totalEarnings||0 });
      }
    }).catch(console.error);
  }, []);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const data = await api("/users/profile", { method:"PATCH", body: JSON.stringify(form) });
      if (data._id) { updateUser(data); showToast("Profile updated!","success"); setEditing(false); }
      else showToast(data.message||"Failed to update","error");
    } catch { showToast("Network error","error"); }
    setLoading(false);
  };

  return (
    <PageLayout title="Profile">
      <div style={{ maxWidth:600, margin:"0 auto" }}>

        {/* Profile card */}
        <div style={{ background:"#0e1018", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden", marginBottom:"1rem" }}>
          {/* Banner */}
          <div style={{ height:100, background:"linear-gradient(135deg,#0ef3,#0f93)", position:"relative" }}>
            <div style={{ position:"absolute", bottom:-28, left:24, width:56, height:56, background:"linear-gradient(135deg,#00efff,#00ff99)", border:"3px solid #0e1018", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, color:"#000" }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} style={{ position:"absolute", top:12, right:12, padding:"6px 14px", background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, color:"#e8eaf0", fontSize:12, cursor:"pointer" }}>Edit Profile</button>
            )}
          </div>

          <div style={{ padding:"2.5rem 1.5rem 1.5rem" }}>
            {editing ? (
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div>
                  <label style={{ fontSize:12, color:"#8a92a8", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".5px" }}>Full Name</label>
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{ width:"100%", padding:"10px 12px", background:"#151824", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:14, outline:"none", boxSizing:"border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize:12, color:"#8a92a8", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".5px" }}>Phone</label>
                  <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+91 9876543210" style={{ width:"100%", padding:"10px 12px", background:"#151824", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:14, outline:"none", boxSizing:"border-box" }} />
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={saveProfile} disabled={loading} style={{ flex:1, padding:"10px", background:"#00efff", border:"none", borderRadius:10, color:"#000", fontWeight:700, fontSize:14, cursor:"pointer" }}>{loading?"Saving...":"Save Changes"}</button>
                  <button onClick={() => setEditing(false)} style={{ padding:"10px 20px", background:"transparent", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#8a92a8", fontSize:14, cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700 }}>{user?.name}</h2>
                <p style={{ margin:"0 0 4px", fontSize:13, color:"#8a92a8" }}>{user?.email}</p>
                {user?.phone && <p style={{ margin:0, fontSize:13, color:"#8a92a8" }}>{user.phone}</p>}
                <span style={{ display:"inline-flex", marginTop:8, padding:"3px 12px", borderRadius:20, fontSize:11, fontWeight:600, background:isDriver?"rgba(0,255,153,0.12)":"rgba(0,239,255,0.12)", color:isDriver?"#00ff99":"#00efff" }}>
                  {isDriver ? "🛺 Driver" : "🎓 Passenger"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1rem" }}>
          {[
            ["Total Rides", stats.totalRides, "#00efff"],
            ["Avg Rating", `${Number(stats.rating).toFixed(1)} ⭐`, "#ffdd57"],
            isDriver ? ["Earnings", `₹${stats.totalEarnings}`, "#00ff99"] : ["Campus", "IIITL", "#7b5ea7"],
          ].map(([l,v,c]) => (
            <div key={l} style={{ background:"#0e1018", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"1rem" }}>
              <div style={{ fontSize:11, color:"#8a92a8", textTransform:"uppercase", letterSpacing:".8px", marginBottom:8 }}>{l}</div>
              <div style={{ fontSize:20, fontWeight:600, fontFamily:"Space Mono,monospace", color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Driver vehicle info */}
        {isDriver && (
          <div style={{ background:"#0e1018", border:"1px solid rgba(0,255,153,0.15)", borderRadius:12, padding:"1.25rem", marginBottom:"1rem" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#00ff99", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"1rem" }}>Vehicle Info</div>
            {[
              ["Vehicle Type", user?.vehicle?.type || "E-Rickshaw"],
              ["License Number", user?.vehicle?.licenseNumber || "—"],
              ["Status", "Active & Verified"],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize:13, color:"#8a92a8" }}>{k}</span>
                <span style={{ fontSize:13, fontWeight:500, color:"#e8eaf0" }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Account info */}
        <div style={{ background:"#0e1018", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"1.25rem" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#8a92a8", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"1rem" }}>Account</div>
          {[
            ["Email", user?.email],
            ["Role", user?.role],
            ["Campus", "IIIT Lucknow"],
            ["Member Since", user?._id ? new Date(parseInt(user._id.substring(0,8),16)*1000).toLocaleDateString() : "—"],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize:13, color:"#8a92a8" }}>{k}</span>
              <span style={{ fontSize:13, color:"#e8eaf0", textTransform:"capitalize" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {toast && <div style={{ position:"fixed", top:70, right:20, background:"#151824", border:`1px solid rgba(255,255,255,0.1)`, borderLeft:`3px solid ${toast.type==="success"?"#00ff99":"#ff4d6d"}`, borderRadius:10, padding:"10px 16px", fontSize:13, display:"flex", alignItems:"center", gap:8, zIndex:9999, color:"#e8eaf0" }}><span>{toast.type==="success"?"✓":"✕"}</span><span>{toast.msg}</span></div>}
    </PageLayout>
  );
}
