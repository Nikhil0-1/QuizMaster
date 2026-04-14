// src/App.jsx — Main router
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthChanged } from './firebase/authService';
import useAdminStore from './store/useAdminStore';
import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const DisplayMode = lazy(() => import('./pages/display/DisplayMode'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const { user } = useAdminStore();
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { setUser } = useAdminStore();
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    try {
      const unsub = onAuthChanged((u) => {
        setUser(u);
        setAuthLoading(false);
      });
      return unsub;
    } catch (err) {
      console.error("Firebase Auth Error (check config):", err);
      // Fallback for UI preview without valid config
      setAuthLoading(false);
    }
  }, [setUser]);

  if (authLoading) {
    return (
      <div className="gradient-bg" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(59,130,246,0.3)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8' }}>Initializing QuizMaster Pro…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <HashRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#0d0d14', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)' },
          success: { iconTheme: { primary: '#10b981', secondary: '#0d0d14' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0d0d14' } },
        }}
      />
      <Suspense fallback={<div className="gradient-bg" style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}><div style={{width: 40, height: 40, border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div></div>}>
        <Routes>
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/display"   element={<DisplayMode />} />
          <Route path="/admin"     element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
          <Route path="*"          element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
