// src/pages/admin/SessionControls.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useQuizStore from '../../store/useQuizStore';
import { updateSession, resetSession } from '../../firebase/quizService';
import CircularTimer from '../../components/CircularTimer';

export default function SessionControls() {
  const { session, questions } = useQuizStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const currentIndex = questions.findIndex(q => q.id === session.currentQ);
  const currentQ = questions[currentIndex];

  const startQuiz = async () => {
    if (questions.length === 0) { toast.error('Add questions first!'); return; }
    const firstQ = questions[0];
    await updateSession({
      status: 'active',
      currentQ: firstQ.id,
      startTime: Date.now(),
      timer: firstQ.timer || 30,
    });
    toast.success('Quiz started! ⚡');
  };

  const pauseResume = async () => {
    if (session.status === 'active') {
      await updateSession({ status: 'paused' });
      toast('Quiz paused.', { icon: '⏸️' });
    } else {
      await updateSession({ status: 'active', startTime: Date.now() });
      toast('Quiz resumed.', { icon: '▶️' });
    }
  };

  const nextQuestion = async () => {
    if (currentIndex === -1 || currentIndex >= questions.length - 1) {
      await updateSession({ status: 'ended' });
      toast.success('Quiz ended! Results ready.');
      return;
    }
    const next = questions[currentIndex + 1];
    await updateSession({ currentQ: next.id, startTime: Date.now(), timer: next.timer || 30 });
    toast('Next question →', { icon: '⏩' });
  };

  const endQuiz = async () => {
    await updateSession({ status: 'ended' });
    toast.success('Quiz ended!');
  };

  const handleReset = async () => {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); return; }
    await resetSession();
    toast.success('Session reset.');
    setConfirmReset(false);
  };

  const toggleAutoMode = async () => {
    await updateSession({ autoMode: !session.autoMode });
    toast(`Auto Mode ${!session.autoMode ? 'ON 🤖' : 'OFF'}`, { icon: session.autoMode ? '🔴' : '🟢' });
  };

  const isIdle = session.status === 'idle';
  const isActive = session.status === 'active';
  const isPaused = session.status === 'paused';
  const isEnded = session.status === 'ended';

  const statusColors = { idle: '#f59e0b', active: '#10b981', paused: '#f59e0b', ended: '#ef4444' };
  const qLabel = currentQ ? `Q${currentIndex + 1}: ${currentQ.text?.substring(0, 40)}${currentQ.text?.length > 40 ? '…' : ''}` : 'No active question';

  return (
    <div className="glass-strong" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        {/* Left — status + question label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div
              animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: 10, height: 10, borderRadius: '50%', background: statusColors[session.status] }}
            />
            <span style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600, color: statusColors[session.status], letterSpacing: '0.08em' }}>
              {session.status}
            </span>
          </div>
          {currentQ && (
            <span style={{ fontSize: 13, color: '#94a3b8', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {qLabel} ({currentIndex + 1}/{questions.length})
            </span>
          )}
        </div>

        {/* Center — timer */}
        {isActive && currentQ && (
          <CircularTimer
            startTime={session.startTime}
            duration={session.timer}
            size={70}
            onExpire={session.autoMode ? nextQuestion : undefined}
          />
        )}

        {/* Right — control buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Auto Mode toggle */}
          <button
            onClick={toggleAutoMode}
            style={{
              padding: '8px 14px', borderRadius: 8, border: `1px solid ${session.autoMode ? '#10b981' : '#475569'}`,
              background: session.autoMode ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: session.autoMode ? '#34d399' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            🤖 Auto {session.autoMode ? 'ON' : 'OFF'}
          </button>

          {isIdle || isEnded ? (
            <button className="btn-primary" onClick={startQuiz} style={{ fontSize: 13, padding: '8px 18px' }}>
              ▶ Start Quiz
            </button>
          ) : (
            <>
              <button onClick={pauseResume} className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }}>
                {isActive ? '⏸ Pause' : '▶ Resume'}
              </button>
              <button onClick={nextQuestion} className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }}>
                ⏭ Next
              </button>
              <button onClick={endQuiz} className="btn-danger" style={{ fontSize: 13, padding: '8px 14px' }}>
                ⏹ End
              </button>
            </>
          )}

          <button
            onClick={handleReset}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #334155', background: confirmReset ? 'rgba(239,68,68,0.2)' : 'transparent', color: confirmReset ? '#f87171' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            {confirmReset ? '⚠️ Confirm Reset' : '🔄 Reset'}
          </button>
        </div>
      </div>
    </div>
  );
}
