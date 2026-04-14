// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAdminStore from '../../store/useAdminStore';
import useQuizStore from '../../store/useQuizStore';
import { logOut } from '../../firebase/authService';
import { listenSession, listenQuestions, listenResponses, listenResults, listenDevices } from '../../firebase/quizService';
import SessionControls from './SessionControls';
import QuestionManager from './QuestionManager';
import LiveMonitor from './LiveMonitor';
import LeaderboardPanel from './LeaderboardPanel';
import ExportPanel from './ExportPanel';
import SettingsPanel from './SettingsPanel';
import DeviceStatus from '../../components/DeviceStatus';

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',    icon: '📊' },
  { id: 'questions',   label: 'Quiz Control', icon: '📝' },
  { id: 'display',     label: 'Live Display', icon: '📺' },
  { id: 'monitor',     label: 'Responses',    icon: '📡' },
  { id: 'leaderboard', label: 'Leaderboard',  icon: '🏆' },
  { id: 'analytics',   label: 'Analytics',    icon: '📈' },
  { id: 'export',      label: 'Results',      icon: '📤' },
  { id: 'devices',     label: 'Devices',      icon: '📟' },
  { id: 'settings',    label: 'Settings/Profile', icon: '⚙️' },
];

export default function AdminDashboard() {
  const { user, activeTab, setActiveTab } = useAdminStore();
  const { setSession, setQuestions, setResponses, setResults, setDevices, session, questions, responses } = useQuizStore();
  const navigate = useNavigate();
  const unsubsRef = useRef([]);

  useEffect(() => {
    // Start all RTDB listeners
    const u1 = listenSession(setSession);
    const u2 = listenQuestions(setQuestions);
    const u3 = listenResults(setResults);
    const u4 = listenDevices(setDevices);
    unsubsRef.current = [u1, u2, u3, u4];

    return () => unsubsRef.current.forEach(u => u());
  }, []);

  // Listen to responses for current question
  useEffect(() => {
    if (!session.currentQ) return;
    const u = listenResponses(session.currentQ, (resp) => {
      setResponses(prev => ({ ...prev, [session.currentQ]: resp }));
    });
    return u;
  }, [session.currentQ]);

  const handleLogout = async () => {
    await logOut();
    toast.success('Logged out.');
    navigate('/login');
  };

  const totalStudents = Object.keys(
    Object.values(responses).reduce((acc, qr) => ({ ...acc, ...qr }), {})
  ).length;

  const stats = [
    { label: 'Questions', value: questions.length, icon: '📝', color: '#3b82f6' },
    { label: 'Students Active', value: totalStudents, icon: '👥', color: '#8b5cf6' },
    { label: 'Session Status', value: session.status.toUpperCase(), icon: '📡', color: session.status === 'active' ? '#10b981' : '#f59e0b' },
    { label: 'Auto Mode', value: session.autoMode ? 'ON' : 'OFF', icon: '🤖', color: session.autoMode ? '#10b981' : '#64748b' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="glass sidebar">
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>🎯</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            QuizMaster Pro
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{user?.email}</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'display') navigate('/display');
                else if (item.id === 'analytics') navigate('/analytics');
                else setActiveTab(item.id);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                background: activeTab === item.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: activeTab === item.id ? '#60a5fa' : '#94a3b8',
                boxShadow: activeTab === item.id ? 'inset 0 0 0 1px rgba(59,130,246,0.3)' : 'none',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => navigate('/display')} className="btn-ghost" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }}>
            📺 Smartboard View
          </button>
          <button onClick={handleLogout} className="btn-danger" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Session Controls always visible at top */}
        <SessionControls />

        {/* Stats row */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="stats-grid">
              {stats.map(s => (
                <div key={s.label} className="glass" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 40, opacity: 0.1 }}>{s.icon}</div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {activeTab === 'dashboard' && (
              <div className="dashboard-grid">
                <LiveMonitor compact />
                <LeaderboardPanel compact />
              </div>
            )}
            {activeTab === 'questions' && <QuestionManager />}
            {activeTab === 'monitor' && <LiveMonitor />}
            {activeTab === 'leaderboard' && <LeaderboardPanel />}
            {activeTab === 'devices' && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#f8fafc' }}>📟 ESP32 Device Status</h2>
                <DeviceStatus />
              </div>
            )}
            {activeTab === 'export' && <ExportPanel />}
            {activeTab === 'settings' && <SettingsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
