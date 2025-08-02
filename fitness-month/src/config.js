const ZAPIER_CSV_PATH = './data/gue strava_2025-08-02T13_27_53.csv';
const STRAVA_ACCESS_TOKEN = '4c86a7bf1fd1ce6add10e0c3c8bdca24d7586b80';

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
