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

const PEAK_HOURS = [
  { hour: "7-9 AM", demand: 95, label: "Morning Rush", tip: "Position near hostels" },
  { hour: "12-2 PM", demand: 70, label: "Lunch Break", tip: "Cafeteria & canteens" },
  { hour: "5-7 PM", demand: 88, label: "Evening Peak", tip: "Academic blocks to hostels" },
  { hour: "9-11 PM", demand: 45, label: "Night Shift", tip: "Library to hostels" },
];

const ZONES = [
  { name: "Academic Zone", demand: 92, color: "#ff4d6d", rides: 142 },
  { name: "Hostel Area", demand: 85, color: "#ffdd57", rides: 118 },
  { name: "Main Gate", demand: 78, color: "#00efff", rides: 98 },
  { name: "Sports Complex", demand: 45, color: "#00ff99", rides: 52 },
  { name: "Medical Center", demand: 30, color: "#7b5ea7", rides: 34 },
];

export default function EarningsPage() {
  const { user } = useAuthStore();
  const [rides, setRides] = useState([]);
  const [stats, setStats] = useState({ total: 0, week: 0, today: 0, avgFare: 0 });
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api("/rides?limit=50");
        const completed = (res.rides || []).filter(r => r.status === "completed");
        setRides(completed);

        const total = completed.reduce((s, r) => s + (r.fare || 0), 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayRides = completed.filter(r => new Date(r.createdAt) >= today);
        const todayEarnings = todayRides.reduce((s, r) => s + (r.fare || 0), 0);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekRides = completed.filter(r => new Date(r.createdAt) >= weekAgo);
        const weekEarnings = weekRides.reduce((s, r) => s + (r.fare || 0), 0);

        setStats({
          total,
          week: weekEarnings,
          today: todayEarnings,
          avgFare: completed.length ? Math.round(total / completed.length) : 0,
        });

        // Build week chart data
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
          const next = new Date(d); next.setDate(next.getDate() + 1);
          const dayRides = completed.filter(r => {
            const rd = new Date(r.createdAt);
            return rd >= d && rd < next;
          });
          days.push({
            label: d.toLocaleDateString("en-US", { weekday: "short" }),
            earnings: dayRides.reduce((s, r) => s + (r.fare || 0), 0),
            rides: dayRides.length,
          });
        }
        setWeekData(days);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  const maxEarnings = Math.max(...weekData.map(d => d.earnings), 1);

  return (
    <PageLayout title="Earnings Intelligence">
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#8a92a8" }}>Loading earnings data...</div>
      ) : (
        <div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              ["Total Earned", `₹${stats.total}`, "#00ff99", "All time"],
              ["This Week", `₹${stats.week}`, "#00efff", "Last 7 days"],
              ["Today", `₹${stats.today}`, "#ffdd57", "Earnings today"],
              ["Avg Fare", `₹${stats.avgFare}`, "#7b5ea7", "Per ride"],
            ].map(([l, v, c, s]) => (
              <div key={l} style={{ background: "#151824", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 11, color: "#8a92a8", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 8 }}>{l}</div>
                <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "Space Mono,monospace", color: c }}>{v}</div>
                <div style={{ fontSize: 11, color: "#8a92a8", marginTop: 4 }}>{s}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
            {[["overview", "Overview"], ["zones", "Demand Zones"], ["hours", "Peak Hours"], ["history", "History"]].map(([t, l]) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "7px 16px", border: `1px solid ${activeTab === t ? "#00efff" : "rgba(255,255,255,0.12)"}`, borderRadius: 20, background: activeTab === t ? "rgba(0,239,255,0.08)" : "transparent", color: activeTab === t ? "#00efff" : "#8a92a8", fontSize: 13, cursor: "pointer", transition: "all .2s" }}>{l}</button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* Weekly chart */}
              <div style={{ background: "#0e1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.25rem" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#8a92a8", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "1.25rem" }}>Weekly Earnings</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, marginBottom: 8 }}>
                  {weekData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10, color: "#8a92a8" }}>₹{d.earnings}</span>
                      <div style={{ width: "100%", background: "linear-gradient(to top,#00efff,#00ff99)", borderRadius: "4px 4px 0 0", height: `${(d.earnings / maxEarnings) * 100}%`, minHeight: d.earnings > 0 ? 4 : 0, opacity: 0.8, transition: "height .5s" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {weekData.map((d, i) => (
                    <span key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "#4a5168" }}>{d.label}</span>
                  ))}
                </div>
              </div>

              {/* Smart insights */}
              <div style={{ background: "#0e1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.25rem" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#8a92a8", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "1rem" }}>Smart Insights</div>
                {[
                  { icon: "🔥", text: "Peak hours are 7-9 AM & 5-7 PM", sub: "Go online during these times for 40% more earnings" },
                  { icon: "📍", text: "Academic Zone has highest demand", sub: "Position near lecture halls between 8-10 AM" },
                  { icon: "💡", text: "Monday & Friday are busiest days", sub: "Plan your schedule around these days" },
                  { icon: "⚡", text: "Short rides earn more per km", sub: "Campus internal rides are most profitable" },
                ].map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <span style={{ fontSize: 20 }}>{tip.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{tip.text}</div>
                      <div style={{ fontSize: 11, color: "#8a92a8", marginTop: 2 }}>{tip.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "zones" && (
            <div style={{ background: "#0e1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.25rem" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#8a92a8", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "1.25rem" }}>Live Demand Zones</div>
              <div style={{ fontSize: 12, color: "#8a92a8", marginBottom: "1.25rem" }}>🔴 High demand zones where you should position yourself right now</div>
              {ZONES.map((z, i) => (
                <div key={i} style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>{z.name}</span>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ color: "#8a92a8" }}>{z.rides} rides</span>
                      <span style={{ color: z.color, fontWeight: 600 }}>{z.demand}% demand</span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: "#1c2130", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 4, background: z.color, width: `${z.demand}%`, transition: "width 1s ease", opacity: 0.8 }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: "1.5rem", background: "rgba(0,239,255,0.06)", border: "1px solid rgba(0,239,255,0.15)", borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#00efff", marginBottom: 6 }}>🤖 AI Recommendation</div>
                <div style={{ fontSize: 13, color: "#8a92a8" }}>Head to the <span style={{ color: "#ff4d6d", fontWeight: 600 }}>Academic Zone</span> right now — 3 pending ride requests with no drivers nearby. Estimated wait bonus: ₹15 extra.</div>
              </div>
            </div>
          )}

          {activeTab === "hours" && (
            <div style={{ background: "#0e1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.25rem" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#8a92a8", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "1.25rem" }}>Peak Hour Analysis</div>
              {PEAK_HOURS.map((h, i) => (
                <div key={i} style={{ background: "#151824", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{h.hour}</div>
                      <div style={{ fontSize: 12, color: "#8a92a8", marginTop: 2 }}>{h.label}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: h.demand > 80 ? "#ff4d6d" : h.demand > 60 ? "#ffdd57" : "#00ff99" }}>{h.demand}%</div>
                      <div style={{ fontSize: 11, color: "#8a92a8" }}>demand</div>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "#1c2130", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", borderRadius: 3, background: h.demand > 80 ? "#ff4d6d" : h.demand > 60 ? "#ffdd57" : "#00ff99", width: `${h.demand}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#00efff" }}>💡 Tip: {h.tip}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#8a92a8", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "1rem" }}>Ride History ({rides.length} completed)</div>
              {rides.length === 0 && (
                <div style={{ background: "#0e1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "3rem", textAlign: "center", color: "#8a92a8" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
                  No completed rides yet. Go online to start earning!
                </div>
              )}
              {rides.map(r => (
                <div key={r._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 1.25rem", background: "#0e1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,255,153,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.passenger?.name} — {r.pickup?.name} → {r.destination?.name}</div>
                    <div style={{ fontSize: 12, color: "#8a92a8", marginTop: 2 }}>{new Date(r.createdAt).toLocaleString()} · {r.distance?.toFixed(1) || "?"}km</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#00ff99" }}>₹{r.fare}</div>
                    {r.rating && <div style={{ fontSize: 12, color: "#ffdd57" }}>{"⭐".repeat(r.rating)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}
