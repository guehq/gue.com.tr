// 4. 🧍 Mapping
// ✔ In: utils-leaderboard.js
// 	•	Build athleteMap
// 	•	Build clubMap

// 5. 🔁 Streak Check
// ✔ Done after mapping, only if requireDailyStreak is true
// ⏩ Remove athletes who miss streak requirement

// 6. 📊 Leaderboard Sorting + Rendering
// ✔ In main-leaderboard.js



import { DEBUG } from './main-leaderboard.js';



function formatDuration(minutes = 0) {
  const totalSeconds = Math.round(minutes * 60);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [hrs, mins, secs]
    .map(val => String(val).padStart(2, '0'))
    .join(':');
}

// Render top 10 leaderboards for each category
export function renderAllLeaderboards(athleteMap) {
  renderLeaderboardSection(athleteMap, 'duration', 'durationLB', '🏆 Duration Leaderboard');
  renderLeaderboardSection(athleteMap, 'distance', 'distanceLB', '🏆 Distance Leaderboard');
  renderLeaderboardSection(athleteMap, 'elevation', 'elevationLB', '🏆 Elevation Leaderboard');
  renderLeaderboardSection(athleteMap, 'count', 'activitiesLB', '🏆 Activity Count Leaderboard');
  renderLeaderboardSection(athleteMap, 'met', 'metScoreLB', '🏆 MET Score Leaderboard');
}

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
export function buildClubMap(athleteMap, athleteProfiles = window.athleteProfiles || {}) {
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

// ************************************
// ***   RENDER ATHLETE MAP TABLE   ***
// ************************************

export function renderAthleteMapTable(athleteMap, athleteProfiles = window.athleteProfiles || {}) {
  const tbody = document.getElementById('athleteTableBody');
  if (!tbody) {
    console.warn('renderAthleteMapTable: Table body element not found');
    return;
  }

  tbody.innerHTML = ''; // Clear existing rows

  let idx = 1;
  athleteMap.forEach((data, athlete) => {
    const profile = athleteProfiles?.[athlete];
    const fullName = profile?.fullName || athlete;
    const stravaUrl = profile?.stravaId ? `https://www.strava.com/athletes/${profile.stravaId}` : '#';
    const stravaImg = profile?.stravaImg || './images/default-avatar.png';

    const row = document.createElement('tr');
    row.innerHTML = `
      <th>${idx}</th>
      <td class="has-tooltip-right" data-tooltip="">
        <div class="tooltip-container is-flex is-align-items-center">
          ${stravaImg ? `<figure class="image is-32x32 mr-2"><img class="is-rounded" src="${stravaImg}" alt="${fullName}"></figure>` : ''}
          <div>
            <a href="${stravaUrl}" target="_blank" rel="noopener noreferrer" class="athlete-name has-text-dark">${fullName}</a>
            <div class="tooltip-content">
              <table class="table is-bordered is-narrow is-fullwidth">
                <thead>
                  <tr>
                    <th></th>
                    <th class="has-text-centered">Date</th>
                    <th class="has-text-left">Activity</th>
                    <th class="has-text-right">Dur.</th>
                    <th class="has-text-right">Dist.</th>
                    <th class="has-text-right">Elev.</th>
                    <th class="has-text-right">MET</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.activities.map((act, index) => `
                    <tr>
                      <th class="has-text-right">${index + 1}</th>
                      <td class="has-text-centered">${act.date || ''}</td>
                      <td class="has-text-left">${act.activityName || ''}</td>
                      <td class="has-text-right">${formatDuration(act.duration)}</td>
                      <td class="has-text-right">${act.distance.toFixed(2) || 0} km</td>
                      <td class="has-text-right">${act.elevation.toFixed(1) || 0} m</td>
                      <td class="has-text-right">${act.met?.toFixed(1) || 0}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </td>
      <td class="has-text-right">${data.totals.count}</td>
      <td class="has-text-right">${formatDuration(data.totals.duration)}</td>
      <td class="has-text-right">${data.totals.distance.toFixed(2)} km</td>
      <td class="has-text-right">${data.totals.elevation.toFixed(1)} m</td>
      <td class="has-text-right">${data.totals.met.toFixed(1)}</td>
    `;

    idx++;
    tbody.appendChild(row);
  });
}

/**
 * Filter athletes by daily streak requirement.
 * Removes athletes from the map who do not meet the streak requirement.
 * Only runs if DEBUG.streakCheck is true.
 */
export function filterAthletesByStreak(athleteMap, startDate, endDate) {
  if (DEBUG.streakCheck) {
    console.log('Filtering athletes by streak requirement...');
  }

  let removedCount = 0;

  for (const [athlete, data] of athleteMap.entries()) {
    const activeDates = new Set(data.activities.map(a => a.date));
    const current = new Date(startDate);
    const end = new Date(endDate);
    let hasGap = false;

    while (current <= end) {
      const dayStr = current.toISOString().slice(0, 10);
      if (!activeDates.has(dayStr)) {
        hasGap = true;
        break;
      }
      current.setDate(current.getDate() + 1);
    }

    if (hasGap) {
      athleteMap.delete(athlete);
      removedCount++;
      if (DEBUG.streakCheck) {
        console.warn(`[Athlete Removed] ${athlete} (did not meet streak requirement)`);
      }
    }
  }

  if (DEBUG.streakCheck) {
    const remainingCount = athleteMap.size;
    const totalCount = removedCount + remainingCount;
    console.log(`Filtered athletes by streak requirement. Removed ${removedCount} athletes.`);
    console.info(`[Streak Summary] ${remainingCount} passed / ${removedCount} removed / ${totalCount} total`);
  }
}

/**
 * Capitalizes the first letter of a string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Format numbers differently depending on sort key
 */
function formatNumber(value, sortKey) {
  if (!value && value !== 0) return '-';
  switch (sortKey) {
    case 'duration':
      return formatDuration(value); // assuming value is in minutes
    case 'distance':
      return `${value.toFixed(2)} km`;
    case 'elevation':
      return `${value.toFixed(1)} m`;
    case 'count':
      return value;
    case 'met':
      return value.toFixed(1);
    default:
      return value;
  }
}

/**
 * Render a top 10 leaderboard table into given container
 * @param {Map} athleteMap - Map of athletes with totals and activities
 * @param {string} sortKey - Key to sort by ('duration', 'distance', 'elevation', 'count', 'met')
 * @param {string} containerId - The HTML container id to render the table into
 * @param {string} title - The leaderboard title to display
 */
export function renderLeaderboardSection(athleteMap, sortKey, containerId, title) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container #${containerId} not found`);
    return;
  }

  // Convert Map to Array for sorting
  const athleteArray = Array.from(athleteMap.entries()).map(([athlete, data]) => ({
    athlete,
    totals: data.totals
  }));

  // Sort descending by sortKey, tie-break by MET descending
  athleteArray.sort((a, b) => {
    const aVal = a.totals[sortKey] || 0;
    const bVal = b.totals[sortKey] || 0;

    if (bVal === aVal) {
      return (b.totals.met || 0) - (a.totals.met || 0);
    }
    return bVal - aVal;
  });

  // Take top 10
  const top10 = athleteArray.slice(0, 10);

  // Build table HTML
  let html = `
    <h3 class="title is-5 mb-4">${title}</h3>
    <table class="table is-bordered is-striped table is-narrow is-hoverable is-fullwidth">
      <thead>
        <tr>
          <th></th>
          <th>Athlete</th>
          <th class="has-text-right">${capitalizeFirstLetter(sortKey)}</th>
        </tr>
      </thead>
      <tbody>
  `;

  top10.forEach((entry, idx) => {
    const profile = (window.athleteProfiles || {})[entry.athlete] || {};
    const fullName = profile.fullName || entry.athlete;
    const stravaImg = profile.stravaImg || './images/default-avatar.png';
    const stravaUrl = profile.stravaId ? `https://www.strava.com/athletes/${profile.stravaId}` : '#';
    const val = entry.totals[sortKey];
    html += `
      <tr>
        <th class="has-text-centered">${idx + 1}</th>
        <td class="has-text-left">
          <div class="is-flex is-align-items-center">
            <figure class="image is-24x24 mr-2">
              <img class="is-rounded" src="${stravaImg}" alt="${fullName}">
            </figure>
            <p>${fullName}</p>
          </div>
        </td>
        <td class="has-text-right">${formatNumber(val, sortKey)}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}
