import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import RouteSkeleton from '../../components/RouteSkeleton';

export default function GuestRoute({ children }) {
  const { loading, isAuthenticated, isSupabaseConfigured } = useAuth();

  if (loading) return <RouteSkeleton variant="auth" />;
  if (isSupabaseConfigured && isAuthenticated) return <Navigate to="/app/generate" replace />;

  return <Suspense fallback={<RouteSkeleton variant="auth" />}>{children}</Suspense>;
}
