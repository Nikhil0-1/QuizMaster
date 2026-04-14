// src/pages/admin/QuestionManager.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import useQuizStore from '../../store/useQuizStore';
import { addQuestion, updateQuestion, deleteQuestion } from '../../firebase/quizService';

const EMPTY_Q = { text: '', options: ['', '', '', ''], correctAnswer: 'A', timer: 30 };

export default function QuestionManager() {
  const { questions } = useQuizStore();
  const [form, setForm] = useState(EMPTY_Q);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleOptionChange = (i, val) =>
    setForm(f => { const opts = [...f.options]; opts[i] = val; return { ...f, options: opts }; });

  const handleSave = async () => {
    if (!form.text.trim() || form.options.some(o => !o.trim())) {
      toast.error('Fill in the question and all 4 options.'); return;
    }
    setSaving(true);
    try {
      if (editId) { await updateQuestion(editId, form); toast.success('Question updated!'); }
      else { await addQuestion({ ...form, id: undefined }); toast.success('Question added!'); }
      setForm(EMPTY_Q); setEditId(null);
    } catch { toast.error('Failed to save question.'); }
    setSaving(false);
  };

  const handleEdit = (q) => { setForm({ text: q.text, options: q.options, correctAnswer: q.correctAnswer, timer: q.timer || 30 }); setEditId(q.id); };

  const handleDelete = async (id) => { if (!confirm('Delete this question?')) return; await deleteQuestion(id); toast.success('Deleted.'); };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const arr = JSON.parse(ev.target.result);
          for (const q of arr) await addQuestion(q);
          toast.success(`Uploaded ${arr.length} questions!`);
        } catch { toast.error('Invalid JSON format.'); }
      };
      reader.readAsText(file);
    } else {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (res) => {
          for (const row of res.data) {
            await addQuestion({ text: row.text, options: [row.A, row.B, row.C, row.D], correctAnswer: row.correct, timer: parseInt(row.timer) || 30 });
          }
          toast.success(`Uploaded ${res.data.length} questions via CSV!`);
        }
      });
    }
    fileRef.current.value = '';
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>📝 Question Manager</h2>
        <button onClick={() => fileRef.current.click()} className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>
          📂 Bulk Upload (JSON/CSV)
        </button>
        <input ref={fileRef} type="file" accept=".json,.csv" style={{ display: 'none' }} onChange={handleBulkUpload} />
      </div>

      {/* Form */}
      <div className="glass-strong" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>
          {editId ? '✏️ Edit Question' : '➕ Add New Question'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>Question Text</label>
            <textarea
              className="input-glass" rows={3} placeholder="What is the capital of France?"
              value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['A', 'B', 'C', 'D'].map((opt, i) => (
              <div key={opt}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Option {opt}</label>
                <input className="input-glass" placeholder={`Option ${opt}`} value={form.options[i]} onChange={e => handleOptionChange(i, e.target.value)} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>Correct Answer</label>
              <select className="input-glass" value={form.correctAnswer} onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))}>
                {['A','B','C','D'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>Timer (seconds)</label>
              <input className="input-glass" type="number" min={5} max={120} value={form.timer} onChange={e => setForm(f => ({ ...f, timer: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: 13 }}>
              {saving ? 'Saving…' : editId ? '✅ Update' : '➕ Add Question'}
            </button>
            {editId && <button className="btn-ghost" onClick={() => { setForm(EMPTY_Q); setEditId(null); }}>Cancel</button>}
          </div>
        </div>
      </div>

      {/* Question list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {questions.map((q, i) => (
            <motion.div key={q.id} className="glass" layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="badge badge-blue">Q{i + 1}</span>
                  <span className="badge badge-purple">⏱ {q.timer}s</span>
                  <span className="badge badge-green">✓ {q.correctAnswer}</span>
                </div>
                <p style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500, marginBottom: 8 }}>{q.text}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {q.options?.map((opt, oi) => (
                    <span key={oi} style={{ fontSize: 12, color: opt === q.options[['A','B','C','D'].indexOf(q.correctAnswer)] ? '#34d399' : '#64748b', background: 'rgba(255,255,255,0.04)', padding: '2px 10px', borderRadius: 6 }}>
                      {['A','B','C','D'][oi]}: {opt}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleEdit(q)} className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>✏️</button>
                <button onClick={() => handleDelete(q.id)} className="btn-danger" style={{ fontSize: 12, padding: '6px 12px' }}>🗑️</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {questions.length === 0 && (
          <div className="glass" style={{ padding: 32, textAlign: 'center', color: '#475569' }}>
            No questions yet. Add one above or bulk upload.
          </div>
        )}
      </div>
    </div>
  );
}
