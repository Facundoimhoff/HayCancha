import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const ROLES_ADMIN = ['admin', 'superadmin'];

/**
 * Guard de rutas. `rol="admin"` exige cuenta de club; sin `rol` alcanza con tener sesión.
 * Es una barrera de UX: la seguridad real la imponen las policies RLS de Supabase.
 */
export default function RutaProtegida({ rol, children }) {
  const { user, rol: rolActual, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <div className="estado-carga">Cargando...</div>;

  if (!user) {
    const login = rol === 'admin' ? '/login-admin' : '/login-cliente';
    return <Navigate to={login} replace state={{ from: location.pathname }} />;
  }

  if (rol === 'admin' && !ROLES_ADMIN.includes(rolActual)) {
    return <Navigate to="/registro-club" replace />;
  }

  return children;
}
