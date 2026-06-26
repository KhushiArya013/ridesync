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

const UPI_ID = "campusride@upi";

export default function PaymentPage() {
  const { user } = useAuthStore();
  const [rides, setRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [step, setStep] = useState("select"); // select | confirm | success
  const [toast, setToast] = useState(null);
  const [totalSpent, setTotalSpent] = useState(0);

  const showToast = (msg, type="info") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    api("/rides?limit=20").then(res => {
      const completed = (res.rides||[]).filter(r => r.status === "completed");
      setRides(completed);
      setTotalSpent(completed.reduce((s,r) => s + (r.fare||0), 0));
    }).catch(console.error);
  }, []);

  const processPayment = () => {
    if (method === "upi" && !upiId) { showToast("Enter UPI ID","warn"); return; }
    setStep("confirm");
  };

  const confirmPayment = () => {
    setTimeout(() => { setStep("success"); showToast("Payment successful!","success"); }, 1500);
  };

  const QRCode = ({ amount }) => (
    <div style={{ background:"#fff", padding:16, borderRadius:12, display:"inline-block" }}>
      <div style={{ width:160, height:160, background:"#fff", display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:2 }}>
        {Array(64).fill(0).map((_,i) => (
          <div key={i} style={{ background: Math.random()>0.5?"#000":"#fff", borderRadius:1 }} />
        ))}
      </div>
      <div style={{ textAlign:"center", marginTop:8, fontSize:12, color:"#000", fontWeight:600 }}>₹{amount} · {UPI_ID}</div>
    </div>
  );

  return (
    <PageLayout title="Payments">
      <div style={{ maxWidth:600, margin:"0 auto" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
          {[
            ["Total Spent", `₹${totalSpent}`, "#00efff"],
            ["Rides Paid", rides.length, "#00ff99"],
            ["Avg Fare", rides.length ? `₹${Math.round(totalSpent/rides.length)}` : "₹0", "#ffdd57"],
          ].map(([l,v,c]) => (
            <div key={l} style={{ background:"#0e1018", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"1rem 1.25rem" }}>
              <div style={{ fontSize:11, color:"#8a92a8", textTransform:"uppercase", letterSpacing:".8px", marginBottom:8 }}>{l}</div>
              <div style={{ fontSize:24, fontWeight:600, fontFamily:"Space Mono,monospace", color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {step === "success" ? (
          <div style={{ background:"#0e1018", border:"1px solid rgba(0,255,153,0.3)", borderRadius:16, padding:"3rem", textAlign:"center" }}>
            <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
            <div style={{ fontSize:22, fontWeight:700, color:"#00ff99", marginBottom:8 }}>Payment Successful!</div>
            <div style={{ fontSize:14, color:"#8a92a8", marginBottom:"1.5rem" }}>₹{selectedRide?.fare} paid via {method.toUpperCase()}</div>
            <button onClick={() => { setStep("select"); setSelectedRide(null); setUpiId(""); }} style={{ padding:"10px 24px", background:"#00efff", border:"none", borderRadius:10, color:"#000", fontWeight:700, fontSize:14, cursor:"pointer" }}>Done</button>
          </div>
        ) : step === "confirm" ? (
          <div style={{ background:"#0e1018", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"2rem" }}>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:"1.5rem" }}>Confirm Payment</div>
            <div style={{ background:"#151824", borderRadius:12, padding:"1.25rem", marginBottom:"1.5rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, marginBottom:8 }}>
                <span style={{ color:"#8a92a8" }}>Ride</span>
                <span>{selectedRide?.pickup?.name} → {selectedRide?.destination?.name}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, marginBottom:8 }}>
                <span style={{ color:"#8a92a8" }}>Amount</span>
                <span style={{ color:"#00ff99", fontWeight:700 }}>₹{selectedRide?.fare}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:14 }}>
                <span style={{ color:"#8a92a8" }}>Method</span>
                <span>{method === "upi" ? `UPI · ${upiId}` : "QR Code"}</span>
              </div>
            </div>
            {method === "qr" && (
              <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
                <QRCode amount={selectedRide?.fare} />
                <div style={{ fontSize:12, color:"#8a92a8", marginTop:8 }}>Scan with any UPI app</div>
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={confirmPayment} style={{ flex:1, padding:"12px", background:"#00efff", border:"none", borderRadius:10, color:"#000", fontWeight:700, fontSize:14, cursor:"pointer" }}>Pay ₹{selectedRide?.fare}</button>
              <button onClick={() => setStep("select")} style={{ padding:"12px 20px", background:"transparent", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#8a92a8", fontSize:14, cursor:"pointer" }}>Back</button>
            </div>
          </div>
        ) : (
          <div>
            {/* Pay for a ride */}
            {selectedRide ? (
              <div style={{ background:"#0e1018", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"1.5rem", marginBottom:"1rem" }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:"1rem" }}>Pay for Ride</div>
                <div style={{ background:"#151824", borderRadius:10, padding:"1rem", marginBottom:"1rem", fontSize:13 }}>
                  <div style={{ fontWeight:600, marginBottom:4 }}>{selectedRide.pickup?.name} → {selectedRide.destination?.name}</div>
                  <div style={{ color:"#8a92a8" }}>Driver: {selectedRide.driver?.name || "—"} · ₹{selectedRide.fare}</div>
                </div>

                {/* Payment method */}
                <div style={{ display:"flex", gap:10, marginBottom:"1rem" }}>
                  {[["upi","💳 UPI"],["qr","📱 QR Code"]].map(([m,l]) => (
                    <button key={m} onClick={() => setMethod(m)} style={{ flex:1, padding:"10px", border:`1px solid ${method===m?"#00efff":"rgba(255,255,255,0.12)"}`, borderRadius:10, background:method===m?"rgba(0,239,255,0.08)":"transparent", color:method===m?"#00efff":"#8a92a8", fontSize:13, cursor:"pointer" }}>{l}</button>
                  ))}
                </div>

                {method === "upi" && (
                  <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="Enter UPI ID (e.g. name@upi)" style={{ width:"100%", padding:"10px 12px", background:"#151824", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#e8eaf0", fontFamily:"DM Sans,sans-serif", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:"1rem" }} />
                )}
                {method === "qr" && (
                  <div style={{ textAlign:"center", marginBottom:"1rem" }}>
                    <QRCode amount={selectedRide.fare} />
                  </div>
                )}

                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={processPayment} style={{ flex:1, padding:"11px", background:"#00efff", border:"none", borderRadius:10, color:"#000", fontWeight:700, fontSize:14, cursor:"pointer" }}>Pay ₹{selectedRide.fare}</button>
                  <button onClick={() => setSelectedRide(null)} style={{ padding:"11px 16px", background:"transparent", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#8a92a8", fontSize:14, cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            ) : null}

            {/* Ride history */}
            <div style={{ fontSize:13, fontWeight:600, color:"#8a92a8", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"1rem" }}>Payment History</div>
            {rides.length === 0 && <div style={{ background:"#0e1018", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"2.5rem", textAlign:"center", color:"#8a92a8" }}><div style={{ fontSize:36, marginBottom:8 }}>💳</div>No completed rides yet</div>}
            {rides.map(r => (
              <div key={r._id} onClick={() => setSelectedRide(r)} style={{ display:"flex", alignItems:"center", gap:12, padding:"1rem 1.25rem", background:selectedRide?._id===r._id?"rgba(0,239,255,0.06)":"#0e1018", border:`1px solid ${selectedRide?._id===r._id?"rgba(0,239,255,0.3)":"rgba(255,255,255,0.07)"}`, borderRadius:12, marginBottom:8, cursor:"pointer", transition:"all .2s" }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(0,255,153,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>💰</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{r.pickup?.name} → {r.destination?.name}</div>
                  <div style={{ fontSize:12, color:"#8a92a8", marginTop:2 }}>{new Date(r.createdAt).toLocaleDateString()} · Driver: {r.driver?.name||"—"}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"#00ff99" }}>₹{r.fare}</div>
                  <div style={{ fontSize:11, color:"#8a92a8", marginTop:2 }}>Tap to pay</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <div style={{ position:"fixed", top:70, right:20, background:"#151824", border:`1px solid rgba(255,255,255,0.1)`, borderLeft:`3px solid ${toast.type==="success"?"#00ff99":"#ffdd57"}`, borderRadius:10, padding:"10px 16px", fontSize:13, display:"flex", alignItems:"center", gap:8, zIndex:9999, color:"#e8eaf0" }}><span>{toast.type==="success"?"✓":"⚠"}</span><span>{toast.msg}</span></div>}
    </PageLayout>
  );
}
