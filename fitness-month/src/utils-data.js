// 2. 🧽 Standardization
// ✔ Located in: utils-data.js or utils-activity.js
// (we can place this where you prefer — utils-data.js would be more logical)
// Steps:
// 	•	✅ Standardize date formats → YYYY-MM-DD
// 	•	✅ Parse durations into minutes
// 	•	✅ Trim strings (like fullName, clubName, etc.)
// 	•	✅ Standardize text casing if needed
// 	•	✅ Remove irrelevant fields (like photo, index, etc.)
// 	•	✅ Calculate MET score per activity
// ⏩ Output: standardizedActivities



import { DEBUG } from './main-leaderboard.js';

// ********************************
// ***   DATA STANDARDIZATION   ***
// ********************************

// Parse duration string to minutes as float
export function parseDurationToMinutes(durationStr) {
  if (!durationStr) return 0;
  const num = parseFloat(durationStr);
  if (isNaN(num)) return 0;
  return num;
}

// Calculate MET score based on sport type, pace, duration, and elevation
export function calculateMETScore(sportType, pace, durationMinutes, elevationGain) {
  let met = 1;
  const sport = sportType.toLowerCase();

  if (sport.includes('run')) {
    if (pace > 0 && pace < 5) met = 12.5;
    else if (pace < 6) met = 11;
    else if (pace < 7) met = 9.8;
    else if (pace < 8) met = 8.3;
    else met = 7;
  } else if (sport.includes('cycle') || sport.includes('bike')) {
    const speed = pace > 0 ? 60 / pace : 0;
    if (speed >= 30) met = 16;
    else if (speed >= 20) met = 12;
    else if (speed >= 16) met = 10;
    else if (speed >= 12) met = 8;
    else met = 6;
  } else {
    met = 6;
  }

  const elevationFactor = (elevationGain / durationMinutes) / 10 * 0.1;
  return met * durationMinutes + elevationFactor;
}

// Format a Date object to YYYY-MM-DD
export function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

// Get list of all date strings (YYYY-MM-DD) between two dates
export function getDateRange(startDate, endDate) {
  const list = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    list.push(formatDate(new Date(d)));
  }
  return list;
}

// Normalize date from activity fields
export function standardizeDate(activity) {
  const realDate = (activity['Real Date on Strava'] || '').trim();
  const estimated = (activity['Estimated Activity Start DateTime'] || '').trim();
  const date = realDate || estimated;

  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) throw new Error('Invalid date');
    return formatDate(parsedDate);
  } catch {
    return null;
  }
}

// Standardize activities from raw input
export function standardizeActivities(rawActivities) {
  const standardized = rawActivities.map((activity) => {
    const date = standardizeDate(activity);
    let duration = parseDurationToMinutes(activity['Duration']);
    let distance = parseFloat(activity['distance in K']);
    let elevation = parseFloat(activity['total elevation gain']);
    duration = Number.isFinite(duration) ? duration : 0;
    distance = Number.isFinite(distance) ? distance : 0;
    elevation = Number.isFinite(elevation) ? elevation : 0;
    const isValid = (activity['is Activity Valid'] || '').toString().trim().toLowerCase() !== 'false';
    let sport = activity['type'] || '';
    sport = sport.trim().toLowerCase();
    const pace = distance > 0 ? duration / distance : 0;
    let met = calculateMETScore(sport, pace, duration, elevation);
    met = Number.isFinite(met) ? met : 0;

    return {
      athlete: (activity['Athlete'] || 'Unknown').trim(),
      fullName: `${(activity['athlete first name'] || '').trim()} ${(activity['athlete last name'] || '').trim()}`.trim(),
      date,
      duration,
      distance,
      elevation,
      met,
      isValid,
      id: (activity['Activity Strava ID'] || '').trim(),
      sport
    };
  });

  if (typeof DEBUG !== 'undefined' && DEBUG.standardization) {
    console.info('[DEBUG] Standardized Activities:', standardized);
  }

  return standardized;
}
