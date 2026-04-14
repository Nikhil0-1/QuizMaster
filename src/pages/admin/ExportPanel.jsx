// src/pages/admin/ExportPanel.jsx
import React from 'react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import jsPDFAutoTable from 'jspdf-autotable';
import useQuizStore from '../../store/useQuizStore';
import { rankStudents } from '../../engines/rankingEngine';

export default function ExportPanel() {
  const { results, questions, responses } = useQuizStore();
  const ranked = rankStudents(results);

  const toCSV = (rows, headers) => {
    const h = headers.join(',');
    const r = rows.map(row => headers.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','));
    return [h, ...r].join('\n');
  };

  const downloadCSV = () => {
    if (ranked.length === 0) { toast.error('No results to export.'); return; }
    const headers = ['rank', 'studentId', 'score', 'correct', 'wrong', 'avgTime'];
    const csv = toCSV(ranked, headers);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `quiz_results_${Date.now()}.csv`;
    a.click();
    toast.success('CSV downloaded!');
  };

  const downloadPDF = () => {
    if (ranked.length === 0) { toast.error('No results to export.'); return; }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(59, 130, 246);
    doc.text('QuizMaster Pro — Results', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Total students: ${ranked.length}  |  Questions: ${questions.length}`, 14, 26);

    jsPDFAutoTable(doc, {
      startY: 32,
      head: [['Rank', 'Student ID', 'Score', 'Correct', 'Wrong', 'Avg Time (s)']],
      body: ranked.map(s => [s.rank, s.studentId, s.score, s.correct, s.wrong, s.avgTime]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`quiz_results_${Date.now()}.pdf`);
    toast.success('PDF downloaded!');
  };

  const downloadQuestionsCSV = () => {
    if (questions.length === 0) { toast.error('No questions to export.'); return; }
    const rows = questions.map((q, i) => ({
      'Q#': i + 1, text: q.text, A: q.options?.[0], B: q.options?.[1],
      C: q.options?.[2], D: q.options?.[3], correct: q.correctAnswer, timer: q.timer,
    }));
    const csv = toCSV(rows, ['Q#', 'text', 'A', 'B', 'C', 'D', 'correct', 'timer']);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `questions_${Date.now()}.csv`;
    a.click();
    toast.success('Questions CSV downloaded!');
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>📤 Export Results</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Results CSV', desc: 'Student scores & rankings', icon: '📋', action: downloadCSV },
          { label: 'Results PDF', desc: 'Formatted PDF report', icon: '📄', action: downloadPDF },
          { label: 'Questions CSV', desc: 'Export question bank', icon: '📝', action: downloadQuestionsCSV },
        ].map(e => (
          <button key={e.label} onClick={e.action} className="glass" style={{ padding: 24, textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s', borderRadius: 16 }}
            onMouseEnter={el => el.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'}
            onMouseLeave={el => el.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>{e.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{e.label}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{e.desc}</div>
          </button>
        ))}
      </div>

      {/* Preview table */}
      {ranked.length > 0 && (
        <div className="glass" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Preview — Top 10</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Rank', 'Student ID', 'Score', 'Correct', 'Wrong', 'Avg Time'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 10).map((s, i) => (
                  <tr key={s.studentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 12px', color: i < 3 ? '#fbbf24' : '#94a3b8' }}>#{s.rank}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#f1f5f9' }}>{s.studentId}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#60a5fa' }}>{s.score}</td>
                    <td style={{ padding: '10px 12px', color: '#34d399' }}>{s.correct}</td>
                    <td style={{ padding: '10px 12px', color: '#f87171' }}>{s.wrong}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{s.avgTime}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
