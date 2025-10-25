// src/components/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles = [], children }) {
  const { user, role, isAuth } = useAuth();
  const loc = useLocation();

  // 1) No autenticado: manda al login principal
  if (!isAuth) {
    return <Navigate to="/login/derm" state={{ from: loc }} replace />;
  }

  // 2) Si hay restricción por roles y el del usuario no está permitido
  if (roles.length > 0 && !roles.includes(role)) {
    // Redirige según su rol
    if (role === 'PATIENT') {
      // si es paciente, lo mandamos a su propio historial
 
      const pid = user?.patientId || '';
      return <Navigate to={pid ? `/patient/${pid}` : '/login/patient'} replace />;
    }
    // staff
    return <Navigate to="/patients" replace />;
  }

  return children ? children : <Outlet />;
}
