const ZAPIER_CSV_PATH = './data/Fithness Month 2025 - AUG.csv';
const STRAVA_ACCESS_TOKEN = '1ba164b97623d8fd34bb70dee3340ae4b6e845dbNEV';
const STRAVA_ACCESS_TOKEN_expires_at = '2025-08-05T09:59:38Z';

function extractDateFromFilename(filename) {
  const match = filename.match(/\d{4}-\d{2}-\d{2}T\d{2}_\d{2}_\d{2}/);
  if (!match) return '';

  const parts = match[0].split('T');
  const datePart = parts[0];
  const timePart = parts[1].replace(/_/g, ':');

  return `${datePart} ${timePart}`;
}

const lastUpdated = extractDateFromFilename(ZAPIER_CSV_PATH);
const lastUpdatedElement = document.getElementById('lastUpdated');
if (lastUpdatedElement) {
  lastUpdatedElement.textContent = lastUpdated + ' UTC';
}
