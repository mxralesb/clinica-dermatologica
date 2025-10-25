// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ roles = [] }) {
  const { user, ready } = useAuth();

  if (!ready) return null; // evita parpadeo

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    // redirige a su “home” según rol
    if (user.role === "DERM") return <Navigate to="/patients" replace />;
    if (user.role === "PATIENT") return <Navigate to={`/patient/${user.patientId}`} replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
