document.addEventListener('DOMContentLoaded', function () {
  if (!window.communities) {
    console.error('window.communities is not defined');
    return;
  }

  const communitiesListContainer = document.querySelector('#communitiesDataTable tbody');
  if (!communitiesListContainer) {
    console.error('#communitiesDataTable tbody element not found');
    return;
  }

  Object.keys(window.communities).forEach((communityKey, index) => {
    const community = window.communities[communityKey];

    const communityRow = document.createElement('tr');

    const imgSrc = community.logoUrl || './images/default-avatar.png';
    const stravaLink = community.stravaClubUrl || null;

    communityRow.innerHTML = `
      <td class="has-text-right" style="width: 36px;">${index + 1}</td>
      <td class="has-text-centered" style="width: 36px;">
        <img src="${imgSrc}" alt="${community.name}" onerror="this.onerror=null; this.src='./images/default-avatar.png';" style="width: 40px; border-radius: 50%;">
      </td>
      <td>
        ${stravaLink 
          ? `<a href="${stravaLink}" class="has-text-dark" target="_blank">${community.name}</a>`
          : `<span>${community.name}</span>`
        }
      </td>
      <td>
        ${community.contactPerson.name || ''}
        ${community.contactPerson.email ? `<a href="mailto:${community.contactPerson.email}" class="has-text-info">[${community.contactPerson.email}]</a>` : ''}
      </td>
      <td>${community.country || ''}</td>
    `;

    communitiesListContainer.appendChild(communityRow);
  });

  const communityCountSpan = document.getElementById('communityCount');
  if (communityCountSpan) {
    communityCountSpan.textContent = Object.keys(window.communities).length;
  }
});
