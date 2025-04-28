document.addEventListener('DOMContentLoaded', function () {
  const membersListContainer = document.querySelector('#membersDataTable tbody');

  Object.keys(window.athleteProfiles).forEach((athleteKey, index) => {
    const profile = window.athleteProfiles[athleteKey];

    const memberRow = document.createElement('tr');

    const imgSrc = profile.stravaImg || './images/default-avatar.png';
    const stravaLink = profile.stravaId ? `https://www.strava.com/athletes/${profile.stravaId}` : null;

    memberRow.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <img src="${imgSrc}" alt="${profile.fullName}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 40px; border-radius: 50%;">
      </td>
      <td>
        ${stravaLink 
          ? `<a href="${stravaLink}" class="has-text-dark" target="_blank">${profile.fullName}</a>`
          : `<span>${profile.fullName}</span>`
        }
      </td>
      <td>${profile.city || 'N/A'}</td>
      <td>${profile.country || 'N/A'}</td>
    `;

    membersListContainer.appendChild(memberRow);
  });

  const memberCountSpan = document.getElementById('memberCount');
  if (memberCountSpan) {
    memberCountSpan.textContent = Object.keys(window.athleteProfiles).length;
  }
});
