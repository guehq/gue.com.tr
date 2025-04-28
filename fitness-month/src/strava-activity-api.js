async function loadActivities() {
  const accessToken = 'e7a7c92144c1d198b745b89fb1517fedcfcec615'; // Replace with your token!
  const perPage = 100;
  let page = 1;
  let activities = [];
  let keepFetching = true;

  while (keepFetching) {
    const response = await fetch(`https://www.strava.com/api/v3/clubs/960343/activities?per_page=${perPage}&page=${page}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error("Failed to fetch activities:", response.statusText);
      break;
    }

    const data = await response.json();
    
    if (data.length === 0) {
      keepFetching = false;
    } else {
      activities = activities.concat(data);
      page++;
    }
  }

  function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const tableBody = document.getElementById('apiDataTable').querySelector('tbody');

  activities.forEach((activity, index) => {
    const elapsedClass = activity.moving_time !== activity.elapsed_time ? 'has-text-danger' : '';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="has-text-right">${index + 1}</td>
      <td>${activity.athlete.firstname} ${activity.athlete.lastname}</td>
      <td>${activity.name}</td>
      <td>${activity.sport_type}</td>
      <td class="has-text-right">${(activity.distance / 1000).toFixed(1)} km</td>
      <td class="has-text-right">${(activity.total_elevation_gain).toFixed(0)} m</td>
      <td class="has-text-right">${formatDuration(activity.moving_time)}</td>
      <!-- <td class="${elapsedClass}">${formatDuration(activity.elapsed_time)}</td> -->
      <!-- <td>${activity.type}</td> -->
      <!-- <td>${activity.workout_type}</td> -->
    `;
    tableBody.appendChild(row);
  });

  document.getElementById('activityCount').innerText = activities.length;

  // Add raw activity data table (debug view)
  const rawTable = document.getElementById('rawDataTable').querySelector('tbody');
  activities.forEach((activity, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><pre style="white-space: pre-wrap; word-break: break-word;">${JSON.stringify(activity, null, 2)}</pre></td>
    `;
    rawTable.appendChild(row);
  });
}

loadActivities();