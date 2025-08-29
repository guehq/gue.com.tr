const ZAPIER_CSV_PATH = './data/Fithness Month 2025 - AUG.csv';
const STRAVA_ACCESS_TOKEN = 'd3083778e5b56154b17df6e1851ab51196c1cfe1';
const STRAVA_ACCESS_TOKEN_expires_at = '2025-08-29T22:58:21Z';
const loggingSince = '2025-08-01';
const lastUpdated = '2025-08-29';


function extractDateFromFilename(filename) {
  const match = filename.match(/\d{4}-\d{2}-\d{2}T\d{2}_\d{2}_\d{2}/);
  if (!match) return '';

  const parts = match[0].split('T');
  const datePart = parts[0];
  const timePart = parts[1].replace(/_/g, ':');

  return `${datePart} ${timePart}`;
}

const lastZapierUpdated = extractDateFromFilename(ZAPIER_CSV_PATH);
// const lastUpdatedDate = new Date(STRAVA_ACCESS_TOKEN_expires_at);
// const lastUpdated = lastUpdatedDate.toISOString().replace('T', ' ').split('.')[0];

const loggingSinceElement = document.getElementById('loggingSince');
if (loggingSinceElement) {
  loggingSinceElement.textContent = loggingSince;
}

const lastUpdatedElement = document.getElementById('lastUpdated');
if (lastUpdatedElement) {
  lastUpdatedElement.textContent = lastUpdated;
}
