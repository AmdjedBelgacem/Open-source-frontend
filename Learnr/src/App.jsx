import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { I18nProvider } from './context/I18nContext';
import ToastContainer from './components/ToastContainer';
import RouteSkeleton from './components/RouteSkeleton';
import GuestRoute from './app/routes/GuestRoute';
import ProtectedRoute from './app/routes/ProtectedRoute';

const LandingPage = lazy(() => import('./app/pages/public/LandingPage'));
const LoginPage = lazy(() => import('./app/pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./app/pages/auth/SignupPage'));
const CallbackPage = lazy(() => import('./app/pages/auth/CallbackPage'));
const ResetPasswordPage = lazy(() => import('./app/pages/auth/ResetPasswordPage'));
const PricingPage = lazy(() => import('./app/pages/public/PricingPage'));
const AppShell = lazy(() => import('./app/layouts/AppShell'));
const GeneratePage = lazy(() => import('./app/pages/dashboard/GeneratePage'));
const PreviewPage = lazy(() => import('./app/pages/dashboard/PreviewPage'));
const StudyPage = lazy(() => import('./app/pages/study/StudyPage'));
const DecksPage = lazy(() => import('./app/pages/library/DecksPage'));
const PublicDecksPage = lazy(() => import('./app/pages/library/PublicDecksPage'));
const ProfilePage = lazy(() => import('./app/pages/profile/ProfilePage'));
const UserProfilePage = lazy(() => import('./app/pages/profile/UserProfilePage'));
const NotificationsPage = lazy(() => import('./app/pages/profile/NotificationsPage'));
const StudyHubPage = lazy(() => import('./app/pages/social/StudyHubPage'));
const StudyHubThreadPage = lazy(() => import('./app/pages/social/StudyHubThreadPage'));

function renderLazy(node, variant = 'app') {
  return <Suspense fallback={<RouteSkeleton variant={variant} />}>{node}</Suspense>;
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <Routes>
          {/* Public / guest-only */}
          <Route path="/"       element={<GuestRoute>{renderLazy(<LandingPage />, 'auth')}</GuestRoute>} />
          <Route path="/pricing" element={renderLazy(<PricingPage />)} />
          <Route path="/login"  element={<GuestRoute>{renderLazy(<LoginPage />, 'auth')}</GuestRoute>} />
          <Route path="/signup" element={<GuestRoute>{renderLazy(<SignupPage />, 'auth')}</GuestRoute>} />
          <Route path="/auth/callback" element={renderLazy(<CallbackPage />, 'auth')} />
          <Route path="/auth/reset-password" element={renderLazy(<ResetPasswordPage />, 'auth')} />

          {/* Protected app */}
          <Route path="/app" element={<ProtectedRoute>{renderLazy(<AppShell />)}</ProtectedRoute>}>
            <Route index                element={<Navigate to="generate" replace />} />
            <Route path="generate"      element={renderLazy(<GeneratePage />)} />
            <Route path="preview"       element={renderLazy(<PreviewPage />)} />
            <Route path="study/:deckId" element={renderLazy(<StudyPage />)} />
            <Route path="decks"         element={renderLazy(<DecksPage />)} />
            <Route path="public-decks"  element={renderLazy(<PublicDecksPage />)} />
            <Route path="studyhub"      element={renderLazy(<StudyHubPage />)} />
            <Route path="studyhub/:threadId" element={renderLazy(<StudyHubThreadPage />)} />
            <Route path="notifications" element={renderLazy(<NotificationsPage />)} />
            <Route path="pricing"       element={renderLazy(<PricingPage />)} />
            <Route path="profile"       element={<Navigate to="/app/settings" replace />} />
            <Route path="settings"      element={renderLazy(<ProfilePage />)} />
            <Route path="profile/:userId" element={renderLazy(<UserProfilePage />)} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
