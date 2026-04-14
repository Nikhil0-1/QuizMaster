// src/pages/admin/LiveMonitor.jsx
import React, { useMemo } from 'react';
import useQuizStore from '../../store/useQuizStore';

const ResponseRow = React.memo(({ studentId, resp, idx, currentQ }) => {
  const isCorrect = currentQ && resp.answer === currentQ.correctAnswer;
  return (
    <div className="glass" style={{ padding: '10px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#64748b', fontWeight: 700 }}>{idx + 1}</span>
      {idx === 0 && <span title="Fastest!">⚡</span>}
      <span style={{ flex: 1, fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace' }}>{studentId}</span>
      <span className={`badge badge-${isCorrect ? 'green' : 'red'}`}>{resp.answer}</span>
      <span style={{ fontSize: 11, color: '#64748b' }}>{resp.responseTime?.toFixed(2)}s</span>
    </div>
  );
});

function LiveMonitor({ compact = false }) {
  const { session, questions, responses } = useQuizStore();
  const currentQ = useMemo(() => questions.find(q => q.id === session.currentQ), [questions, session.currentQ]);
  
  const currentResponses = session.currentQ ? (responses[session.currentQ] || {}) : {};
  const respEntries = useMemo(() => Object.entries(currentResponses).sort((a, b) => a[1].responseTime - b[1].responseTime), [currentResponses]);

  const totalStudents = useMemo(() => {
    return Object.keys(Object.values(responses).reduce((acc, qr) => ({ ...acc, ...qr }), {})).length || respEntries.length;
  }, [responses, respEntries.length]);

  const correctCount = useMemo(() => {
    return currentQ ? respEntries.filter(([, r]) => r.answer === currentQ.correctAnswer).length : 0;
  }, [currentQ, respEntries]);

  // Option distribution
  const { distribution, maxDist } = useMemo(() => {
    const d = { A: 0, B: 0, C: 0, D: 0 };
    respEntries.forEach(([, r]) => { if (r.answer in d) d[r.answer]++; });
    return { distribution: d, maxDist: Math.max(...Object.values(d), 1) };
  }, [respEntries]);

  return (
    <div className={compact ? '' : ''}>
      <h2 style={{ fontSize: compact ? 14 : 18, fontWeight: 700, color: '#f8fafc', marginBottom: 14 }}>
        📡 Responses Monitor {!compact && `— ${currentQ ? `Q: ${currentQ.text?.substring(0,50)}…` : 'Waiting…'}`}
      </h2>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Responses', value: respEntries.length, color: '#3b82f6' },
          { label: 'Correct', value: correctCount, color: '#10b981' },
          { label: 'Wrong', value: respEntries.length - correctCount, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: compact ? 20 : 26, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Option distribution */}
      {!compact && (
        <div className="glass" style={{ padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Response Distribution</p>
          {Object.entries(distribution).map(([opt, count]) => (
            <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 20, fontSize: 13, color: opt === currentQ?.correctAnswer ? '#34d399' : '#94a3b8', fontWeight: 600 }}>{opt}</span>
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(count / maxDist) * 100}%`, background: opt === currentQ?.correctAnswer ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: 4, transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ width: 24, textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Response table */}
      <div style={{ maxHeight: compact ? 200 : 320, overflowY: 'auto' }}>
        {respEntries.length === 0 ? (
          <div className="glass" style={{ padding: 20, textAlign: 'center', color: '#475569', fontSize: 13 }}>
            Waiting for student responses…
          </div>
        ) : (
          respEntries.map(([studentId, resp], idx) => (
            <ResponseRow key={studentId} studentId={studentId} resp={resp} idx={idx} currentQ={currentQ} />
          ))
        )}
      </div>
    </div>
  );
}

export default React.memo(LiveMonitor);
