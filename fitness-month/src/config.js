const ZAPIER_CSV_PATH = './data/gue strava_2025-04-28T23_53_25.csv';
const STRAVA_ACCESS_TOKEN = '409f705f3c79d17154ed8e471dc091b9221bda56';

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
