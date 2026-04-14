// src/pages/analytics/AnalyticsPage.jsx
import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import useQuizStore from '../../store/useQuizStore';
import { listenSession, listenQuestions, listenAllResponses, listenResults } from '../../firebase/quizService';
import { analyzeQuestions, generateInsights } from '../../engines/analyticsEngine';
import { rankStudents } from '../../engines/rankingEngine';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AnalyticsPage() {
  const { questions, responses, results, setSession, setQuestions, setResponses, setResults } = useQuizStore();

  useEffect(() => {
    const u1 = listenSession(setSession);
    const u2 = listenQuestions(setQuestions);
    const u3 = listenAllResponses(setResponses);
    const u4 = listenResults(setResults);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const analyzed = useMemo(() => analyzeQuestions(questions, responses), [questions, responses]);
  const ranked = useMemo(() => rankStudents(results), [results]);
  const insights = useMemo(() => generateInsights(analyzed, ranked), [analyzed, ranked]);

  // Per-question accuracy chart
  const accuracyData = {
    labels: analyzed.map((_, i) => `Q${i + 1}`),
    datasets: [{
      label: 'Accuracy %',
      data: analyzed.map(q => q.accuracy),
      backgroundColor: analyzed.map(q =>
        q.difficulty === 'hard' ? 'rgba(239,68,68,0.6)' :
        q.difficulty === 'medium' ? 'rgba(245,158,11,0.6)' : 'rgba(16,185,129,0.6)'
      ),
      borderRadius: 6, borderSkipped: false,
    }],
  };

  // Score distribution doughnut
  const topN = ranked.slice(0, 5);
  const doughnutData = {
    labels: topN.map(s => s.studentId),
    datasets: [{ data: topN.map(s => s.score), backgroundColor: ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'], borderWidth: 0 }],
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 600 },
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' }, max: 100 },
    },
  };

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>📊 Analytics Engine</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Real-time performance insights & difficulty analysis</p>
        </div>
        <a href="/sacq/admin" style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'none' }}>← Back to Admin</a>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Questions', value: questions.length, color: '#3b82f6', icon: '📝' },
          { label: 'Students', value: ranked.length, color: '#8b5cf6', icon: '👥' },
          { label: 'Avg Accuracy', value: `${analyzed.length > 0 ? Math.round(analyzed.reduce((s, q) => s + q.accuracy, 0) / analyzed.length) : 0}%`, color: '#10b981', icon: '✅' },
          { label: 'Hard Questions', value: analyzed.filter(q => q.difficulty === 'hard').length, color: '#ef4444', icon: '🔥' },
        ].map(s => (
          <motion.div key={s.label} className="glass" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 18 }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="glass" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>Per-Question Accuracy</h3>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>🔴 Hard &lt;40% · 🟡 Medium 40–70% · 🟢 Easy &gt;70%</p>
          <div style={{ height: 200 }}>
            {analyzed.length > 0
              ? <Bar data={accuracyData} options={chartOpts} />
              : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13 }}>No data yet</div>}
          </div>
        </div>

        <div className="glass" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 14 }}>Top 5 Score Share</h3>
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {topN.length > 0
              ? <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } }} />
              : <div style={{ color: '#475569', fontSize: 13 }}>No data yet</div>}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="glass" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 14 }}>🤖 Auto-Generated Insights</h3>
        {insights.length === 0 ? (
          <p style={{ color: '#475569', fontSize: 13 }}>Run the quiz to generate insights.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {insights.map((insight, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
                {insight}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Question detail table */}
      <div className="glass" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 14 }}>Question Breakdown</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['#', 'Question', 'Total', 'Correct', 'Accuracy', 'Avg Time', 'Difficulty'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analyzed.map((q, i) => (
                <tr key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', color: '#e2e8f0', maxWidth: 200 }}>{q.text?.substring(0, 50)}{q.text?.length > 50 ? '…' : ''}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{q.total}</td>
                  <td style={{ padding: '10px 12px', color: '#34d399' }}>{q.correct}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 50, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${q.accuracy}%`, background: q.difficulty === 'hard' ? '#ef4444' : q.difficulty === 'medium' ? '#f59e0b' : '#10b981', borderRadius: 3 }} />
                      </div>
                      <span style={{ color: '#94a3b8' }}>{q.accuracy}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{q.avgTime}s</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge badge-${q.difficulty === 'hard' ? 'red' : q.difficulty === 'medium' ? 'yellow' : 'green'}`}>
                      {q.difficulty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {analyzed.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 13 }}>No question data available.</div>
          )}
        </div>
      </div>

      {/* Student table */}
      <div className="glass" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 14 }}>Student Performance</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Rank', 'Student ID', 'Score', 'Correct', 'Wrong', 'Avg Time', 'Performance'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((s, i) => {
                const pct = questions.length > 0 ? Math.round((s.correct / questions.length) * 100) : 0;
                return (
                  <tr key={s.studentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 12px', color: i < 3 ? '#fbbf24' : '#64748b' }}>#{s.rank}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#f1f5f9' }}>{s.studentId}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#60a5fa' }}>{s.score}</td>
                    <td style={{ padding: '10px 12px', color: '#34d399' }}>{s.correct}</td>
                    <td style={{ padding: '10px 12px', color: '#f87171' }}>{s.wrong}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{s.avgTime}s</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: 11 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {ranked.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 13 }}>No student data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
