// src/engines/rankingEngine.js
/**
 * Ranking Engine:
 * Sort by score DESC → avgTime ASC (fastest responder wins ties)
 */

/**
 * Rank students from scoring results.
 * @param {object} studentStats - output of calculateScores()
 * @returns {Array} sorted array of {studentId, rank, score, correct, wrong, avgTime}
 */
export const rankStudents = (studentStats) => {
  return Object.entries(studentStats)
    .map(([studentId, stats]) => ({ studentId, ...stats }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.avgTime - b.avgTime; // fastest wins tie
    })
    .map((student, index) => ({ ...student, rank: index + 1 }));
};
