// src/demo/demoDataGenerator.js
/**
 * Demo Mode — inject realistic fake data into Firebase to preview the system
 * without real ESP32 devices or students.
 */
import { addQuestion, updateSession, submitResponse } from '../firebase/quizService';
import { validateResponse } from '../engines/responseValidator';

const DEMO_QUESTIONS = [
  { text: 'What is the capital of France?', options: ['Berlin', 'Paris', 'London', 'Rome'], correctAnswer: 'B', timer: 20 },
  { text: 'Which planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mercury', 'Mars'], correctAnswer: 'C', timer: 20 },
  { text: 'What is 12 × 12?', options: ['134', '144', '154', '164'], correctAnswer: 'B', timer: 15 },
  { text: 'Who wrote "Romeo and Juliet"?', options: ['Dickens', 'Hemingway', 'Austen', 'Shakespeare'], correctAnswer: 'D', timer: 20 },
  { text: 'What is the speed of light?', options: ['3×10⁷ m/s', '3×10⁸ m/s', '3×10⁹ m/s', '3×10⁶ m/s'], correctAnswer: 'B', timer: 25 },
];

const STUDENT_IDS = ['ESP001', 'ESP002', 'ESP003', 'ESP004', 'ESP005', 'ESP006', 'ESP007', 'ESP008'];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand = (min, max) => Math.random() * (max - min) + min;

/**
 * Upload demo questions to Firebase.
 */
export const uploadDemoQuestions = async () => {
  for (const q of DEMO_QUESTIONS) {
    await addQuestion(q);
  }
};

/**
 * Simulate a full quiz session with fake student responses.
 * @param {Array} questions - already-loaded questions from the store
 * @param {function} onProgress - optional callback(message) for UI updates
 */
export const runDemoSession = async (questions, onProgress = () => {}) => {
  if (questions.length === 0) {
    onProgress('No questions found. Upload demo questions first.');
    return;
  }

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const startTime = Date.now();

    await updateSession({
      currentQ: q.id,
      startTime,
      timer: q.timer || 20,
      status: 'active',
    });

    onProgress(`Question ${qi + 1}/${questions.length}: "${q.text.substring(0, 40)}…"`);

    // Simulate students responding at random times
    for (const studentId of STUDENT_IDS) {
      const delay = rand(1500, q.timer * 800); // respond sometime during the timer
      await sleep(delay);

      // 75% chance of correct answer
      const isCorrect = Math.random() < 0.75;
      const answer = isCorrect ? q.correctAnswer : ['A','B','C','D'].find(l => l !== q.correctAnswer);
      const responseTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(3));

      const validation = validateResponse({
        studentId, submittedQId: q.id, currentQId: q.id,
        startTime, timer: q.timer || 20,
        existingResponses: {},
      });

      if (validation.valid) {
        await submitResponse(q.id, studentId, { answer, responseTime });
      }
    }

    // Wait rest of timer before next question
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = Math.max(0, (q.timer || 20) - elapsed);
    await sleep(remaining * 1000 + 500);
  }

  await updateSession({ status: 'ended' });
  onProgress('Demo complete! Check leaderboard and analytics.');
};
