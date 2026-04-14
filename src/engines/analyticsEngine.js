// src/engines/analyticsEngine.js
/**
 * Analytics Engine:
 * Question difficulty, accuracy, student weak areas, auto insights.
 */

/**
 * Per-question analytics.
 * @param {Array} questions
 * @param {object} allResponses - {[qId]: {[studentId]: {answer}}}
 * @returns {Array} enriched question objects with analytics
 */
export const analyzeQuestions = (questions, allResponses) => {
  return questions.map(q => {
    const qResponses = allResponses[q.id] || {};
    const total = Object.keys(qResponses).length;
    const correct = Object.values(qResponses).filter(r => r.answer === q.correctAnswer).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgTime = total > 0
      ? parseFloat((Object.values(qResponses).reduce((s, r) => s + (r.responseTime || 0), 0) / total).toFixed(2))
      : 0;

    // Difficulty: < 40% accuracy = hard, 40-70 = medium, > 70 = easy
    const difficulty = accuracy < 40 ? 'hard' : accuracy < 70 ? 'medium' : 'easy';

    return { ...q, total, correct, accuracy, avgTime, difficulty };
  });
};

/**
 * Generate human-readable insights from analytics.
 * @param {Array} analyzedQuestions - output of analyzeQuestions()
 * @param {Array} rankedStudents - output of rankStudents()
 * @returns {string[]} array of insight strings
 */
export const generateInsights = (analyzedQuestions, rankedStudents) => {
  const insights = [];

  // Hardest question
  const hardest = [...analyzedQuestions].sort((a, b) => a.accuracy - b.accuracy)[0];
  if (hardest) {
    insights.push(`📉 Most students struggled with Q${analyzedQuestions.indexOf(hardest) + 1} — only ${hardest.accuracy}% got it right (hardest question).`);
  }

  // Easiest question
  const easiest = [...analyzedQuestions].sort((a, b) => b.accuracy - a.accuracy)[0];
  if (easiest && easiest !== hardest) {
    insights.push(`✅ Q${analyzedQuestions.indexOf(easiest) + 1} was the easiest — ${easiest.accuracy}% accuracy.`);
  }

  // Overall class accuracy
  const avgAccuracy = analyzedQuestions.length > 0
    ? Math.round(analyzedQuestions.reduce((s, q) => s + q.accuracy, 0) / analyzedQuestions.length)
    : 0;
  insights.push(`📊 Class average accuracy: ${avgAccuracy}%.`);

  // Top performer
  if (rankedStudents.length > 0) {
    const top = rankedStudents[0];
    insights.push(`⚡ Top performer: ${top.studentId} with ${top.score} points and avg response time of ${top.avgTime}s.`);
  }

  // Low performers
  const lowPerformers = rankedStudents.filter(s => s.correct < (analyzedQuestions.length * 0.4));
  if (lowPerformers.length > 0) {
    insights.push(`⚠️ ${lowPerformers.length} student(s) answered less than 40% of questions correctly and may need extra attention.`);
  }

  return insights;
};
