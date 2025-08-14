// 4. 🧍 Mapping
// ✔ In: utils-leaderboard.js
// 	•	Build athleteMap
// 	•	Build clubMap

// 5. 🔁 Streak Check
// ✔ Done after mapping, only if requireDailyStreak is true
// ⏩ Remove athletes who miss streak requirement

// 6. 📊 Leaderboard Sorting + Rendering
// ✔ In main-leaderboard.js



import { 
  DEBUG,
  DEFAULT_MAX_RANK
} from './main-leaderboard.js';



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
function renderAllLeaderboards(athleteMap) {
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
function calculateTotals(activities) {
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
 * Sort leaderboard data (array of objects) by a key in ascending or descending order.
 * sortOrder: 'asc' or 'desc'
 */
function sortLeaderboardData(data, sortKey, sortOrder = 'desc') {
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
function buildAthleteMap(filteredActivities) {
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

function renderAthleteMapTable(athleteMap, athleteProfiles = window.athleteProfiles || {}) {
  const tbody = document.getElementById('qualifiedAthletesTableBody');
  if (!tbody) {
    console.warn('renderAthleteMapTable: Table body element not found');
    return;
  }

  tbody.innerHTML = '';

  // Convert map entries to array for sorting
  const athleteArray = Array.from(athleteMap.entries());

  // Sort by full name from athleteProfiles if exists, else by athlete key
  athleteArray.sort((a, b) => {
    const nameA = (athleteProfiles[a[0]]?.fullName || a[0]).toUpperCase();
    const nameB = (athleteProfiles[b[0]]?.fullName || b[0]).toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  let idx = 1;
  athleteArray.forEach(([athlete, data]) => {
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

    tbody.appendChild(row);
    idx++;
  });
}

/**
 * Filter athletes by daily streak requirement.
 * Removes athletes from the map who do not meet the streak requirement.
 * Only runs if DEBUG.streakCheck is true.
 */
function filterAthletesByStreak(athleteMap, startDate, endDate) {
  if (DEBUG.streakCheck) {
    console.log('Filtering athletes by streak requirement...');
  }

  // Always return a new Map, even if all athletes are filtered out.
  const filteredMap = new Map();
  let removedCount = 0;
  let passedCount = 0;

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

    if (!hasGap) {
      filteredMap.set(athlete, data);
      passedCount++;
    } else {
      removedCount++;
      if (DEBUG.streakCheck) {
        console.warn(`[Athlete Removed] ${athlete} (did not meet streak requirement)`);
      }
    }
  }

  if (DEBUG.streakCheck) {
    const remainingCount = filteredMap.size;
    const totalCount = removedCount + remainingCount;
    console.log(`Filtered athletes by streak requirement. Removed ${removedCount} athletes.`);
    console.info(`[Streak Summary] ${remainingCount} passed / ${removedCount} removed / ${totalCount} total`);
  }
  return filteredMap;
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
 * Render a leaderboard table for the top N athletes into given container
 * @param {Map} athleteMap - Map of athletes with totals and activities
 * @param {string} sortKey - Key to sort by ('duration', 'distance', 'elevation', 'count', 'met')
 * @param {string} containerId - The HTML container id to render the table into
 * @param {string} title - The leaderboard title to display
 */
function renderLeaderboardSection(athleteMap, sortKey, containerId, title) {
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

  // Take top N (DEFAULT_MAX_RANK)
  const topN = athleteArray.slice(0, DEFAULT_MAX_RANK);

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

  topN.forEach((entry, idx) => {
    const profile = (window.athleteProfiles || {})[entry.athlete] || {};
    const fullName = profile.fullName || entry.athlete;
    const stravaImg = profile.stravaImg || './images/default-avatar.png';
    const val = entry.totals[sortKey];
    html += `
      <tr>
        <th class="has-text-centered">${
          idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1
        }</th>
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

function buildClubMap(activities, athleteProfiles, communities) {
  const clubMap = {};

  activities.forEach(act => {
    const athleteKey = (act.athlete || '').trim();
    // Safely check for athlete key in athleteProfiles
    const athleteProfile = athleteProfiles?.[athleteKey];
    const clubs = athleteProfile?.clubs;

    // If act.athlete is missing or not found in athleteProfiles, skip that activity
    if (!athleteProfile || !Array.isArray(clubs) || clubs.length === 0) {
      if (DEBUG.clubMapping) {
        console.warn(`Skipping athlete "${athleteKey}" due to missing or invalid club data.`);
      }
      return;
    }

    // Use optional chaining for clubs
    clubs?.forEach(clubName => {
      if (!clubMap[clubName]) {
        clubMap[clubName] = {
          ...(communities?.[clubName]),
          totalDuration: 0,
          totalDistance: 0,
          totalElevation: 0,
          totalMET: 0,
          athletes: new Set()
        };
      }
      // Ensure Set exists before adding
      const club = clubMap[clubName];
      club.totalDuration += act.duration || 0;
      club.totalDistance += act.distance || 0;
      club.totalElevation += act.elevation || 0;
      club.totalMET += act.met || 0;
      club.athletes?.add(act.athlete);
    });
  });

  // Convert Sets to counts
  Object.values(clubMap).forEach(club => {
    club.athleteCount = club.athletes?.size || 0;
    delete club.athletes;
  });

  return clubMap;
}

function renderClubLeaderboard(clubMap) {
  const container = document.getElementById('communitiesLB');
  if (!container) {
    console.warn('Community leaderboard container not found');
    return;
  }

  const clubsArray = Object.values(clubMap);

  // Sort by total MET as default (you can change)
  clubsArray.sort((a, b) => b.totalMET - a.totalMET);

  let html = `
    <h3 class="title is-5 mb-4">🏅 Community Leaderboard</h3>
    <table class="table is-bordered is-striped table is-narrow is-hoverable is-fullwidth">
      <thead>
        <tr>
          <th></th>
          <th style="min-width: 170px;">GUE Communities</th>
          <th class="has-text-centered"><abbr title="Active Community Athletes">🏃🏽</abbr></th>
          <th class="has-text-right">Duration</th>
          <th class="has-text-right" style="min-width: 100px;">Distance</th>
          <th class="has-text-right">Elevation</th>
          <th class="has-text-right">MET</th>
        </tr>
      </thead>
      <tbody>
  `;

  clubsArray.forEach((club, idx) => {
    html += `
      <tr>
        <th>${idx + 1}</th>
        <td>
          <div class="is-flex is-align-items-center">
            ${club.logoUrl ? `<figure class="image is-24x24 mr-2"><img src="${club.logoUrl}" alt="${club.shortName}"></figure>` : ''}
            <a href="${club.stravaClubUrl || '#'}" class="has-text-dark" target="_blank">${club.shortName || club.name}</a>
          </div>
        </td>
        <td class="has-text-centered">${club.athleteCount}</td>
        <td class="has-text-right">${formatDuration(club.totalDuration)}</td>
        <td class="has-text-right">${club.totalDistance.toFixed(2)} km</td>
        <td class="has-text-right">${club.totalElevation.toFixed(1)} m</td>
        <td class="has-text-right">${club.totalMET.toFixed(1)}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// *******************************************
// ***   BUILD NON-QUALIFIED ATHLETE MAP   ***
// *******************************************

/**
 * Build map of non-qualified athletes
 * @param {Map} preFilterMap - Athlete map before applying minDuration/daily streak
 * @param {Map} qualifiedMap - Athlete map after filters applied
 * @returns {Map} nonQualifiedMap - Map of athletes who did not pass filters
 */
function buildNonQualifiedAthleteMap(preFilterMap, qualifiedMap) {
  const nonQualifiedMap = new Map();

  preFilterMap.forEach((data, athlete) => {
    // If athlete is NOT in the qualified map, they are non-qualified
    if (!qualifiedMap.has(athlete)) {
      nonQualifiedMap.set(athlete, data);
    }
  });

  if (DEBUG.nonQualified) {
    console.log(`Non-qualified athletes count: ${nonQualifiedMap.size}`, nonQualifiedMap);
  }

  return nonQualifiedMap;
}

// **************************************************
// ***   RENDER NON-QUALIFIED ATHLETE MAP TABLE   ***
// **************************************************

/**
 * Render Non-Qualified Athletes Table
 * @param {Map} nonQualifiedMap
 * @param {Object} athleteProfiles - optional, for full name/photo info
 */
function renderNonQualifiedAthletesTable(nonQualifiedMap, athleteProfiles = window.athleteProfiles || {}) {
  const tbody = document.getElementById('nonQualifiedAthletesTableBody');
  if (!tbody) {
    console.warn('renderNonQualifiedAthletesTable: Table body element not found');
    return;
  }

  tbody.innerHTML = '';

  // Convert Map to Array & sort by activity count descending
  const athleteArray = Array.from(nonQualifiedMap.entries());
  
  // Sort by activity count descending
  athleteArray.sort((a, b) => b[1].totals.count - a[1].totals.count);

  let idx = 1;
  athleteArray.forEach(([athlete, data]) => {
    const profile = athleteProfiles?.[athlete];
    const fullName = profile?.fullName || athlete;
    const stravaUrl = profile?.stravaId ? `https://www.strava.com/athletes/${profile.stravaId}` : '#';
    const stravaImg = profile?.stravaImg || './images/default-avatar.png';
    const nameClass = profile?.stravaId ? 'has-text-dark' : 'has-text-danger';

    const row = document.createElement('tr');
    row.innerHTML = `
      <th>${idx}</th>
      <td class="has-tooltip-right" data-tooltip="">
        <div class="tooltip-container is-flex is-align-items-center">
          <figure class="image is-32x32 mr-2"><img class="is-rounded" src="${stravaImg}" alt="${fullName}"></figure>
          <div>
            <a href="${stravaUrl}" target="_blank" rel="noopener noreferrer" class="${nameClass}">${fullName}</a>
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
                      <td class="has-text-right">${act.distance?.toFixed(2) || 0} km</td>
                      <td class="has-text-right">${act.elevation?.toFixed(1) || 0} m</td>
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

    tbody.appendChild(row);
    idx++;
  });
}

// Explicit named exports for all utility functions
export {
  formatDuration,
  calculateTotals,
  buildAthleteMap,
  filterAthletesByStreak,
  renderAthleteMapTable,
  renderNonQualifiedAthletesTable,
  sortLeaderboardData,
  renderAllLeaderboards,
  buildClubMap,
  renderClubLeaderboard,
  renderLeaderboardSection
};
