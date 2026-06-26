import { useState, useEffect, useRef } from "react";
import { PageLayout } from "./Layout";
import { getSocket } from "./Socket";

const CAMPUS_STOPS = [
  { name: "Main Gate",       top: "85%", left: "15%" },
  { name: "Library",         top: "45%", left: "35%" },
  { name: "Academic Block A",top: "30%", left: "50%" },
  { name: "Hostel Zone 1",   top: "20%", left: "70%" },
  { name: "Cafeteria",       top: "55%", left: "60%" },
  { name: "Admin Block",     top: "65%", left: "40%" },
  { name: "Sports Complex",  top: "15%", left: "30%" },
  { name: "Medical Center",  top: "70%", left: "75%" },
];

const api = (path) => {
  const token = localStorage.getItem("cr_token");
  return fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());
};

// Convert lat/lng to map % position (approximate for campus area)
function latLngToPos(lat, lng) {
  const minLat = 29.860, maxLat = 29.875;
  const minLng = 77.893, maxLng = 77.910;
  const top = 100 - ((lat - minLat) / (maxLat - minLat)) * 80 - 10;
  const left = ((lng - minLng) / (maxLng - minLng)) * 80 + 10;
  return {
    top: `${Math.min(90, Math.max(10, top))}%`,
    left: `${Math.min(90, Math.max(10, left))}%`,
  };
}

export default function MapPage() {
  const [drivers, setDrivers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(false);

  // Load real online drivers from backend
  const loadDrivers = async () => {
    try {
      const data = await api("/drivers/online");
      if (Array.isArray(data)) {
        setDrivers(data);
        setLastUpdate(new Date());
        setIsLive(true);
      }
    } catch (err) {
      console.error("Failed to load drivers:", err);
      setIsLive(false);
    }
  };

  useEffect(() => {
    loadDrivers();
    // Poll every 5 seconds for location updates
    const interval = setInterval(loadDrivers, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onDriverStatus = () => {
      loadDrivers(); // refresh when driver goes online/offline
    };

    const onDriverLocation = ({ driverId, lat, lng }) => {
      setDrivers(prev => prev.map(d =>
        String(d._id) === String(driverId)
          ? { ...d, location: { lat, lng } }
          : d
      ));
      setLastUpdate(new Date());
    };

    socket.on("driver:status",   onDriverStatus);
    socket.on("driver:location", onDriverLocation);

    return () => {
      socket.off("driver:status",   onDriverStatus);
      socket.off("driver:location", onDriverLocation);
    };
  }, []);

  const onlineDrivers = drivers.filter(d => d.isOnline);

  return (
    <PageLayout title="Live Map">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1rem", height: "calc(100vh - 130px)" }}>

        {/* Map */}
        <div style={{ background: "#0e1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden", position: "relative" }}>

          {/* Grid overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />

          {/* Ambient glow */}
          <div style={{ position: "absolute", top: "30%", left: "25%", width: 200, height: 200, background: "radial-gradient(circle,rgba(0,239,255,0.04),transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "60%", left: "60%", width: 180, height: 180, background: "radial-gradient(circle,rgba(0,255,153,0.04),transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

          {/* Campus stops */}
          {CAMPUS_STOPS.map(s => (
            <div key={s.name} style={{ position: "absolute", top: s.top, left: s.left, transform: "translate(-50%,-50%)", textAlign: "center", zIndex: 1 }}>
              <div style={{ width: 8, height: 8, background: "rgba(255,255,255,0.2)", borderRadius: "50%", margin: "0 auto 3px", border: "1px solid rgba(255,255,255,0.1)" }} />
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", background: "rgba(14,16,24,0.8)", padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap" }}>{s.name}</div>
            </div>
          ))}

          {/* Real driver markers */}
          {onlineDrivers.length === 0 && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", color: "#8a92a8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛺</div>
              <div style={{ fontSize: 14 }}>No drivers online right now</div>
              <div style={{ fontSize: 12, marginTop: 6, color: "#4a5168" }}>Drivers appear here when they go online</div>
            </div>
          )}

          {onlineDrivers.map(d => {
            const pos = d.location?.lat && d.location?.lng
              ? latLngToPos(d.location.lat, d.location.lng)
              : { top: `${20 + Math.random() * 60}%`, left: `${15 + Math.random() * 70}%` };

            return (
              <div key={d._id}
                onClick={() => setSelected(selected?._id === d._id ? null : d)}
                style={{ position: "absolute", top: pos.top, left: pos.left, transform: "translate(-50%,-50%)", textAlign: "center", cursor: "pointer", zIndex: 2, transition: "top 2s ease, left 2s ease" }}>
                <div style={{ fontSize: 24, filter: "drop-shadow(0 0 8px #00ff99)" }}>🛺</div>
                <div style={{ fontSize: 9, background: "rgba(0,255,153,0.15)", border: "1px solid rgba(0,255,153,0.4)", borderRadius: 4, padding: "1px 6px", color: "#00ff99", marginTop: 2, whiteSpace: "nowrap" }}>
                  {d.name.split(" ")[0]}
                </div>
              </div>
            );
          })}

          {/* Driver popup */}
          {selected && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#151824", border: "1px solid rgba(0,239,255,0.3)", borderRadius: 12, padding: "1.25rem", width: 220, zIndex: 10, animation: "fadeIn .2s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 32 }}>🛺</span>
                <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "#8a92a8", fontSize: 18, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "#8a92a8", marginBottom: 8 }}>{selected.vehicle?.type} · ⭐{selected.rating?.toFixed(1)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ff99" }} />
                <span style={{ color: "#00ff99" }}>Online & Available</span>
              </div>
            </div>
          )}

          {/* Live badge */}
          <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(14,16,24,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#8a92a8", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, background: isLive ? "#00ff99" : "#ff4d6d", borderRadius: "50%", animation: isLive ? "pulseDot 2s infinite" : "none" }} />
            {isLive ? `Live · Updates every 5s · ${onlineDrivers.length} driver${onlineDrivers.length !== 1 ? "s" : ""} online` : "Connecting..."}
          </div>

          {/* Last update */}
          <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(14,16,24,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#8a92a8" }}>
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>

          {/* Legend */}
          <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(14,16,24,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#8a92a8", display: "flex", gap: 12 }}>
            <span>🟢 Online Driver</span>
            <span>● Campus Stop</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ overflowY: "auto" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#8a92a8", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "1rem" }}>
            Online Drivers ({onlineDrivers.length})
          </div>

          {onlineDrivers.length === 0 && (
            <div style={{ background: "#151824", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "2rem", textAlign: "center", color: "#8a92a8", marginBottom: "1rem" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🛺</div>
              No drivers online
            </div>
          )}

          {onlineDrivers.map(d => (
            <div key={d._id}
              onClick={() => setSelected(selected?._id === d._id ? null : d)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: selected?._id === d._id ? "rgba(0,239,255,0.06)" : "#151824", border: `1px solid ${selected?._id === d._id ? "rgba(0,239,255,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, marginBottom: 8, cursor: "pointer", transition: "all .2s" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1c2130", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛺</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: "#8a92a8" }}>{d.vehicle?.type} · ⭐{d.rating?.toFixed(1)}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff99" }} />
            </div>
          ))}

          <div style={{ fontSize: 13, fontWeight: 600, color: "#8a92a8", textTransform: "uppercase", letterSpacing: "1.5px", margin: "1.5rem 0 1rem" }}>Campus Stops</div>
          {CAMPUS_STOPS.map(s => (
            <div key={s.name} style={{ padding: "8px 12px", background: "#151824", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, marginBottom: 6, fontSize: 12, color: "#8a92a8", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
              {s.name}
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}