async function loadMembers() {
  const accessToken = 'e7a7c92144c1d198b745b89fb1517fedcfcec615'; // Replace with your token!
  const perPage = 100;
  let page = 1;
  let members = [];
  let keepFetching = true;

  while (keepFetching) {
    const response = await fetch(`https://www.strava.com/api/v3/clubs/960343/members?per_page=${perPage}&page=${page}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error("Failed to fetch members:", response.statusText);
      document.getElementById('apiColumn').style.display = 'none'; // Hide the table
      return; // Stop further execution
    }

    const data = await response.json();
    
    if (data.length === 0) {
      keepFetching = false;
    } else {
      members = members.concat(data);
      page++;
    }
  }

  // Sorting members by first name (A to Z)
  members.sort((a, b) => {
    const fullNameA = `${a.firstname} ${a.lastname}`;
    const fullNameB = `${b.firstname} ${b.lastname}`;
    return fullNameA.localeCompare(fullNameB);
  });

  const tableBody = document.getElementById('apiDataTable').querySelector('tbody');

  members.forEach((member, index) => {

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="has-text-right">${index + 1}</td>
      <td>${member.firstname} ${member.lastname}</td>
      <!-- <td>${member.membership}</td> -->
      <!-- <td>${member.admin}</td> -->
      <!-- <td>${member.owner}</td> -->
    `;
    tableBody.appendChild(row);
  });

  document.getElementById('memberCountAPI').innerText = members.length;

  // Add raw member data table (debug view)
  const rawTable = document.getElementById('rawDataTable').querySelector('tbody');
  members.forEach((member, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><pre style="white-space: pre-wrap; word-break: break-word;">${JSON.stringify(member, null, 2)}</pre></td>
    `;
    rawTable.appendChild(row);
  });
}

loadMembers();