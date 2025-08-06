import { parseDurationToMinutes } from './data-utils.js';

// Check if an activity is valid based on 'is Activity Valid' column and min duration (default 30 min)
export function isActivityValid(activity, minDuration = 30) {
  const isValidFlag = (activity['is Activity Valid'] || '').toString().trim().toLowerCase();
  const duration = parseDurationToMinutes(activity['Duration']);
  return isValidFlag !== 'false' && duration >= minDuration;
}

// Filter activities to keep only valid ones
export function filterValidActivities(activities, minDuration = 30) {
  return activities.filter(activity => isActivityValid(activity, minDuration));
}

// Remove duplicate activities by 'Activity Strava ID' (keep first occurrence)
export function deduplicateActivities(activities) {
  const seenIds = new Set();
  return activities.filter(activity => {
    const id = activity['Activity Strava ID'] || activity.id || null;
    if (!id) return true; // keep if no id (or you can choose to exclude)
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
}
