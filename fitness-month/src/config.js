const ZAPIER_CSV_PATH = './data/Fithness Month 2025 - AUG.csv';
const STRAVA_ACCESS_TOKEN = 'e872fbb278aaaa2d58292169a3d4b5515fe94a4d';
const STRAVA_ACCESS_TOKEN_expires_at = '2025-08-18T15:12:18Z';

function extractDateFromFilename(filename) {
  const match = filename.match(/\d{4}-\d{2}-\d{2}T\d{2}_\d{2}_\d{2}/);
  if (!match) return '';

  const parts = match[0].split('T');
  const datePart = parts[0];
  const timePart = parts[1].replace(/_/g, ':');

  return `${datePart} ${timePart}`;
}

const lastUpdated = extractDateFromFilename(ZAPIER_CSV_PATH);
// const lastUpdatedDate = new Date(STRAVA_ACCESS_TOKEN_expires_at);
// const lastUpdated = lastUpdatedDate.toISOString().replace('T', ' ').split('.')[0];
const lastUpdatedElement = document.getElementById('lastUpdated');
if (lastUpdatedElement) {
  lastUpdatedElement.textContent = lastUpdated + ' UTC';
}
