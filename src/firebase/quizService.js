// src/firebase/quizService.js — Realtime Database operations + Offline Mock
import { db } from './config';
import {
  ref, set, get, update, remove, push, onValue, off,
} from 'firebase/database';
import useQuizStore from '../store/useQuizStore';

const MOCK_MODE = import.meta.env.VITE_FIREBASE_API_KEY?.includes('DEMO_PLACEHOLDER');

// ── Helpers for Mock Mode ─────────────────────────────────
const mockSet = (key, dataOrFn) => {
  const store = useQuizStore.getState();
  if (key === 'session') store.setSession(typeof dataOrFn === 'function' ? dataOrFn(store.session) : dataOrFn);
  if (key === 'questions') store.setQuestions(typeof dataOrFn === 'function' ? dataOrFn(store.questions) : dataOrFn);
  if (key === 'results') store.setResults(typeof dataOrFn === 'function' ? dataOrFn(store.results) : dataOrFn);
  if (key === 'responses') store.setResponses(typeof dataOrFn === 'function' ? dataOrFn(store.responses) : dataOrFn);
};

// ── Session ──────────────────────────────────────────────
export const setSession = async (data) => {
  if (MOCK_MODE) return mockSet('session', data);
  return set(ref(db, 'quizSession'), data);
};
export const updateSession = async (data) => {
  if (MOCK_MODE) {
    const current = useQuizStore.getState().session;
    return mockSet('session', { ...current, ...data });
  }
  return update(ref(db, 'quizSession'), data);
};
export const getSession = async () => {
  if (MOCK_MODE) return useQuizStore.getState().session;
  return get(ref(db, 'quizSession')).then(s => s.val());
};
export const listenSession = (cb) => {
  if (MOCK_MODE) return () => {};
  const r = ref(db, 'quizSession');
  onValue(r, snap => cb(snap.val()));
  return () => off(r);
};

// ── Questions ─────────────────────────────────────────────
export const addQuestion = async (data) => {
  if (MOCK_MODE) {
    const id = 'mockQ_' + Date.now() + Math.random().toString(36).substring(2, 6);
    return mockSet('questions', (prev) => [...prev, { ...data, id }]);
  }
  const newRef = push(ref(db, 'questions'));
  return set(newRef, { ...data, id: newRef.key });
};
export const updateQuestion = async (id, data) => {
  if (MOCK_MODE) return mockSet('questions', (prev) => prev.map(q => q.id === id ? { ...q, ...data } : q));
  return update(ref(db, `questions/${id}`), data);
};
export const deleteQuestion = async (id) => {
  if (MOCK_MODE) return mockSet('questions', (prev) => prev.filter(q => q.id !== id));
  return remove(ref(db, `questions/${id}`));
};
export const listenQuestions = (cb) => {
  if (MOCK_MODE) return () => {};
  const r = ref(db, 'questions');
  onValue(r, snap => {
    const val = snap.val();
    cb(val ? Object.values(val) : []);
  });
  return () => off(r);
};

// ── Responses ─────────────────────────────────────────────
export const submitResponse = async (qId, studentId, data) => {
  if (MOCK_MODE) {
    return mockSet('responses', (prev) => {
      const qResponses = prev[qId] || {};
      return { ...prev, [qId]: { ...qResponses, [studentId]: { ...data, timestamp: Date.now() } } };
    });
  }
  return set(ref(db, `responses/${qId}/${studentId}`), { ...data, timestamp: Date.now() });
};

export const listenResponses = (qId, cb) => {
  if (MOCK_MODE) return () => {};
  const r = ref(db, `responses/${qId}`);
  onValue(r, snap => cb(snap.val() || {}));
  return () => off(r);
};

export const listenAllResponses = (cb) => {
  if (MOCK_MODE) return () => {};
  const r = ref(db, 'responses');
  onValue(r, snap => cb(snap.val() || {}));
  return () => off(r);
};

// ── Results ───────────────────────────────────────────────
export const setResults = async (results) => {
  if (MOCK_MODE) return mockSet('results', results);
  return set(ref(db, 'results'), results);
};
export const listenResults = (cb) => {
  if (MOCK_MODE) return () => {};
  const r = ref(db, 'results');
  onValue(r, snap => cb(snap.val() || {}));
  return () => off(r);
};

// ── Device Heartbeat ──────────────────────────────────────
export const updateDeviceHeartbeat = async (deviceId) => {
  if (MOCK_MODE) return;
  return set(ref(db, `devices/${deviceId}`), { lastSeen: Date.now(), online: true });
};

export const listenDevices = (cb) => {
  if (MOCK_MODE) return () => {};
  const r = ref(db, 'devices');
  onValue(r, snap => cb(snap.val() || {}));
  return () => off(r);
};

// ── Reset ─────────────────────────────────────────────────
export const resetSession = async () => {
  if (MOCK_MODE) {
    mockSet('responses', {});
    mockSet('results', {});
    mockSet('session', { currentQ: null, startTime: null, timer: 30, status: 'idle', autoMode: false });
    return;
  }
  return Promise.all([
    remove(ref(db, 'responses')),
    remove(ref(db, 'results')),
    set(ref(db, 'quizSession'), { currentQ: null, startTime: null, timer: 30, status: 'idle', autoMode: false }),
  ]);
};
