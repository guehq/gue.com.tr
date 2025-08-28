let allData = [];

document.addEventListener('DOMContentLoaded', function () {


  fetch(ZAPIER_CSV_PATH)
    .then(response => response.text())
    .then(text => {
      allData = parseCSV(text);

      if (document.querySelector('#dataTable tbody')) {
        populateTable(allData);

        const searchInput = document.getElementById('athleteSearch');
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        const sortInput = document.getElementById('sortOrder');
        const clearButton = document.getElementById('clearFilters');

        searchInput.addEventListener('input', applyFilters);
        startInput.addEventListener('input', applyFilters);
        endInput.addEventListener('input', applyFilters);
        sortInput.addEventListener('change', applyFilters);
        clearButton.addEventListener('click', function () {
          searchInput.value = '';
          startInput.value = '';
          endInput.value = '';
          sortInput.value = 'desc'; // Reset sort to Newest
          populateTable(allData);
        });

        function applyFilters() {
          populateTable(
            allData,
            searchInput.value,
            startInput.value,
            endInput.value,
            sortInput.value
          );
        }

        searchInput.addEventListener('input', applyFilters);
        startInput.addEventListener('input', applyFilters);
        endInput.addEventListener('input', applyFilters);
      }

      updateStats();

    })
    .catch(error => console.error('Error loading CSV file:', error));
});

function parseCSV(text) {
  const parsed = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    quoteChar: '"'
  });
  return parsed.data;
}

function parseActivityDate(dateStr) {
  if (!dateStr) return null;
  
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    let year = parseInt(parts[2], 10);

    year = year < 100 ? 2000 + year : year; // make "25" become 2025

    return new Date(year, month, day);
  }
  
  // fallback if unexpected format
  return new Date(dateStr);
}

function populateTable(data, athleteFilter = '', startDate = '', endDate = '', sortOrder = 'desc') {
  const tbody = document.querySelector('#dataTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data
    .filter(row => {
      // Exclude rows where "is Activity Valid" is explicitly "false"
      if (row['is Activity Valid'] && row['is Activity Valid'].toLowerCase() === 'false') {
        return false;
      }
      const shortName = `${row['athlete first name'] || ''} ${row['athlete last name'] || ''}`.trim();
      const profile = window.athleteProfiles[shortName] || null;
      const fullName = profile ? profile.fullName : shortName;

      const athleteMatch = fullName.toLowerCase().includes(athleteFilter.toLowerCase());

      const activityDateStr = row['Real Date on Strava'] || row['Estimated Activity Start DateTime'];
      const activityDateObj = activityDateStr ? new Date(activityDateStr) : null;

      let startDateObj = startDate ? new Date(startDate) : null;
      let endDateObj = endDate ? new Date(endDate) : null;

      // Adjust start date to midnight, and end date to 23:59:59
      if (startDateObj) {
        startDateObj.setHours(0, 0, 0, 0);
      }
      if (endDateObj) {
        endDateObj.setHours(23, 59, 59, 999);
      }

      let dateMatch = true;

      if (startDateObj && endDateObj) {
        dateMatch = activityDateObj >= startDateObj && activityDateObj <= endDateObj;
      } else if (startDateObj) {
        dateMatch = activityDateObj >= startDateObj;
      } else if (endDateObj) {
        dateMatch = activityDateObj <= endDateObj;
      }

      return athleteMatch && dateMatch;
    })
    .sort((a, b) => {
      const dateAStr = a['Real Date on Strava'] || a['Estimated Activity Start DateTime'];
      const dateBStr = b['Real Date on Strava'] || b['Estimated Activity Start DateTime'];
      const dateA = dateAStr ? new Date(dateAStr) : null;
      const dateB = dateBStr ? new Date(dateBStr) : null;

      if (!dateA || isNaN(dateA.getTime())) return 1;
      if (!dateB || isNaN(dateB.getTime())) return -1;

      if (sortOrder === 'asc') {
        return dateA - dateB; // Oldest first
      } else {
        return dateB - dateA; // Newest first
      }
    })
    .forEach((row, index) => {
      const tr = document.createElement('tr');
      const shortName = `${row['athlete first name'] || ''} ${row['athlete last name'] || ''}`.trim();
      const profile = window.athleteProfiles[shortName] || null;

      const displayName = shortName;
      const fullName = profile ? profile.fullName : shortName;
      const imgSrc = profile ? (profile.stravaImg || './images/default-avatar.png') : './images/default-avatar.png';
      const city = profile ? profile.city : '';
      const country = profile ? profile.country : '';

      // Extract Activity Strava ID and create activity link icon if available
      const activityStravaId = row['Activity Strava ID'];

      let activityName = row['Activity'] || '';
      if (row['is Activity Valid'] && row['is Activity Valid'].toLowerCase() === 'suspicious') {
        activityName += ` <div class="has-text-danger is-inline" title="${row['Notes'] || 'Suspicious Activity'}"><i class="fas fa-flag mx-2"></i><small class="is-size-7">suspicious</small></div>`;
      }

      const activityDateStr = row['Real Date on Strava'] || row['Estimated Activity Start DateTime'];

      tr.innerHTML = `
        <th class="has-text-right">${index + 1}</th>
        <td class="has-text-center">${activityDateStr ? new Date(activityDateStr).toLocaleDateString() : ''}</td>
        <td>
          <figure class="image is-24x24 mr-2">
            <img src="${imgSrc}" alt="${fullName}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 64px; border-radius: 50%; margin: 0 auto;">
          </figure>
        </td>
        <td>${fullName}</td>
        <td>${
          activityStravaId
            ? `<a href="https://www.strava.com/activities/${activityStravaId}" target="_blank" rel="noopener noreferrer" class="has-text-info" title="View on Strava"><i class="fab fa-strava mr-1" style="color: #fc4c02;"></i> ${activityName}</a>`
            : `${activityName}`
        }</td>
        <td class="has-text-right">${formatMinutesToHHMMSS(row['Duration'])}</td>
        <td class="has-text-right">${row['distance in K'] || ''}</td>
        <td class="has-text-right">${row['total elevation gain'] || ''}</td>
      `;
      tbody.appendChild(tr);
    });

  // Update the total activity count if element exists
  const totalCountElem = document.getElementById('zapierTotalActivityCount');
  if (totalCountElem) {
    totalCountElem.textContent = document.querySelectorAll('#dataTable tbody tr').length;
  }
}

function formatMinutesToHHMMSS(minutes) {
  const totalSeconds = Math.round(parseFloat(minutes || 0) * 60);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateStats() {
  if (!allData || allData.length === 0) return;

  // Check if any of the stats container elements exist
  const longestDurationElem = document.getElementById('longestActivityDuration');
  const longestDistanceElem = document.getElementById('longestActivityDistance');
  const highestElevationElem = document.getElementById('highestElevationActivity');
  const mostActivitiesDayElem = document.getElementById('mostActivitiesDay');

  // New elements for totals
  const totalDurationElem = document.getElementById('totalDuration');
  const totalDistanceElem = document.getElementById('totalDistance');
  const totalElevationElem = document.getElementById('totalElevation');
  const totalActivitiesElem = document.getElementById('totalActivities');

  if (!longestDurationElem && !longestDistanceElem && !highestElevationElem && !mostActivitiesDayElem && !totalDurationElem && !totalDistanceElem && !totalElevationElem && !totalActivitiesElem) {
    return; // No stats elements to update
  }

  // Filter out invalid activities (skip if "is Activity Valid" is "false")
  const validActivities = allData.filter(row => !(row['is Activity Valid'] && row['is Activity Valid'].toLowerCase() === 'false'));

  // Calculate totals
  let totalDuration = 0;
  let totalDistance = 0;
  let totalElevation = 0;
  let totalActivities = validActivities.length;

  validActivities.forEach(row => {
    const dur = parseFloat(row['Duration']);
    if (!isNaN(dur)) {
      totalDuration += dur;
    }
    const dist = parseFloat(row['distance in K']);
    if (!isNaN(dist)) {
      totalDistance += dist;
    }
    const elev = parseFloat(row['total elevation gain']);
    if (!isNaN(elev)) {
      totalElevation += elev;
    }
  });

  // Display totals
  if (totalDurationElem) {
    const totalDurationInDays = Math.ceil(totalDuration / 60 / 24);
    totalDurationElem.textContent = `${totalDurationInDays} Days!`;
  }
  if (totalDistanceElem) {
    totalDistanceElem.textContent = `${totalDistance.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} KM`;
  }
  if (totalElevationElem) {
    totalElevationElem.textContent = `${Math.ceil(totalElevation.toFixed(0) / 1000)} KM`;
  }
  if (totalActivitiesElem) {
    totalActivitiesElem.textContent = `${totalActivities.toString()} 🔥`;
  }

  // Longest activity by duration (in minutes)
  if (longestDurationElem) {
    let maxDuration = -Infinity;
    let maxDurationActivity = null;
    validActivities.forEach(row => {
      const dur = parseFloat(row['Duration']);
      if (!isNaN(dur) && dur > maxDuration) {
        maxDuration = dur;
        maxDurationActivity = row;
      }
    });
    if (maxDurationActivity) {
      const shortName = `${maxDurationActivity['athlete first name'] || ''} ${maxDurationActivity['athlete last name'] || ''}`.trim();
      const profile = window.athleteProfiles[shortName] || null;
      const name = profile ? profile.fullName : shortName;
      const activity = maxDurationActivity['Activity'] || '';
      const athleteImg = (profile && profile.stravaImg) || './images/default-avatar.png';
      longestDurationElem.innerHTML = `
        <p>${activity}</p> 
        <div class="my-2">
          <img src="${athleteImg}" alt="${name}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 24px; border-radius: 50%; vertical-align: middle;">
          <em class="is-size-6 ml-1">${name}</em>
        </div>
        <div class="is-size-4 has-text-weight-bold">${formatMinutesToHHMMSS(maxDuration)}</div>
      `;
    } else {
      longestDurationElem.textContent = 'No data';
    }
  }

  // Longest activity by distance (in K)
  if (longestDistanceElem) {
    let maxDistance = -Infinity;
    let maxDistanceActivity = null;
    validActivities.forEach(row => {
      const dist = parseFloat(row['distance in K']);
      if (!isNaN(dist) && dist > maxDistance) {
        maxDistance = dist;
        maxDistanceActivity = row;
      }
    });
    if (maxDistanceActivity) {
      const shortName = `${maxDistanceActivity['athlete first name'] || ''} ${maxDistanceActivity['athlete last name'] || ''}`.trim();
      const profile = window.athleteProfiles[shortName] || null;
      const name = profile ? profile.fullName : shortName;
      const activity = maxDistanceActivity['Activity'] || '';
      const athleteImg = (profile && profile.stravaImg) || './images/default-avatar.png';
      longestDistanceElem.innerHTML = `
        <p>${activity}</p> 
        <div class="my-2">
          <img src="${athleteImg}" alt="${name}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 24px; border-radius: 50%; vertical-align: middle;">
          <em class="is-size-6 ml-1">${name}</em>
        </div>
        <div class="is-size-4 has-text-weight-bold">${maxDistance.toFixed(2)} KM</div>
      `;
    } else {
      longestDistanceElem.textContent = 'No data';
    }
  }

  // Highest elevation activity
  if (highestElevationElem) {
    let maxElevation = -Infinity;
    let maxElevationActivity = null;
    validActivities.forEach(row => {
      const elev = parseFloat(row['total elevation gain']);
      if (!isNaN(elev) && elev > maxElevation) {
        maxElevation = elev;
        maxElevationActivity = row;
      }
    });
    if (maxElevationActivity) {
      const shortName = `${maxElevationActivity['athlete first name'] || ''} ${maxElevationActivity['athlete last name'] || ''}`.trim();
      const profile = window.athleteProfiles[shortName] || null;
      const name = profile ? profile.fullName : shortName;
      const activity = maxElevationActivity['Activity'] || '';
      const athleteImg = (profile && profile.stravaImg) || './images/default-avatar.png';
      highestElevationElem.innerHTML = `
        <p>${activity}</p> 
        <div class="my-2">
          <img src="${athleteImg}" alt="${name}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 24px; border-radius: 50%; vertical-align: middle;">
          <em class="is-size-6 ml-1">${name}</em>
        </div>
        <div class="is-size-4 has-text-weight-bold">${maxElevation.toFixed(0)} m</div>
      `;
    } else {
      highestElevationElem.textContent = 'No data';
    }
  }

  // Max activities in a single day per athlete
  if (mostActivitiesDayElem) {
    // Count activities per athlete per day (using Real Date on Strava or Estimated Activity Start DateTime)
    const athleteDayCounts = {};
    const athleteDayActivities = {};
    validActivities.forEach(row => {
      const dateStr = row['Real Date on Strava'] || row['Estimated Activity Start DateTime'];
      if (!dateStr) return;
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return;
      // Use yyyy-mm-dd format as key
      const dayKey = dateObj.toISOString().slice(0, 10);
      const shortName = row['Athlete'] || 'Unknown';
      const profile = window.athleteProfiles[shortName] || null;
      const fullName = profile ? profile.fullName : shortName;
      const key = `${fullName}_${dayKey}`;

      athleteDayCounts[key] = (athleteDayCounts[key] || 0) + 1;
      // Save first activity for that athlete on that day (for display)
      if (!athleteDayActivities[key]) {
        athleteDayActivities[key] = {
          activity: row['Activity'] || '',
          profile: profile,
          fullName: fullName,
          dayKey: dayKey
        };
      }
    });

    let maxCount = 0;
    let maxKey = null;
    for (const key in athleteDayCounts) {
      if (athleteDayCounts[key] > maxCount) {
        maxCount = athleteDayCounts[key];
        maxKey = key;
      }
    }

    if (maxKey) {
      const data = athleteDayActivities[maxKey];
      const dateObj = new Date(data.dayKey);
      const options = { day: 'numeric', month: 'short' };
      const year = dateObj.getFullYear().toString().slice(0);
      const displayDate = `${dateObj.toLocaleDateString('en-US', options)}`;
      const athleteImg = (data.profile && data.profile.stravaImg) || './images/default-avatar.png';
      mostActivitiesDayElem.innerHTML = `
        <div class="mb-2">
          <img src="${athleteImg}" alt="${data.fullName}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 24px; border-radius: 50%; vertical-align: middle;">
          <em class="is-size-6 ml-1">${data.fullName}</em>
        </div>
        <div class="has-text-weight-bold">
          <div class="is-size-4 my-4">${maxCount} activities</div>
          <span class="has-text-weight-normal">on</span> ${displayDate} ${year}</div>
      `;
    } else {
      mostActivitiesDayElem.textContent = 'No data';
    }
  }
}
