// src/pages/admin/SettingsPanel.jsx
import React from 'react';
import toast from 'react-hot-toast';
import useAdminStore from '../../store/useAdminStore';
import { logOut } from '../../firebase/authService';
import { resetSession } from '../../firebase/quizService';
import { uploadDemoQuestions, runDemoSession } from '../../demo/demoDataGenerator';
import useQuizStore from '../../store/useQuizStore';

export default function SettingsPanel() {
  const { user } = useAdminStore();
  const { questions } = useQuizStore();

  const handleLogout = async () => {
    await logOut();
    toast.success('Logged out successfully.');
    // Navigation is handled by App.jsx Route protection
  };

  const handleReset = async () => {
    if (window.confirm('WARNING: This will wipe all current responses and results in the active session. Are you sure?')) {
      try {
        await resetSession();
        toast.success('System reset successfully.');
      } catch (e) {
        toast.error('Failed to reset system. You might be in Demo UI mode.');
      }
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>⚙️ Settings & Profile</h2>
      
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Profile Card */}
        <div className="glass" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' }}>
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>Admin Account</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{user?.email || 'demo@admin.com'}</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>UID: {user?.uid || 'demo123'}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>
            Sign Out
          </button>
        </div>

        {/* Theme & Display Options */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>Demo & Testing Module</h3>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Test the Smartboard layout and real-time engines with simulated data before connecting physical ESP32 devices.</p>
          <div style={{ display: 'flex', gap: 12 }}>
             <button onClick={() => {
                uploadDemoQuestions();
                toast.success('Demo questions loaded! Head to Quiz Control to see them.');
             }} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, background: '#10b981' }}>
                1. Load Demo Questions
             </button>
             <button onClick={() => {
                if(questions.length === 0) return toast.error('Load questions first!');
                toast.success('Simulation starting! Switch to Smartboard View!');
                runDemoSession(questions);
             }} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13, borderColor: '#3b82f6', color: '#60a5fa' }}>
                2. Auto-Run Live Simulation
             </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass" style={{ padding: 24, border: '1px solid rgba(239,68,68,0.2)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#ef4444', marginBottom: 16 }}>Danger Zone</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#e2e8f0' }}>Factory Reset Quiz Session</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Wipe all responses, scores, and active timestamps from the Firebase Realtime DB. Questions are safely preserved.</div>
            </div>
            <button onClick={handleReset} className="btn-danger" style={{ padding: '8px 16px', fontSize: 13 }}>
              Reset System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
