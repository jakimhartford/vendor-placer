import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ShareView from './pages/ShareView.jsx';
import './App.css';

const App = lazy(() => import('./App.jsx'));
const EventsPage = lazy(() => import('./pages/EventsPage.jsx'));
const EventDashboardPage = lazy(() => import('./pages/EventDashboardPage.jsx'));
const CheckInPage = lazy(() => import('./pages/CheckInPage.jsx'));
const VendorPortal = lazy(() => import('./pages/VendorPortal.jsx'));
const VendorStatus = lazy(() => import('./pages/VendorStatus.jsx'));

const loading = (bg = '#0f172a', color = '#94a3b8') => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color }}>Loading...</div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/share/:token" element={<ShareView />} />
          <Route path="/vendor/:inviteToken" element={
            <Suspense fallback={loading('#f8fafc', '#64748b')}>
              <VendorPortal />
            </Suspense>
          } />
          <Route path="/vendor/status/:vendorToken" element={
            <Suspense fallback={loading('#f8fafc', '#64748b')}>
              <VendorStatus />
            </Suspense>
          } />
          <Route path="/events" element={
            <ProtectedRoute>
              <Suspense fallback={loading()}>
                <EventsPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/events/:eventId" element={
            <ProtectedRoute>
              <Suspense fallback={loading()}>
                <EventDashboardPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/events/:eventId/layouts/:layoutId" element={
            <ProtectedRoute>
              <Suspense fallback={loading()}>
                <App />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/events/:eventId/checkin" element={
            <ProtectedRoute>
              <Suspense fallback={loading()}>
                <CheckInPage />
              </Suspense>
            </ProtectedRoute>
          } />
          {/* Legacy checkin route redirect */}
          <Route path="/checkin/:eventId" element={
            <ProtectedRoute>
              <Suspense fallback={loading()}>
                <CheckInPage />
              </Suspense>
            </ProtectedRoute>
          } />
          {/* Root redirects to events */}
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
