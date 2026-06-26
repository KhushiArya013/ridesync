import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./Authstore";
import { connectSocket, disconnectSocket } from "./Socket";
import Authpage from "./Authpage";
import Passengerdashboard from "./Passengerdashboard";
import DriverDashboard from "./DriverDashboard";
import MapPage from "./MapPage";
import AnalyticsPage from "./AnalyticsPage";
import ProfilePage from "./ProfilePage";
import RidesPage from "./RidesPage";
import AIAssistant from "./AIAssistant";
import PaymentPage from "./PaymentPage";
import EarningsPage from "./EarningsPage";

function ProtectedRoute({ children }) {
  const { user, token } = useAuthStore();
  if (!user && !token) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuthStore();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRoute() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/" replace />;
  return user.role === "driver" ? <DriverDashboard /> : <Passengerdashboard />;
}

function App() {
  const { init, token, user } = useAuthStore();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("cr_token");
    if (savedToken && user) {
      connectSocket(savedToken);
    } else {
      disconnectSocket();
    }
  }, [token, user]);

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Authpage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
      <Route path="/rides" element={<ProtectedRoute><RidesPage /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
      <Route path="/earnings" element={<ProtectedRoute><EarningsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
