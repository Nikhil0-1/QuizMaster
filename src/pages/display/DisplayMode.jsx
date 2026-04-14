// src/pages/display/DisplayMode.jsx — Ultra-premium fullscreen smartboard
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import useQuizStore from '../../store/useQuizStore';
import { listenSession, listenQuestions, listenResponses } from '../../firebase/quizService';
import CircularTimer from '../../components/CircularTimer';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const LABELS = ['A', 'B', 'C', 'D'];
const OPT_COLORS = [
  ['rgba(59,130,246,0.7)', 'rgba(59,130,246,0.4)'],
  ['rgba(139,92,246,0.7)', 'rgba(139,92,246,0.4)'],
  ['rgba(245,158,11,0.7)', 'rgba(245,158,11,0.4)'],
  ['rgba(239,68,68,0.7)', 'rgba(239,68,68,0.4)'],
];

export default function DisplayMode() {
  const { session, questions, responses, setSession, setQuestions, setResponses } = useQuizStore();
  const [revealed, setRevealed] = useState(false);
  const [fastestId, setFastestId] = useState(null);
  const prevQRef = useRef(null);

  useEffect(() => {
    const u1 = listenSession(setSession);
    const u2 = listenQuestions(setQuestions);
    return () => { u1(); u2(); };
  }, []);

  useEffect(() => {
    if (!session.currentQ) return;
    // Reset reveal state on new question
    if (prevQRef.current !== session.currentQ) {
      setRevealed(false);
      setFastestId(null);
      prevQRef.current = session.currentQ;
    }
    const u = listenResponses(session.currentQ, (resp) => {
      setResponses(prev => ({ ...prev, [session.currentQ]: resp }));
      const entries = Object.entries(resp || {}).sort((a, b) => a[1].responseTime - b[1].responseTime);
      if (entries.length > 0) setFastestId(entries[0][0]);
    });
    return u;
  }, [session.currentQ]);

  const currentQ = questions.find(q => q.id === session.currentQ);
  const currentResponses = session.currentQ ? (responses[session.currentQ] || {}) : {};
  const totalResp = Object.keys(currentResponses).length;

  // Option vote counts
  const votes = LABELS.map(l => Object.values(currentResponses).filter(r => r.answer === l).length);

  const chartData = {
    labels: LABELS.map((l, i) => `${l}: ${currentQ?.options?.[i]?.substring(0, 14) || ''}`),
    datasets: [{
      data: votes,
      backgroundColor: LABELS.map((_, i) => OPT_COLORS[i][0]),
      borderColor: LABELS.map((_, i) => OPT_COLORS[i][1]),
      borderWidth: 1, borderRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 12 } }, grid: { display: false } },
      y: { ticks: { color: '#64748b', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  const isIdle = session.status === 'idle';
  const isEnded = session.status === 'ended';

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', top: '-15%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🎯</span>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              QuizMaster Pro
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>SMARTBOARD DISPLAY</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {totalResp > 0 && (
            <div className="badge badge-blue">👥 {totalResp} responded</div>
          )}
          <div className={`badge badge-${session.status === 'active' ? 'green' : 'red'}`}>
            ● {session.status.toUpperCase()}
          </div>
          {currentQ && (
            <div className="badge badge-purple">
              Q{questions.findIndex(q => q.id === session.currentQ) + 1} / {questions.length}
            </div>
          )}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        {isIdle && <WaitingScreen />}
        {isEnded && <EndedScreen />}

        {!isIdle && !isEnded && currentQ && (
          <AnimatePresence mode="wait">
            <motion.div
              key={session.currentQ}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: '100%', maxWidth: 900 }}
            >
              {/* Question box */}
              <div className="glass-strong glow-blue" style={{ padding: '32px 40px', marginBottom: 24, borderRadius: 24, textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 20, right: 24 }}>
                  <CircularTimer
                    key={`${session.currentQ}-${session.startTime}`}
                    startTime={session.startTime}
                    duration={session.timer}
                    size={90}
                    onExpire={() => setRevealed(true)}
                  />
                </div>
                <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  QUESTION {questions.findIndex(q => q.id === session.currentQ) + 1}
                </p>
                <h1 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, color: '#f8fafc', fontFamily: 'Outfit, sans-serif', lineHeight: 1.3, maxWidth: 700, margin: '0 auto' }}>
                  {currentQ.text}
                </h1>
              </div>

              {/* Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                {currentQ.options?.map((opt, i) => {
                  const letter = LABELS[i];
                  const isCorrect = letter === currentQ.correctAnswer;
                  const isRevealing = revealed && isCorrect;
                  const voteCount = votes[i];
                  const pct = totalResp > 0 ? Math.round((voteCount / totalResp) * 100) : 0;

                  return (
                    <motion.div
                      key={i}
                      animate={isRevealing ? { scale: [1, 1.03, 1], boxShadow: ['0 0 0px transparent', '0 0 40px rgba(16,185,129,0.6)', '0 0 30px rgba(16,185,129,0.4)'] } : {}}
                      transition={{ duration: 0.6 }}
                      style={{
                        padding: '20px 24px', borderRadius: 16,
                        background: isRevealing ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isRevealing ? 'rgba(16,185,129,0.6)' : OPT_COLORS[i][0]}`,
                        display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {/* Vote progress bar */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, width: `${pct}%`, background: OPT_COLORS[i][0], transition: 'width 0.4s ease', borderRadius: '0 0 0 16px' }} />

                      <div style={{ width: 40, height: 40, borderRadius: 10, background: OPT_COLORS[i][0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                        {letter}
                        {isRevealing && ' ✓'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', fontWeight: 600, color: '#f1f5f9' }}>{opt}</p>
                      </div>
                      {revealed && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#94a3b8' }}>{pct}%</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{voteCount} votes</div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom row: chart + fastest */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
                {/* Live bar chart */}
                <div className="glass" style={{ padding: '16px 20px', height: 160 }}>
                  <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Response Distribution</p>
                  <div style={{ height: 120 }}>
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </div>

                {/* Fastest responder */}
                <div className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  {fastestId ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>⚡</div>
                      <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Fastest!</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24', fontFamily: 'monospace' }}>{fastestId}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        {currentResponses[fastestId]?.responseTime?.toFixed(2)}s
                      </div>
                    </motion.div>
                  ) : (
                    <div style={{ color: '#475569', fontSize: 13 }}>Waiting for responses…</div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function WaitingScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: 64, marginBottom: 20 }}>🎯</motion.div>
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>Waiting for Quiz to Start</h2>
      <p style={{ color: '#64748b', fontSize: 16 }}>The admin will begin the quiz shortly. Stand by!</p>
    </motion.div>
  );
}

function EndedScreen() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🏆</div>
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 800, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
        Quiz Completed!
      </h2>
      <p style={{ color: '#64748b', fontSize: 16 }}>Check the admin panel for your results and rankings.</p>
    </motion.div>
  );
}
