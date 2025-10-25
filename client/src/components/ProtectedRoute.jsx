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
      // si tienes guardado el patientId en user, úsalo:
      const pid = user?.patientId || '';
      return <Navigate to={pid ? `/patient/${pid}` : '/login/patient'} replace />;
    }
    // staff
    return <Navigate to="/patients" replace />;
  }

  // 3) Autorizado:
  //    - si este componente envuelve rutas anidadas, usa <Outlet/>
  //    - si se usa como wrapper con {children}, devuelve children
  return children ? children : <Outlet />;
}
