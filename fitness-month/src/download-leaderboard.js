// Generalized leaderboard download buttons
const leaderboardButtons = [
  { btnId: 'downloadDurationLBBtn', sectionId: 'durationLB', fileName: '01_Duration_leaderboard' },
  { btnId: 'downloadDistanceLBBtn', sectionId: 'distanceLB', fileName: '02_Distance_leaderboard' },
  { btnId: 'downloadElevationLBBtn', sectionId: 'elevationLB', fileName: '03_Elevation_leaderboard' },
  { btnId: 'downloadActivitiesLBBtn', sectionId: 'activitiesLB', fileName: '04_Activities_leaderboard' },
  { btnId: 'downloadMetScoreLBBtn', sectionId: 'metScoreLB', fileName: '05_MET_Score_leaderboard' },
  { btnId: 'downloadCommunityLBBtn', sectionId: 'communitiesLB', fileName: '06_Communities_leaderboard' },
];

leaderboardButtons.forEach(({ btnId, sectionId }) => {
  const button = document.getElementById(btnId);
  const section = document.getElementById(sectionId);
  button?.addEventListener('click', () => {
    if (!section) return console.warn(`Section ${sectionId} not found.`);
    downloadLeaderboardAsJPG(sectionId);
  });
});

/**
 * Download a leaderboard table as a JPG image
 * @param {string} containerId - The DOM element id containing the leaderboard/table
 */
function downloadLeaderboardAsJPG(containerId) {
  const filenameMap = {
    durationLB: '01_Duration_Leaderboard',
    distanceLB: '02_Distance_Leaderboard',
    elevationLB: '03_Elevation_Leaderboard',
    activitiesLB: '04_Activities_Leaderboard',
    metScoreLB: '05_MET_Score_Leaderboard',
    communitiesLB: '06_Communities_Leaderboard',
  };

  const node = document.getElementById(containerId);
  if (!node) {
    console.warn(`Container #${containerId} not found for download`);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const baseName = filenameMap[containerId] || 'leaderboard';
  const filename = `${baseName}_${today}.jpg`;

  // Clone node to apply scaling without affecting DOM
  const clone = node.cloneNode(true);
  clone.style.transform = 'scale(1)';
  clone.style.transformOrigin = 'top left';
  clone.style.paddingLeft = '6rem';
  clone.style.paddingRight = '6rem';
  clone.style.width = '2000px';
  clone.style.height = '2000px';
  clone.style.fontSize = '4rem';
  clone.style.imageRendering = 'crisp-edges';
  document.body.appendChild(clone);

  // TABLE STYLE
  clone.querySelectorAll('table').forEach(table => {
    table.style.marginTop = '4rem';
  });
  clone.querySelectorAll('td').forEach(table => {
    table.style.minWidth = '400px';
  });

  // AVATAR IMAGES
  clone.querySelectorAll('img').forEach(img => {
    img.style.transform = `scale(4)`;
    img.style.transformOrigin = 'center left';
    // img.style.display = 'none';
  });

  // SCALE TITLES
  clone.querySelectorAll('h3').forEach(h3 => {
    h3.style.fontSize = '6rem';
    h3.style.margin = '3rem 1rem 6rem';
  });

  // SCALE TABLE TEXT
  clone.querySelectorAll('p').forEach(p => {
    p.style.marginLeft = '6rem';
  });

  // Add GUE logo at the bottom center
  // const logo = document.createElement('img');
  // logo.src = './images/Logo-gue-long-black.png';
  // logo.style.display = 'block';
  // logo.style.margin = '3rem auto 0';
  // logo.style.width = '500px';
  // logo.style.height = 'auto';
  // logo.style.opacity = '0.2';
  // logo.style.imageRendering = 'crisp-edges';
  // clone.appendChild(logo);

  // TABLE FOOTER STYLE
  clone.querySelectorAll('tfoot').forEach(tfoot => {
    tfoot.style.display = 'table-footer-group';
  });

  domtoimage.toJpeg(clone, {
    quality: 1,
    pixelRatio: 3,
    // bgcolor: '#ffffff',
    filter: (el) => !(el.classList && el.classList.contains('no-export'))
  })
    .then((dataUrl) => {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      document.body.removeChild(clone);
    })
    .catch((error) => {
      console.error('Error exporting leaderboard as JPG:', error);
      document.body.removeChild(clone);
    });
}
