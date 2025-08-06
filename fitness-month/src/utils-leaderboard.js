// 4. 🧍 Mapping
// ✔ In: utils-leaderboard.js
// 	•	Build athleteMap
// 	•	Build clubMap

// 5. 🔁 Streak Check
// ✔ Done after mapping, only if requireDailyStreak is true
// ⏩ Remove athletes who miss streak requirement

// 6. 📊 Leaderboard Sorting + Rendering
// ✔ In main-leaderboard.js

// utils-leaderboard.js

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
 * Build a map of athletes keyed by athlete name.
 * Each entry includes the athlete's activities and totals.
 */
export function buildAthleteMap(activities) {
  const map = new Map();

  activities.forEach(act => {
    const name = act.athlete || 'Unknown';

    if (!map.has(name)) {
      map.set(name, { activities: [], totals: null });
    }
    map.get(name).activities.push(act);
  });

  // Calculate totals for each athlete
  map.forEach(athlete => {
    athlete.totals = calculateTotals(athlete.activities);
  });

  return map;
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
