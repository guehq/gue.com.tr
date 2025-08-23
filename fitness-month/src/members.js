document.addEventListener('DOMContentLoaded', function () {
  const membersListContainer = document.querySelector('#membersDataTable tbody');

  Object.keys(window.athleteProfiles).forEach((athleteKey, index) => {
    const profile = window.athleteProfiles[athleteKey];

    const memberRow = document.createElement('tr');

    const imgSrc = profile.stravaImg || './images/default-avatar.png';
    const stravaLink = profile.stravaId ? `https://www.strava.com/athletes/${profile.stravaId}` : null;

    memberRow.innerHTML = `
      <td class="has-text-right" style="width: 36px;">${index + 1}</td>
      <td class="has-text-centered" style="width: 36px;">
        <img src="${imgSrc}" alt="${profile.fullName}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 40px; border-radius: 50%;">
      </td>
      <td>
        ${stravaLink
          ? `<a href="${stravaLink}" class="has-text-dark" target="_blank">${profile.fullName}</a>` : `<span>${profile.fullName}</span>`
        } 
        ${profile.gueId 
          ? `<a href="https://www.gue.com/diver-training/gue-instructors/instructor-resume?id=${profile.gueId}" target="_blank" class="ml-3"><img src="./images/gue_logo_96x96.png"></a>` : ''
        }
      </td>
      <td style="width: 100px;">${profile.city || ''}</td>
      <td style="width: 100px;">${profile.country || ''}</td>
    `;

    membersListContainer.appendChild(memberRow);
  });

  const memberCountSpan = document.getElementById('memberCount');
  if (memberCountSpan) {
    memberCountSpan.textContent = Object.keys(window.athleteProfiles).length;
  }
});
