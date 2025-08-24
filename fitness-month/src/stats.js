import {
  standardizeActivities
} from './utils-data.js';

import { 
  validateRawActivities 
} from './utils-valid-activities.js';



document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const startDateInput = document.getElementById('startDateInput');
  const endDateInput = document.getElementById('endDateInput');
  const minDurationInput = document.getElementById('minDurationInput');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  // Default values
  startDateInput.value = '2025-08-01';
  endDateInput.value = new Date().toISOString().split('T')[0];
  minDurationInput.value = 0;

  // Load data and build stats
  function loadStats() {
    const rawActivities = window.rawActivities || [];
    const validActivities = validateRawActivities(rawActivities);
    const standardizedActivities = standardizeActivities(validActivities);

    // Apply filters
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const minDuration = parseFloat(minDurationInput.value) || 0;

    const filteredActivities = standardizedActivities.filter(act => {
      const actDate = new Date(act.date);
      return actDate >= startDate && actDate <= endDate && act.duration >= minDuration;
    });

    renderStats(filteredActivities);
  }

  // Filter function
  function filterActivities(activities) {
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const minDuration = parseFloat(minDurationInput.value) || 0;

    return activities.filter(act => {
      const actDate = new Date(act.date);
      return actDate >= startDate && actDate <= endDate && act.duration >= minDuration;
    });
  }

  // Render stats to HTML
  function renderStats(valid_stat_activities) {
    if (valid_stat_activities.length === 0) {
      console.warn('No activities found for selected filters.');
      return;
    }

    let totalDistance = 0;
    let totalDuration = 0;
    let totalElevation = 0;

    valid_stat_activities.forEach(act => {
      totalDistance += parseFloat(act.distance) || 0;
      totalDuration += parseFloat(act.duration) || 0;
      totalElevation += parseFloat(act.elevation) || 0;
    });

    // Update Stats in page
    document.getElementById('totalDistance').innerText = `${totalDistance.toFixed(0)} KM`;
    document.getElementById('totalDuration').innerText = `${(totalDuration / 1440).toFixed(0)} Days`;
    document.getElementById('totalElevation').innerText = `${(totalElevation / 1000).toFixed(1)} KM`;
    document.getElementById('totalActivities').innerText = `${valid_stat_activities.length} 🔥`;
  }

  // Event Listeners
  resetFiltersBtn.addEventListener('click', () => {
    startDateInput.value = '2025-08-01';
    endDateInput.value = new Date().toISOString().split('T')[0];
    minDurationInput.value = 0;
    loadStats();
  });

  // Initial load
  loadStats();
});
