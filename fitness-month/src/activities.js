let allData = [];

document.addEventListener('DOMContentLoaded', function () {


  fetch(ZAPIER_CSV_PATH)
    .then(response => response.text())
    .then(text => {
      allData = parseCSV(text);
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

  // Update the total activity count
  document.getElementById('zapierTotalActivityCount').textContent = document.querySelectorAll('#dataTable tbody tr').length;
}

function formatMinutesToHHMMSS(minutes) {
  const totalSeconds = Math.round(parseFloat(minutes || 0) * 60);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
