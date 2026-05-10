import { Navigate, Outlet } from 'react-router-dom';
import { useSessionStore } from '../store/session';

export function ProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const user = useSessionStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If they have the wrong role, redirect to their own dashboard
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return <Outlet />;
}
