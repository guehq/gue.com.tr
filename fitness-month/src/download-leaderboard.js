// Generalized leaderboard download buttons
const leaderboardButtons = [
  { btnId: 'downloadDurationLBBtn', sectionId: 'durationLB', fileName: 'Duration_leaderboard.jpg' },
  { btnId: 'downloadDistanceLBBtn', sectionId: 'distanceLB', fileName: 'Distance_leaderboard.jpg' },
  { btnId: 'downloadElevationLBBtn', sectionId: 'elevationLB', fileName: 'Elevation_leaderboard.jpg' },
  { btnId: 'downloadActivitiesLBBtn', sectionId: 'activitiesLB', fileName: 'Activities_leaderboard.jpg' },
  { btnId: 'downloadMetScoreLBBtn', sectionId: 'metScoreLB', fileName: 'MET_Score_leaderboard.jpg' },
  { btnId: 'downloadCommunityLBBtn', sectionId: 'communitiesLB', fileName: 'Communities_leaderboard.jpg' },
];

leaderboardButtons.forEach(({ btnId, sectionId, fileName }) => {
  const button = document.getElementById(btnId);
  const section = document.getElementById(sectionId);
  button?.addEventListener('click', () => {
    if (!section) return console.warn(`Section ${sectionId} not found.`);
    downloadLeaderboardAsJPG(sectionId, fileName);
  });
});

/**
 * Download a leaderboard table as a JPG image
 * @param {string} containerId - The DOM element id containing the leaderboard/table
 * @param {string} filename - Optional. Filename for download (default: 'leaderboard.jpg')
 */
function downloadLeaderboardAsJPG(containerId, filename = 'leaderboard.jpg') {
  const node = document.getElementById(containerId);
  if (!node) {
    console.warn(`Container #${containerId} not found for download`);
    return;
  }

  // Clone node to apply scaling without affecting DOM
  const clone = node.cloneNode(true);
  clone.style.transform = 'scale(1)';
  clone.style.transformOrigin = 'top left';
  // clone.style.width = `${node.offsetWidth}px`;
  clone.style.width = '2000px';
  // clone.style.height = `${node.offsetHeight}px`;
  clone.style.height = '2000px';
  clone.style.fontSize = '4rem';
  clone.style.imageRendering = 'crisp-edges';
  document.body.appendChild(clone);
  
  // SCALE TITLES
  clone.querySelectorAll('h3').forEach(h3 => {
    h3.style.fontSize = '6rem';
    h3.style.margin = '3rem';
  });

  // SCALE IMAGES
  clone.querySelectorAll('img').forEach(img => {
    img.style.transform = `scale(4)`;
    img.style.transformOrigin = 'center left';
  });

  // SCALE TEXT
  clone.querySelectorAll('p').forEach(p => {
    p.style.marginLeft = '6rem';
  });

  domtoimage.toJpeg(clone, {
    quality: 1,
    pixelRatio: 3,
    bgcolor: '#ffffff',
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
