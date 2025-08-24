// 1. Validation Step
// ✔ Done in utils-valid-activities.js
// ✅ Validation Rules:
// 	•	isValidActivity !== 'false'
// 	•	Not a duplicate (based on Activity ID)
// ⏩ Result: A list of valid but unfiltered activities.



import { DEBUG } from './main-leaderboard.js';

// ***************************
// ***   DATA VALIDATION   ***
// ***************************

/** 
 * Check if a raw activity is valid based on "is Activity Valid" column and presence of Activity ID ("id" column).
 */
function isRawActivityValid(activity) {
  return (
    activity['is Activity Valid']?.trim().toLowerCase() !== 'false' &&
    activity['id'] &&
    activity['id'].trim() !== ''
  );
}

/**
 * Filter and return valid raw activities (not standardized yet).
 */
export function validateRawActivities(rawActivities) {
  const seenIDs = new Set();
  const validActivities = [];

  for (const activity of rawActivities) {
    const id = activity['id'];

    if (!isRawActivityValid(activity)) {
      if (DEBUG?.validation) {
        if (activity['is Activity Valid']?.trim().toLowerCase() === 'false') {
          console.warn(`[INVALID] Skipped activity — Marked as invalid by column`, activity);
        } else if (!activity['id'] || activity['id'].trim() === '') {
          console.warn(`[INVALID] Skipped activity — Missing or empty Activity ID`, activity);
        } else {
          console.warn(`[INVALID] Skipped activity — Unknown reason`, activity);
        }
      }
      continue;
    }

    if (seenIDs.has(id)) {
      if (DEBUG?.validation) {
        console.warn(`[DUPLICATE] Skipped duplicate Activity ID: ${id}`);
      }
      continue;
    }

    seenIDs.add(id);
    validActivities.push(activity);
    if (DEBUG?.validation) {
      console.info(`[VALID] Accepted activity:`, {
        id: activity.id,
        athlete: activity['Athlete'],
        name: activity['Activity'],
        duration: activity['Duration']
      });
    }
  }

  if (DEBUG?.validation) {
    console.info(`✅ [VALIDATION] Valid activities after deduplication: ${validActivities.length}/${rawActivities.length}`);
  }

  return validActivities;
}
