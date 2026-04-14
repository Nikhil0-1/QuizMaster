// src/pages/admin/LeaderboardPanel.jsx
import React, { useEffect, useMemo } from 'react';
import useQuizStore from '../../store/useQuizStore';
import { listenAllResponses, setResults as saveResults } from '../../firebase/quizService';
import { calculateScores } from '../../engines/scoringEngine';
import { rankStudents } from '../../engines/rankingEngine';

const MEDAL = ['🥇', '🥈', '🥉'];

const LeaderboardRow = React.memo(({ s, i }) => (
  <div
    className="glass"
    style={{
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6,
      border: i === 0 ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.06)',
      background: i === 0 ? 'rgba(251,191,36,0.06)' : undefined,
    }}
  >
    {/* Rank */}
    <div style={{ width: 32, textAlign: 'center' }}>
      {i < 3 ? <span style={{ fontSize: 18 }}>{MEDAL[i]}</span>
        : <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>#{s.rank}</span>}
    </div>

    {/* Student ID */}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', fontFamily: 'monospace' }}>{s.studentId}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
        ✅ {s.correct} correct · ❌ {s.wrong} wrong · ⏱ avg {s.avgTime}s
      </div>
    </div>

    {/* Score */}
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: i === 0 ? '#fbbf24' : '#60a5fa', fontFamily: 'Outfit, sans-serif' }}>
        {s.score}
      </div>
      <div style={{ fontSize: 10, color: '#475569' }}>pts</div>
    </div>
  </div>
));

function LeaderboardPanel({ compact = false }) {
  const { questions, responses, results, setResults, setResponses } = useQuizStore();

  useEffect(() => {
    const u = listenAllResponses((allResp) => setResponses(allResp));
    return u;
  }, [setResponses]);

  useEffect(() => {
    if (Object.keys(responses).length === 0 || questions.length === 0) return;
    const questionMap = questions.reduce((acc, q) => { acc[q.id] = q; return acc; }, {});
    const scores = calculateScores(questionMap, responses);
    const rankedData = rankStudents(scores);
    const resultsObj = rankedData.reduce((acc, s) => { acc[s.studentId] = s; return acc; }, {});
    setResults(resultsObj);
    saveResults(resultsObj).catch(() => {});
  }, [responses, questions, setResults]);

  const ranked = useMemo(() => {
    return Object.values(results).sort((a, b) => a.rank - b.rank);
  }, [results]);

  return (
    <div>
      <h2 style={{ fontSize: compact ? 14 : 18, fontWeight: 700, color: '#f8fafc', marginBottom: 14 }}>
        🏆 Leaderboard {ranked.length > 0 && `(${ranked.length} students)`}
      </h2>

      {ranked.length === 0 ? (
        <div className="glass" style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 13 }}>
          Leaderboard will appear here once the quiz starts.
        </div>
      ) : (
        <div style={{ maxHeight: compact ? 260 : 400, overflowY: 'auto', paddingRight: 4 }}>
          {ranked.slice(0, compact ? 8 : undefined).map((s, i) => (
            <LeaderboardRow key={s.studentId} s={s} i={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default React.memo(LeaderboardPanel);
