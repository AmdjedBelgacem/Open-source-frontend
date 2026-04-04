import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import RouteSkeleton from '../../components/RouteSkeleton';

export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated, isSupabaseConfigured } = useAuth();

  if (loading) return <RouteSkeleton variant="app" />;

  if (isSupabaseConfigured && !isAuthenticated) return <Navigate to="/" replace />;

  return <Suspense fallback={<RouteSkeleton variant="app" />}>{children}</Suspense>;
}
