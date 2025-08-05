let allActivities = [];

document.addEventListener('DOMContentLoaded', function () {
  // Set default filter settings as specified
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const formatDate = (d) => d.toISOString().slice(0, 10);
  document.getElementById('startDate').value = '2025-08-01';
  document.getElementById('endDate').value = formatDate(yesterday);
  document.getElementById('filter30min').checked = true;
  document.getElementById('filterDaily').checked = true;

  fetch(ZAPIER_CSV_PATH)
    .then(response => response.text())
    .then(text => {
      const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
      allActivities = parsed.data;
      buildAllLeaderboards(allActivities);
      // Apply filters using preset values
      filterActivities();
    })
    .catch(error => {
      console.error('Error loading CSV file:', error);
    });

  document.getElementById('filterButton').addEventListener('click', filterActivities);
  document.getElementById('resetButton').addEventListener('click', () => {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    buildAllLeaderboards(allActivities);
  });
});

function buildAllLeaderboards(activities) {
  // Clear old leaderboard sections
  ['activitiesLB', 'durationLB', 'distanceLB', 'elevationLB', 'metScoreLB', 'clubScoreMetLB'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });

  const athleteStats = {};
  const athleteActivities = {};

  activities.forEach(activity => {
    const shortName = `${activity['athlete first name'] || ''} ${activity['athlete last name'] || ''}`.trim();
    if (!shortName) return;

    if (!athleteStats[shortName]) {
      athleteStats[shortName] = {
        totalDuration: 0,
        totalDistance: 0,
        totalElevation: 0,
        activityCount: 0,
        totalMET: 0,
      };
      athleteActivities[shortName] = [];
    }

    athleteStats[shortName].activityCount++;

    const durationMinutes = parseDurationToMinutes(activity['Duration']);
    const distanceKm = parseFloat(activity['distance in K']) || 0;
    const elevationGain = parseFloat(activity['total elevation gain']) || 0;

    athleteStats[shortName].totalDuration += durationMinutes;
    athleteStats[shortName].totalDistance += distanceKm;
    athleteStats[shortName].totalElevation += elevationGain;

    let pace = 0;
    if (distanceKm > 0 && durationMinutes > 0) {
      pace = durationMinutes / distanceKm; // minutes per km
    }

    const sportType = activity['sport type'] || '';
    const metScore = calculateMETScore(sportType, pace, durationMinutes, elevationGain);
    athleteStats[shortName].totalMET += metScore;

    athleteActivities[shortName].push({
      name: activity['name'],
      date: activity['Real Date on Strava'] || activity['formatted start date'] || activity['Date/Time'],
      duration: activity['Duration'],
      distance: activity['distance in K'],
      elevation: activity['total elevation gain']
    });
  });

  const sortedDuration = Object.entries(athleteStats).sort((a, b) => b[1].totalDuration - a[1].totalDuration);
  const sortedDistance = Object.entries(athleteStats).sort((a, b) => b[1].totalDistance - a[1].totalDistance);
  const sortedElevation = Object.entries(athleteStats).sort((a, b) => b[1].totalElevation - a[1].totalElevation);
  const sortedActivities = Object.entries(athleteStats).sort((a, b) => b[1].activityCount - a[1].activityCount);
  const sortedMET = Object.entries(athleteStats).sort((a, b) => b[1].totalMET - a[1].totalMET);

  renderLeaderboard('Duration', sortedDuration, 'durationLB', 'totalDuration', athleteActivities);
  renderLeaderboard('Distance', sortedDistance, 'distanceLB', 'totalDistance', athleteActivities);
  renderLeaderboard('Elev. Gain', sortedElevation, 'elevationLB', 'totalElevation', athleteActivities);
  renderLeaderboard('Activities', sortedActivities, 'activitiesLB', 'activityCount', athleteActivities);
  renderLeaderboard('MET Score', sortedMET, 'metScoreLB', 'totalMET', athleteActivities);

  // Generate Club Leaderboard
  const clubStats = {};

  activities.forEach(activity => {
    const shortName = `${activity['athlete first name'] || ''} ${activity['athlete last name'] || ''}`.trim();
    if (!shortName || !window.athleteProfiles[shortName]) return;

    const profile = window.athleteProfiles[shortName];
    const clubName = (profile.clubs && profile.clubs.length > 0) ? profile.clubs[0] : null;
    if (!clubName || clubName === 'No Club') return;

    if (!clubStats[clubName]) {
      clubStats[clubName] = {
        totalMET: 0,
        totalDuration: 0,
        totalDistance: 0,
        totalElevation: 0,
        totalActivities: 0
      };
    }

    const durationMinutes = parseDurationToMinutes(activity['Duration']);
    const distanceKm = parseFloat(activity['distance in K']) || 0;
    const elevationGain = parseFloat(activity['total elevation gain']) || 0;
    const pace = distanceKm > 0 && durationMinutes > 0 ? durationMinutes / distanceKm : 0;

    const sportType = activity['sport type'] || '';
    const metScore = calculateMETScore(sportType, pace, durationMinutes, elevationGain);

    clubStats[clubName].totalMET += metScore;
    clubStats[clubName].totalDuration += durationMinutes;
    clubStats[clubName].totalDistance += distanceKm;
    clubStats[clubName].totalElevation += elevationGain;
    clubStats[clubName].totalActivities += 1;
  });

  const sortedClubs = Object.entries(clubStats).sort((a, b) => b[1].totalMET - a[1].totalMET);
  renderLeaderboard('Community', sortedClubs, 'clubScoreMetLB', 'totalMET');
}

function renderLeaderboard(title, data, containerId, statKey, athleteActivities) {
  const main = document.querySelector(`#${containerId}`);

  if (containerId === 'clubScoreMetLB') {
    const section = document.createElement('section');
    section.classList.add('section');

    const top10Data = data.slice(0, 10);
    const tableHTML = `
      <h2 class="title is-4">Top 10 - ${title}</h2>
      <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Community</th>
            <th>Activities</th>
            <th>MET</th>
            <th>Duration</th>
            <th>Distance</th>
            <th>Elevation</th>
          </tr>
        </thead>
        <tbody>
          ${top10Data.map(([clubName, stats], index) => {
            return `
              <tr>
                <td class="has-text-centered">${index + 1}</td>
                <td>
                  <div class="is-flex is-align-items-center">
                    <figure class="image is-32x32 mr-2">
                      <img class="is-rounded" src="${(window.communities?.[clubName]?.logoUrl) || './images/default-avatar.png'}" alt="${clubName}" onerror="this.onerror=null; this.src='./images/default-avatar.png';">
                    </figure>
                    <span>${clubName}</span>
                  </div>
                </td>
                <td class="has-text-right">${stats.totalActivities}</td>
                <td class="has-text-right">${stats.totalMET.toFixed(1)}</td>
                <td class="has-text-right">${Math.round(stats.totalDuration)} min</td>
                <td class="has-text-right">${stats.totalDistance.toFixed(1)} km</td>
                <td class="has-text-right">${stats.totalElevation.toFixed(0)} m</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    section.innerHTML = tableHTML;
    main.appendChild(section);
    return;
  }

  const section = document.createElement('section');
  section.classList.add('section');

  // const top10Data = data; /* FULL DATA */
  const top10Data = data.slice(0, 10);

  const tableHTML = `
    <h2 class="title is-4">Top 10 - ${title}</h2>
    <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Athlete</th>
          <th>${title}</th>
        </tr>
      </thead>
      <tbody>
        ${top10Data.map(([shortName, stats], index) => {
          const profile = window.athleteProfiles[shortName] || null;
          const fullName = profile ? profile.fullName : shortName;
          const imgSrc = profile ? (profile.stravaImg || './images/default-avatar.png') : './images/default-avatar.png';

          let value = stats[statKey];
          if (statKey === 'totalDuration') value = `${Math.round(value)} min`;
          if (statKey === 'totalDistance') value = `${value.toFixed(2)} km`;
          if (statKey === 'totalElevation') value = `${value.toFixed(0)} m`;
          if (statKey === 'totalMET') value = `${value.toFixed(1)}`;

          return `
            <tr>
              <td class="has-text-centered">${index + 1}</td>
              <td style="display: flex; align-items: center; gap: 10px; vertical-align: middle; border-width: 0; border-bottom-width: 1px;">
                <img src="${imgSrc}" alt="${fullName}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 30px; height: 30px; border-radius: 50%;">
                <span class="athlete-name" data-athlete="${shortName}">${fullName}</span>
              </td>
              <td class="has-text-right">${value}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  section.innerHTML = tableHTML;
  main.appendChild(section);

  // Add tooltip hover logic
  const tooltip = document.getElementById('activity-tooltip');
  if (!tooltip) return;

  document.querySelectorAll('.athlete-name').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      const name = e.target.dataset.athlete;
      const activities = athleteActivities[name] || [];

      if (activities.length === 0) return;

      const table = `
        <strong>${name}</strong>
        <table class="table is-bordered is-narrow mt-1">
          <thead>
            <tr><th>Date</th><th>Activity</th><th>Dur</th><th>Dist</th><th>Elev</th></tr>
          </thead>
          <tbody>
            ${activities.map(act => `
              <tr>
                <td>${act.date || '-'}</td>
                <td>${act.name || '-'}</td>
                <td>${act.duration || '-'}</td>
                <td>${parseFloat(act.distance || 0).toFixed(2)}</td>
                <td>${parseFloat(act.elevation || 0).toFixed(0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      tooltip.innerHTML = table;
      tooltip.style.display = 'block';
    });

    el.addEventListener('mousemove', (e) => {
      tooltip.style.top = `${e.pageY + 10}px`;
      tooltip.style.left = `${e.pageX + 10}px`;
    });

    el.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}

function isActivityEligible(activity, start, end, only30MinCheckbox) {
  const isValid = (activity['is Activity Valid'] || '').toLowerCase();
  if (isValid === 'false') return false;

  let activityDateStr = activity['Real Date on Strava'] || activity['formatted start date'] || activity['Date/Time'];
  if (!activityDateStr) return false;

  let dateObj;
  if (activity['Real Date on Strava']) {
    dateObj = new Date(activityDateStr);
  } else {
    const parts = activityDateStr.split('/');
    if (parts.length !== 3) return false;
    const dateFormatted = `20${parts[2]}-${parts[1]}-${parts[0]}`;
    dateObj = new Date(dateFormatted);
  }

  if (dateObj < start || dateObj > end) return false;

  if (only30MinCheckbox) {
    const durationMinutes = parseDurationToMinutes(activity['Duration']);
    if (durationMinutes < 30) return false;
  }

  return true;
}

// Parse Duration To Minutes Function
function parseDurationToMinutes(durationStr) {
  if (!durationStr) return 0;

  const num = parseFloat(durationStr);
  if (isNaN(num)) return 0;

  return num; // Duration in minutes as float
}

// Filter Activities Function
function filterActivities() {
  const startDateInput = document.getElementById('startDate').value;
  const endDateInput = document.getElementById('endDate').value;
  const only30MinCheckbox = document.getElementById('filter30min').checked;
  const dailyActivityCheckbox = document.getElementById('filterDaily').checked;

  if (!startDateInput || !endDateInput) {
    alert('Please select both start and end dates.');
    return;
  }

  const start = new Date(startDateInput);
  const end = new Date(endDateInput);

  // Create list of all dates in range
  const dateList = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dateList.push(new Date(d).toISOString().slice(0, 10)); // yyyy-mm-dd
  }

  let filteredActivities = allActivities.filter(activity =>
    isActivityEligible(activity, start, end, only30MinCheckbox)
  );

  if (dailyActivityCheckbox) {
    // Group by athlete and date
    const athleteDays = {};

    allActivities.forEach(activity => {
      if (!isActivityEligible(activity, start, end, only30MinCheckbox)) return;
      const shortName = `${activity['athlete first name'] || ''} ${activity['athlete last name'] || ''}`.trim();
      if (!shortName) return;

      let activityDateStr = activity['Real Date on Strava'] || activity['formatted start date'] || activity['Date/Time'];
      if (!activityDateStr) return;

      let activityDate;
      if (activity['Real Date on Strava']) {
        activityDate = new Date(activityDateStr).toISOString().slice(0, 10);
      } else {
        const parts = activityDateStr.split('/');
        if (parts.length !== 3) return;
        activityDate = `20${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      if (!athleteDays[shortName]) {
        athleteDays[shortName] = new Set();
      }
      athleteDays[shortName].add(activityDate);
    });

    // Ensure athlete has at least one activity on every day in the range
    const qualifiedAthletes = Object.keys(athleteDays).filter(shortName => {
      return dateList.every(date => athleteDays[shortName].has(date));
    });

    filteredActivities = filteredActivities.filter(activity => {
      const shortName = `${activity['athlete first name'] || ''} ${activity['athlete last name'] || ''}`.trim();
      return qualifiedAthletes.includes(shortName);
    });
  }

  buildAllLeaderboards(filteredActivities);
}

function calculateMETScore(sportType, pace, durationMinutes, elevationGain) {
  // Default MET value
  let met = 1;

  // MET values based on sport type and pace (minutes per km)
  // Example MET values for running based on pace:
  // pace < 5 min/km: 12.5 MET
  // 5 <= pace < 6: 11 MET
  // 6 <= pace < 7: 9.8 MET
  // 7 <= pace < 8: 8.3 MET
  // pace >= 8: 7 MET
  // For cycling or other sports, you can add different logic

  if (sportType.toLowerCase().includes('run')) {
    if (pace > 0 && pace < 5) {
      met = 12.5;
    } else if (pace >= 5 && pace < 6) {
      met = 11;
    } else if (pace >= 6 && pace < 7) {
      met = 9.8;
    } else if (pace >= 7 && pace < 8) {
      met = 8.3;
    } else if (pace >= 8) {
      met = 7;
    }
  } else if (sportType.toLowerCase().includes('cycle') || sportType.toLowerCase().includes('bike')) {
    // Cycling MET estimate based on average speed (pace converted to speed)
    let speed = 0;
    if (pace > 0) {
      speed = 60 / pace; // km/h
    }
    if (speed >= 30) {
      met = 16;
    } else if (speed >= 20) {
      met = 12;
    } else if (speed >= 16) {
      met = 10;
    } else if (speed >= 12) {
      met = 8;
    } else {
      met = 6;
    }
  } else {
    // Default MET for other sports or unknown
    met = 6;
  }

  // Adjust MET for elevation gain: add 0.1 MET for every 10m elevation gain per minute
  const elevationFactor = (elevationGain / durationMinutes) / 10 * 0.1;
  met += elevationFactor;

  // Total MET score = MET value * duration in minutes
  return met * durationMinutes;
}

const tooltip = document.createElement('div');
tooltip.id = 'activity-tooltip';
tooltip.style.position = 'absolute';
tooltip.style.zIndex = 9999;
tooltip.style.padding = '10px';
tooltip.style.border = '1px solid #ccc';
tooltip.style.background = 'white';
tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);
