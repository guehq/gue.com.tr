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
  filterAthletesByStreak,
  renderAthleteMapTable
} from './utils-leaderboard.js';



// ***************************************************
// ***   DEFAULT VALUES for filtering activities   ***
// ***************************************************

const DEFAULT_MIN_DURATION = 30;
const DEFAULT_START_DATE = '2025-08-01';
const DEFAULT_END_DATE = '2025-08-31';

// ***********************
// ***   DEBUG FLAGS   ***
// ***********************

export const DEBUG = {
  csvData: false,               // Logs when CSV is loaded
  validation: false,            // Logs invalid reasons
  standardization: false,       // Logs standardized activity output
  filteringOptions: true,      // Logs current filtering options
  filteringActivities: false,   // Logs filtered activities based on date/duration
  athleteMapping: false,        // Logs athlete activity mapping
  // clubMapping: true,           // Logs club activity mapping
  streakCheck: false,           // Logs daily streak checks
  // leaderboard: true,           // Logs leaderboard data
  summary: true                // Logs summary data
};

// ********************************
// ***   FILTERING ACTIVITIES   ***
// ********************************

// Filter activities by minDuration and date range
function filterValidActivities(activities, options) {
  return activities.filter(activity => {
    const duration = parseFloat(activity.duration || 0);
    const date = activity.date;

    const meetsDuration = duration >= options.minDuration;
    const withinDateRange = date >= options.startDate && date <= options.endDate;

    if (DEBUG.filteringActivities) {
      if (!meetsDuration || !withinDateRange) {
        console.warn(`[FILTER] Excluded activity`, {
          athlete: activity.athlete,
          date,
          duration,
          reason: !meetsDuration ? 'Below minDuration' : 'Outside date range'
        });
      } else {
        console.info(`[FILTER] Passed activity`, {
          athlete: activity.athlete,
          date,
          duration
        });
      }
    }

    return meetsDuration && withinDateRange;
  });
}

// Global state
let allActivities = [];
let athleteMap = new Map();
let filteredAthleteMap = new Map();
let clubMap = new Map();

// Current filter options (can be hooked up to UI)
const filterOptions = {
  get startDate() {
    return document.getElementById('startDateInput')?.value || DEFAULT_START_DATE;
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
    return parseInt(document.getElementById('minDurationInput')?.value || DEFAULT_MIN_DURATION);
  },
  sortKey: 'duration',
  sortOrder: 'desc'
};

function loadData(csvData) {

  // Step 1: Validate raw activities
  const validated = validateRawActivities(csvData);

  // Step 2: Standardize valid activities
  const standardized = standardizeActivities(validated);

  // Step 3: Filter standardized activities
  const valid = filterValidActivities(standardized, filterOptions);

  allActivities = valid;

  // Step 4: Build athlete map
  athleteMap = buildAthleteMap(allActivities);

  // Step 5: Build club map (assuming you have athleteProfiles globally)


  // Step 6: Filter athletes by date range and daily activity streak if needed
  if (filterOptions.requireDailyStreak) {
    filteredAthleteMap = filterAthletesByStreak(athleteMap, filterOptions.startDate, filterOptions.endDate);
  } else {
    filteredAthleteMap = athleteMap;
  }

  // Step 7: Render leaderboards
  renderAthleteMapTable(athleteMap);

  // Log summary counts
  if (DEBUG.summary) {
    console.info('===   Processing Summary   ===');
    console.info('Raw activity count:', csvData.length);
    console.info('Valid activity count:', validated.length);
    console.info('Standardized activity count:', standardized.length);
    console.info('Filtered (pass) activity count:', valid.length);
    console.info('Filtered (excluded) activity count:', standardized.length - valid.length);
    console.info('Athletes count:', valid.reduce((acc, activity) => {
      acc.add(activity.athlete);
      return acc;
    }, new Set()).size);
    // console.info('Qualified Athletes count:', filteredAthleteMap?.size ?? 0); - TODO: this one is not working
  }
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
  // Calculate yesterday's date in YYYY-MM-DD format
  const yesterday = new Date(Date.now() - 86400000);
  const yyyy = yesterday.getFullYear();
  const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
  const dd = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yyyy}-${mm}-${dd}`;

  // Set default filter values
  const startDateInput = document.getElementById('startDateInput');
  const endDateInput = document.getElementById('endDateInput');
  const minDurationInput = document.getElementById('minDurationInput');
  const requireDailyStreakInput = document.getElementById('requireDailyStreakInput');

  if (startDateInput) startDateInput.value = DEFAULT_START_DATE;
  if (endDateInput) endDateInput.value = yesterdayStr;
  if (minDurationInput) minDurationInput.value = DEFAULT_MIN_DURATION;
  if (requireDailyStreakInput) requireDailyStreakInput.checked = true;

  // Check filtering options
  if (DEBUG?.filteringOptions) {
    console.info('Current filter options:', {
      startDate: filterOptions.startDate,
      endDate: filterOptions.endDate,
      minDuration: filterOptions.minDuration,
      requireDailyStreak: filterOptions.requireDailyStreak
    });
  }

  // Run initial filtering with default filter values
  if (DEBUG?.filteringOptions) {
    console.info('Running initial filtering with:', {
      startDate: filterOptions.startDate,
      endDate: filterOptions.endDate,
      minDuration: filterOptions.minDuration,
      requireDailyStreak: filterOptions.requireDailyStreak
    });
  }

  // Load data initially
  loadCSVAndInit();

  // Add event listeners
  startDateInput?.addEventListener('change', () => loadCSVAndInit());
  endDateInput?.addEventListener('change', () => loadCSVAndInit());
  minDurationInput?.addEventListener('change', () => loadCSVAndInit());
  requireDailyStreakInput?.addEventListener('change', () => loadCSVAndInit());

  document.getElementById('maxRankInput')?.addEventListener('change', () => renderLeaderboards());

  // Filter button click handler
  document.getElementById('filterButton')?.addEventListener('click', () => {
    loadCSVAndInit();
  });

  // Reset button click handler
  document.getElementById('resetButton')?.addEventListener('click', () => {
    resetFilters();
    loadCSVAndInit();
  });

  // Render the athlete map table
  renderAthleteMapTable(athleteMap);
});

// Reset filter inputs to defaults
function resetFilters() {
  const yesterday = new Date(Date.now() - 86400000);
  const yyyy = yesterday.getFullYear();
  const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
  const dd = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yyyy}-${mm}-${dd}`;

  const startDateInput = document.getElementById('startDateInput');
  const endDateInput = document.getElementById('endDateInput');
  const minDurationInput = document.getElementById('minDurationInput');
  const requireDailyStreakInput = document.getElementById('requireDailyStreakInput');

  if (startDateInput) startDateInput.value = DEFAULT_START_DATE;
  if (endDateInput) endDateInput.value = yesterdayStr;
  if (minDurationInput) minDurationInput.value = DEFAULT_MIN_DURATION;
  if (requireDailyStreakInput) requireDailyStreakInput.checked = true;
}
