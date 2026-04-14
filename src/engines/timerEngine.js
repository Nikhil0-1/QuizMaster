// src/engines/timerEngine.js
/**
 * Timer Engine: Computes real-time countdown synced from Firebase startTime.
 * Used by both Admin and Display to stay in perfect sync.
 */

/**
 * Compute seconds remaining from a Firebase startTime + timer duration.
 * @param {number} startTime - Unix ms timestamp when this question started
 * @param {number} timer - Duration in seconds
 * @returns {number} seconds remaining (clamped to 0)
 */
export const getSecondsRemaining = (startTime, timer) => {
  if (!startTime) return timer;
  const elapsed = (Date.now() - startTime) / 1000;
  return Math.max(0, Math.ceil(timer - elapsed));
};

/**
 * Get response time in seconds for a given startTime.
 * @param {number} startTime - Unix ms timestamp
 * @returns {number}
 */
export const getResponseTime = (startTime) => {
  return parseFloat(((Date.now() - startTime) / 1000).toFixed(3));
};

/**
 * Check if the timer for a question has expired.
 * @param {number} startTime
 * @param {number} timer
 * @returns {boolean}
 */
export const isTimerExpired = (startTime, timer) => {
  if (!startTime) return false;
  return (Date.now() - startTime) / 1000 >= timer;
};
