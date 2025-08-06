import {
  normalizeActivities,
  parseDurationToMinutes,
  calculateMETScore,
  normalizeDate,
  formatDate,
  getDateRange
} from './utils-data.js';

import {
  filterValidActivities,
  deduplicateActivities
} from './utils-activity.js';

import {
  buildAthleteMap,
  buildClubMap,
  sortLeaderboardData
} from './utils-leaderboard.js';

import {
  renderLeaderboardTable,
  createTooltip,
  formatNumber
} from './utils-render.js';

// Global state
let allActivities = [];
let athleteMap = new Map();
let clubMap = new Map();
let filteredAthleteMap = new Map();

// Current filter options (can be hooked up to UI)
const filterOptions = {
  startDate: '2025-08-01',
  endDate: formatDate(new Date(Date.now() - 86400000)), // yesterday
  minDuration: 30,
  dailyActivityOnly: true,
  sortKey: 'duration', // default sort by duration
  sortOrder: 'desc',
  maxRank: 10
};

function loadData(csvData) {
  // 1. Normalize
  const normalized = normalizeActivities(csvData);

  // 2. Deduplicate
  const unique = deduplicateActivities(normalized);

  // 3. Filter valid
  const valid = filterValidActivities(unique, filterOptions.minDuration);

  allActivities = valid;

  // 4. Build athlete map
  athleteMap = buildAthleteMap(allActivities);

  // 5. Build club map (assuming you have athleteProfiles globally)
  clubMap = buildClubMap(athleteMap, window.athleteProfiles || {});

  // 6. Filter athletes by date range and daily activity streak if needed
  filteredAthleteMap = filterAthletesByDateAndStreak(athleteMap, filterOptions);

  // 7. Render leaderboards
  renderLeaderboards();
}

function filterAthletesByDateAndStreak(athleteMap, options) {
  // Implement date range and daily streak filtering here
  // For now, return the original map
  return athleteMap;
}

function renderLeaderboards() {
  // Convert Map to array for sorting and slicing
  const athletesArr = Array.from(filteredAthleteMap.values());
  const clubsArr = Array.from(clubMap.values());

  // Sort athlete leaderboard
  const sortedAthletes = sortLeaderboardData(athletesArr, filterOptions.sortKey, filterOptions.sortOrder).slice(0, filterOptions.maxRank);

  // Sort club leaderboard
  const sortedClubs = sortLeaderboardData(clubsArr, filterOptions.sortKey, filterOptions.sortOrder).slice(0, filterOptions.maxRank);

  // Define columns for athlete leaderboard
  const athleteColumns = [
    { key: 'athlete', label: 'Athlete' },
    { key: 'duration', label: 'Total Duration (min)' },
    { key: 'distance', label: 'Total Distance (km)' },
    { key: 'count', label: 'Activities' },
    { key: 'elevation', label: 'Elevation Gain (m)' },
    { key: 'met', label: 'MET Score' }
  ];

  // Define columns for club leaderboard
  const clubColumns = [
    { key: 'club', label: 'Club' },
    { key: 'duration', label: 'Total Duration (min)' },
    { key: 'distance', label: 'Total Distance (km)' },
    { key: 'count', label: 'Activities' },
    { key: 'elevation', label: 'Elevation Gain (m)' },
    { key: 'met', label: 'MET Score' }
  ];

  // Render athlete leaderboard
  renderLeaderboardTable(sortedAthletes, athleteColumns, 'athleteLeaderboard', key => {
    toggleSort(key, 'athlete');
  });

  // Render club leaderboard
  renderLeaderboardTable(sortedClubs, clubColumns, 'clubLeaderboard', key => {
    toggleSort(key, 'club');
  });
}

function toggleSort(key, type) {
  if (filterOptions.sortKey === key) {
    filterOptions.sortOrder = filterOptions.sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    filterOptions.sortKey = key;
    filterOptions.sortOrder = 'desc';
  }
  renderLeaderboards();
}

// Load CSV and start the process (example using PapaParse or your CSV loading method)
function loadCSVAndInit() {
  // Your CSV loading logic here, e.g. Papa.parse(...)
  // Then call loadData with parsed data

  // Example:
  // Papa.parse(csvFile, {
  //   download: true,
  //   header: true,
  //   complete: function(results) {
  //     loadData(results.data);
  //   }
  // });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadCSVAndInit();
});
