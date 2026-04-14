// src/engines/responseValidator.js
/**
 * Response Validation Engine
 * Rejects invalid submissions (duplicate, wrong question, post-timer).
 */

/**
 * Validate a student response before submitting to Firebase.
 * @param {object} params
 * @returns {{ valid: boolean, reason?: string }}
 */
export const validateResponse = ({
  studentId,
  submittedQId,
  currentQId,
  startTime,
  timer,
  existingResponses,  // { [studentId]: {...} }
}) => {
  // 1. Wrong question guard
  if (submittedQId !== currentQId) {
    return { valid: false, reason: 'Wrong question number.' };
  }

  // 2. Duplicate submission guard
  if (existingResponses && existingResponses[studentId]) {
    return { valid: false, reason: 'Answer already submitted for this question.' };
  }

  // 3. Time lock guard
  if (startTime) {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > timer) {
      return { valid: false, reason: 'Answer submitted after timer expired.' };
    }
  }

  return { valid: true };
};
