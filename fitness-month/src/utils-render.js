// utils-render.js

/**
 * Creates a sortable HTML table for leaderboard data.
 * @param {Array} data - Array of athlete or club objects with totals.
 * @param {Array} columns - Array of column definitions: { key, label }.
 * @param {string} containerId - DOM element id to render the table into.
 * @param {Function} onSort - Callback when a column header is clicked.
 */
export function renderLeaderboardTable(data, columns, containerId, onSort) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  // Create table
  const table = document.createElement('table');
  table.classList.add('table', 'is-striped', 'is-hoverable', 'is-fullwidth');

  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  columns.forEach(({ key, label }) => {
    const th = document.createElement('th');
    th.textContent = label;
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => onSort(key));
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');
  data.forEach(item => {
    const row = document.createElement('tr');
    columns.forEach(({ key }) => {
      const td = document.createElement('td');
      // Display totals if present, else fallback to item[key]
      td.textContent = item.totals?.[key] !== undefined ? formatNumber(item.totals[key]) : item[key] || '';
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  container.appendChild(table);
}

/**
 * Helper: Format numbers with fixed decimals (2 decimal places)
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return '';
  return num.toFixed(2);
}

/**
 * Creates a tooltip on hover for an element
 * @param {HTMLElement} element - The element to attach tooltip to
 * @param {string} contentHTML - The HTML content to show inside the tooltip
 */
export function createTooltip(element, contentHTML) {
  let tooltipDiv;

  element.addEventListener('mouseenter', () => {
    tooltipDiv = document.createElement('div');
    tooltipDiv.classList.add('tooltip');
    tooltipDiv.style.position = 'absolute';
    tooltipDiv.style.background = '#333';
    tooltipDiv.style.color = '#fff';
    tooltipDiv.style.padding = '5px 10px';
    tooltipDiv.style.borderRadius = '4px';
    tooltipDiv.style.zIndex = '1000';
    tooltipDiv.style.whiteSpace = 'nowrap';
    tooltipDiv.innerHTML = contentHTML;

    document.body.appendChild(tooltipDiv);

    const rect = element.getBoundingClientRect();
    tooltipDiv.style.top = `${rect.bottom + window.scrollY + 5}px`;
    tooltipDiv.style.left = `${rect.left + window.scrollX}px`;
  });

  element.addEventListener('mouseleave', () => {
    if (tooltipDiv) {
      tooltipDiv.remove();
      tooltipDiv = null;
    }
  });
}
