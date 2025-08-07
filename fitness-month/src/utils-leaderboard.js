// 4. 🧍 Mapping
// ✔ In: utils-leaderboard.js
// 	•	Build athleteMap
// 	•	Build clubMap

// 5. 🔁 Streak Check
// ✔ Done after mapping, only if requireDailyStreak is true
// ⏩ Remove athletes who miss streak requirement



import { DEBUG } from './main-leaderboard.js';

/**
 * Calculate totals for an array of activities.
 * Returns object with total duration, distance, elevation, MET, and count.
 */
export function calculateTotals(activities) {
  return activities.reduce(
    (totals, act) => {
      totals.duration += act.duration || 0;
      totals.distance += act.distance || 0;
      totals.elevation += act.elevation || 0;
      totals.met += act.met || 0;
      totals.count += 1;
      return totals;
    },
    { duration: 0, distance: 0, elevation: 0, met: 0, count: 0 }
  );
}

/**
 * Build a map of clubs keyed by club name.
 * athleteProfiles should be an object keyed by athlete name, containing club arrays.
 * Each club entry includes member list, activities, and totals.
 */
export function buildClubMap(athleteMap, athleteProfiles) {
  const clubMap = new Map();

  athleteMap.forEach((athleteData, athleteName) => {
    const clubs = (athleteProfiles[athleteName]?.clubs) || [];

    clubs.forEach(clubName => {
      if (!clubMap.has(clubName)) {
        clubMap.set(clubName, { members: new Set(), activities: [], totals: null });
      }

      const club = clubMap.get(clubName);
      club.members.add(athleteName);
      club.activities.push(...athleteData.activities);
    });
  });

  // Calculate totals for each club
  clubMap.forEach(club => {
    club.totals = calculateTotals(club.activities);
    // Convert members Set to Array for easier rendering
    club.members = Array.from(club.members);
  });

  return clubMap;
}

/**
 * Sort leaderboard data (array of objects) by a key in ascending or descending order.
 * sortOrder: 'asc' or 'desc'
 */
export function sortLeaderboardData(data, sortKey, sortOrder = 'desc') {
  return [...data].sort((a, b) => {
    const aVal = a.totals[sortKey] || 0;
    const bVal = b.totals[sortKey] || 0;
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });
}

/**
 * Build athlete map from filtered activities.
 * Returns a Map where:
 * - Key: athlete name (string)
 * - Value: {
 *     activities: Array of activity objects,
 *     totals: { duration, distance, elevation, met, count }
 *   }
 */
export function buildAthleteMap(filteredActivities) {
  const athleteMap = new Map();

  filteredActivities.forEach(activity => {
    const athlete = activity.athlete || 'Unknown';

    if (!athleteMap.has(athlete)) {
      athleteMap.set(athlete, { activities: [], totals: { duration: 0, distance: 0, elevation: 0, met: 0, count: 0 } });
    }

    const athleteData = athleteMap.get(athlete);
    athleteData.activities.push(activity);

    // Update totals
    athleteData.totals.duration += activity.duration || 0;
    athleteData.totals.distance += activity.distance || 0;
    athleteData.totals.elevation += activity.elevation || 0;
    athleteData.totals.met += activity.met || 0;
    athleteData.totals.count += 1;
  });

  if (DEBUG.athleteMapping) {
    console.log('Athlete Map:', athleteMap);
  }

  return athleteMap;
}
