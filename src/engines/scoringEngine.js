// src/engines/scoringEngine.js
/**
 * Scoring Engine:
 * - Correct answer: +10 points
 * - Fastest 3 correct responders get speed bonus (+5, +3, +1)
 * - Wrong/no answer: configurable negative marking (default 0)
 */

const CORRECT_POINTS = 10;
const SPEED_BONUSES = [5, 3, 1]; // rank 1,2,3
const DEFAULT_WRONG_POINTS = 0;

/**
 * Calculate scores for all students across all questions.
 * @param {object} questions - { [qId]: {correctAnswer, options, ...} }
 * @param {object} allResponses - { [qId]: { [studentId]: {answer, responseTime, timestamp} } }
 * @param {number} wrongPenalty - Points deducted for wrong answer (e.g., 3 = -3)
 * @returns {object} { [studentId]: {score, correct, wrong, avgTime, questionBreakdown} }
 */
export const calculateScores = (questions, allResponses, wrongPenalty = DEFAULT_WRONG_POINTS) => {
  const studentStats = {};

  Object.entries(allResponses).forEach(([qId, qResponses]) => {
    const question = Object.values(questions).find(q => q.id === qId);
    if (!question) return;

    const correctAnswer = question.correctAnswer;

    // Sort by responseTime (ASC) to determine speed bonuses
    const correctResponders = Object.entries(qResponses)
      .filter(([_, r]) => r.answer === correctAnswer)
      .sort((a, b) => a[1].responseTime - b[1].responseTime);

    Object.entries(qResponses).forEach(([studentId, response]) => {
      if (!studentStats[studentId]) {
        studentStats[studentId] = { score: 0, correct: 0, wrong: 0, totalTime: 0, count: 0, questionBreakdown: {} };
      }

      const stats = studentStats[studentId];
      const isCorrect = response.answer === correctAnswer;

      // Base score
      if (isCorrect) {
        stats.score += CORRECT_POINTS;
        stats.correct += 1;

        // Speed bonus
        const rank = correctResponders.findIndex(([id]) => id === studentId);
        if (rank >= 0 && rank < SPEED_BONUSES.length) {
          stats.score += SPEED_BONUSES[rank];
        }
      } else {
        stats.score = Math.max(0, stats.score - wrongPenalty);
        stats.wrong += 1;
      }

      stats.totalTime += response.responseTime || 0;
      stats.count += 1;
      stats.questionBreakdown[qId] = {
        answer: response.answer,
        correct: isCorrect,
        responseTime: response.responseTime,
      };
    });
  });

  // Compute avgTime
  Object.values(studentStats).forEach(s => {
    s.avgTime = s.count > 0 ? parseFloat((s.totalTime / s.count).toFixed(2)) : 0;
  });

  return studentStats;
};
