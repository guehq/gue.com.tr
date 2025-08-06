// 3. Filtering Step
// ✔ Likely in main-leaderboard.js (or helper in utils-activity.js)
// ✅ Filtering Rules:
// 	•	duration >= minDuration
// 	•	Date between startDate and endDate
// ⏩ Result: Filtered activities for mapping.

import {
  standardizeActivities
} from './utils-data.js';

import { 
  validateRawActivities 
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



// ***********************
// ***   Debug flags   ***
// ***********************

export const DEBUG = {
  csvData: false,               // Logs when CSV is loaded
  validation: false,            // Logs invalid reasons
  standardization: true,       // Logs standardized activity output
  filtering: false,             // Logs filtered activities based on date/duration
  athleteMapping: false,        // Logs athlete activity mapping
  clubMapping: false,           // Logs club activity mapping
  streakCheck: false,           // Logs daily streak checks
  leaderboard: false            // Logs leaderboard data
};

// Global state
let allActivities = [];
let athleteMap = new Map();
let clubMap = new Map();
let filteredAthleteMap = new Map();

// Current filter options (can be hooked up to UI)
const filterOptions = {
  get startDate() {
    return document.getElementById('startDateInput')?.value || '2025-08-01';
  },
  get endDate() {
    return document.getElementById('endDateInput')?.value || formatDate(new Date(Date.now() - 86400000));
  },
  get requireDailyStreak() {
    return document.getElementById('requireDailyStreakInput')?.checked ?? true;
  },
  get maxRank() {
    return parseInt(document.getElementById('maxRankInput')?.value || 10);
  },
  get minDuration() {
    return parseInt(document.getElementById('minDurationInput')?.value || 30);
  },
  sortKey: 'duration',
  sortOrder: 'desc'
};

function loadData(csvData) {

  // Step 1: Validate raw activities
  const validated = validateRawActivities(csvData);

  // Step 2: Standardize activities
  const standardized = standardizeActivities(validated);

  // Step 3: Filter valid
  const valid = filterValidActivities(standardized, filterOptions.minDuration);

  allActivities = valid;

  // Step 4: Build athlete map
  athleteMap = buildAthleteMap(allActivities);

  // Step 5: Build club map (assuming you have athleteProfiles globally)
  clubMap = buildClubMap(athleteMap, window.athleteProfiles || {});

  // Step 6: Filter athletes by date range and daily activity streak if needed
  filteredAthleteMap = filterAthletesByDateAndStreak(athleteMap, filterOptions);

  // Step 7: Render leaderboards
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
  Papa.parse('./data/Fithness Month 2025 - AUG.csv', {
    download: true,
    header: true,
    complete: function(results) {
      if (DEBUG.csvData) console.info('CSV data loaded and processed:', results.data);
      loadData(results.data);
    },
    error: function(err) {
      console.error('CSV parse error:', err);
    }
  });
}

// **********************
// ***   INITIALIZE   ***
// **********************

document.addEventListener('DOMContentLoaded', () => {
  loadCSVAndInit();
  document.getElementById('minDurationInput')?.addEventListener('change', () => {
    loadCSVAndInit();
  });
  document.getElementById('maxRankInput')?.addEventListener('change', () => {
    renderLeaderboards();
  });
  // Add checkbox listener for daily streak option
  document.getElementById('requireDailyStreakInput')?.addEventListener('change', () => {
    filterOptions.requireDailyStreak = document.getElementById('requireDailyStreakInput').checked;
    loadCSVAndInit();
  });
});
