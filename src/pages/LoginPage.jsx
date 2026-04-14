// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { signIn } from '../firebase/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // OFFLINE DEMO AUTHENTICATION
    if (email === 'admin@quiz.com' && password === 'admin123') {
      import('../store/useAdminStore').then(mod => {
        mod.default.getState().setUser({ email: 'admin@quiz.com', uid: 'admin_demo_889' });
        toast.success('Login Successful!');
        navigate('/admin');
        setLoading(false);
      });
      return;
    }

    try {
      await signIn(email, password);
      toast.success('Welcome back, Admin!');
      navigate('/admin');
    } catch (err) {
      toast.error('Invalid ID or Password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            style={{ fontSize: 48, marginBottom: 10 }}
          >
            🎯
          </motion.div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
            QuizMaster Pro
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Smart Anti-Cheating Quiz System</p>
        </div>

        {/* Card */}
        <div className="glass-strong" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#f8fafc' }}>Admin Login</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Sign in to manage quizzes and view results.</p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                className="input-glass"
                placeholder="admin@school.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                className="input-glass"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <motion.button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', fontSize: 15, padding: '12px 24px' }}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Signing in…
                </span>
              ) : 'Sign In →'}
            </motion.button>
          </form>

          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(59,130,246,0.1)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
            <p style={{ fontSize: 12, color: '#60a5fa', textAlign: 'center' }}>
              📺 Want to view the live display?{' '}
              <a href="/sacq/display" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Open Smartboard →</a>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#334155', fontSize: 12 }}>
          QuizMaster Pro © 2026 — Anti-Cheating Edition
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
