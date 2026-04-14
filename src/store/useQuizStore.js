// src/store/useQuizStore.js — Global quiz session state
import { create } from 'zustand';

const useQuizStore = create((set, get) => ({
  // Session state
  session: {
    currentQ: null,
    startTime: null,
    timer: 30,
    status: 'idle', // idle | active | paused | ended
    autoMode: false,
  },
  questions: [],
  responses: {},       // { [qId]: { [studentId]: {answer, responseTime, timestamp} } }
  results: {},         // { [studentId]: {score, correct, wrong, avgTime, rank} }
  devices: {},         // { [deviceId]: {lastSeen, online} }
  currentTimeElapsed: 0, // seconds elapsed in current question
  revealAnswer: false,
  fastestResponder: null,

  // Setters
  setSession: (session) => set({ session }),
  setQuestions: (questions) => set({ questions }),
  setResponses: (responses) => set({ responses }),
  setResults: (results) => set({ results }),
  setDevices: (devices) => set({ devices }),
  setCurrentTimeElapsed: (t) => set({ currentTimeElapsed: t }),
  setRevealAnswer: (v) => set({ revealAnswer: v }),
  setFastestResponder: (id) => set({ fastestResponder: id }),

  // Helper: get current question object
  getCurrentQuestion: () => {
    const { session, questions } = get();
    return questions.find(q => q.id === session.currentQ) || null;
  },

  // Helper: get current question responses
  getCurrentResponses: () => {
    const { session, responses } = get();
    return session.currentQ ? (responses[session.currentQ] || {}) : {};
  },
}));

export default useQuizStore;
