let allActivities = [];

document.addEventListener('DOMContentLoaded', function () {
  fetch(ZAPIER_CSV_PATH)
    .then(response => response.text())
    .then(text => {
      const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
      allActivities = parsed.data;
      buildAllLeaderboards(allActivities);
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
  ['activitiesLB', 'durationLB', 'distanceLB', 'elevationLB'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });

  const athleteStats = {};

  activities.forEach(activity => {
    const shortName = `${activity['athlete first name'] || ''} ${activity['athlete last name'] || ''}`.trim();
    if (!shortName) return;

    if (!athleteStats[shortName]) {
      athleteStats[shortName] = {
        activityCount: 0,
        totalDuration: 0,
        totalDistance: 0,
        totalElevation: 0,
      };
    }

    athleteStats[shortName].activityCount++;

    const durationMinutes = parseDurationToMinutes(activity['moving time pretty']);
    const distanceKm = parseFloat(activity['distance in K']) || 0;
    const elevationGain = parseFloat(activity['total elevation gain']) || 0;

    athleteStats[shortName].totalDuration += durationMinutes;
    athleteStats[shortName].totalDistance += distanceKm;
    athleteStats[shortName].totalElevation += elevationGain;
  });

  const sortedActivities = Object.entries(athleteStats).sort((a, b) => b[1].activityCount - a[1].activityCount);
  const sortedDuration = Object.entries(athleteStats).sort((a, b) => b[1].totalDuration - a[1].totalDuration);
  const sortedDistance = Object.entries(athleteStats).sort((a, b) => b[1].totalDistance - a[1].totalDistance);
  const sortedElevation = Object.entries(athleteStats).sort((a, b) => b[1].totalElevation - a[1].totalElevation);

  renderLeaderboard('Activities', sortedActivities, 'activitiesLB', 'activityCount');
  renderLeaderboard('Duration', sortedDuration, 'durationLB', 'totalDuration');
  renderLeaderboard('Distance', sortedDistance, 'distanceLB', 'totalDistance');
  renderLeaderboard('Elev. Gain', sortedElevation, 'elevationLB', 'totalElevation');
}

function renderLeaderboard(title, data, containerId, statKey) {
  const main = document.querySelector(`#${containerId}`);
  const section = document.createElement('section');
  section.classList.add('section');

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

          return `
            <tr>
              <td>${index + 1}</td>
              <td style="display: flex; align-items: center; gap: 10px; vertical-align: middle; border-width: 0; border-bottom-width: 1px;">
                <img src="${imgSrc}" alt="${fullName}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 30px; height: 30px; border-radius: 50%;">
                ${fullName}
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
}

function parseDurationToMinutes(durationStr) {
  if (!durationStr) return 0;
  const parts = durationStr.split(':');
  if (parts.length === 2) { // mm:ss
    return parseInt(parts[0]);
  } else if (parts.length === 3) { // hh:mm:ss
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
}

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

  let filteredActivities = allActivities.filter(activity => {
    const activityDateStr = activity['formatted start date'] || activity['Date/Time'];
    if (!activityDateStr) return false;

    const parts = activityDateStr.split('/');
    if (parts.length !== 3) return false;

    const dateFormatted = `20${parts[2]}-${parts[1]}-${parts[0]}`; // yyyy-mm-dd
    const dateObj = new Date(dateFormatted);

    if (dateObj < start || dateObj > end) return false;

    if (only30MinCheckbox) {
      const durationMinutes = parseDurationToMinutes(activity['moving time pretty']);
      if (durationMinutes < 30) return false;
    }

    return true;
  });

  if (dailyActivityCheckbox) {
    // Group by athlete
    const athleteDays = {};

    filteredActivities.forEach(activity => {
      const shortName = `${activity['athlete first name'] || ''} ${activity['athlete last name'] || ''}`.trim();
      if (!shortName) return;

      const parts = (activity['formatted start date'] || activity['Date/Time']).split('/');
      const activityDate = `20${parts[2]}-${parts[1]}-${parts[0]}`;

      if (!athleteDays[shortName]) {
        athleteDays[shortName] = new Set();
      }
      athleteDays[shortName].add(activityDate);
    });

    // Keep only athletes who have at least one activity for each day
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
