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
      const shortName = `${row['athlete first name'] || ''} ${row['athlete last name'] || ''}`.trim();
      const profile = window.athleteProfiles[shortName] || null;
      const fullName = profile ? profile.fullName : shortName;

      const athleteMatch = fullName.toLowerCase().includes(athleteFilter.toLowerCase());

      const activityDateObj = parseActivityDate(row['formatted start date']);

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
      const dateA = parseActivityDate(a['formatted start date']);
      const dateB = parseActivityDate(b['formatted start date']);

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

      tr.innerHTML = `
        <td class="has-text-right">${index + 1}</td>
        <td class="has-text-center">${row['formatted start date'] || ''}</td>
        <td style="display: flex; align-items: center; gap: 10px; vertical-align: middle;">
          <img src="${imgSrc}" alt="${fullName}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 40px; border-radius: 50%;">
        </td>
        <td>${fullName}</td>
        <td>${row['Activity'] || ''}</td>
        <td class="has-text-right">${row['moving time pretty'] || ''}</td>
        <td class="has-text-right">${row['distance in K'] || ''}</td>
        <td class="has-text-right">${row['total elevation gain'] || ''}</td>
      `;
      tbody.appendChild(tr);
    });

  // Update the total activity count
  document.getElementById('zapierTotalActivityCount').textContent = document.querySelectorAll('#dataTable tbody tr').length;
}
