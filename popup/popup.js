document.addEventListener('DOMContentLoaded', function() {
  console.log("History Plugin loaded...");
  const tbody = document.getElementById('history-data');
  const categoryFilter = document.getElementById('category-filter');
  const dateFilter = document.getElementById('date-filter');
  const prevDayButton = document.getElementById('prev-day');
  const nextDayButton = document.getElementById('next-day');
  let historyChart = null;
  let currentHistoryItems = [];
  let currentCategories = [];

  // Set default date to today
  const today = new Date();
  dateFilter.value = today.toISOString().split('T')[0];
  updateNavigationButtons();
  
  // Add settings link handler
  document.getElementById('openSettings').addEventListener('click', function(e) {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  });

  // Add extended view handler
  document.getElementById('openExtended').addEventListener('click', function(e) {
    e.preventDefault();
    browser.tabs.create({
      url: browser.runtime.getURL('extension-page/index.html')
    });
  });

  // Add close button handler
  document.getElementById('close-popup').addEventListener('click', function() {
    window.close();
  });

  // Add category filter handler
  categoryFilter.addEventListener('change', function() {
    updateDisplayForCategory(currentHistoryItems);
  });

  // Add date filter handler
  dateFilter.addEventListener('change', function() {
    loadHistoryForDate(dateFilter.value);
    updateNavigationButtons();
  });

  // Add date navigation handlers
  prevDayButton.addEventListener('click', function() {
    const currentDate = new Date(dateFilter.value);
    currentDate.setDate(currentDate.getDate() - 1);
    dateFilter.value = currentDate.toISOString().split('T')[0];
    loadHistoryForDate(dateFilter.value);
    updateNavigationButtons();
  });

  nextDayButton.addEventListener('click', function() {
    const currentDate = new Date(dateFilter.value);
    currentDate.setDate(currentDate.getDate() + 1);
    dateFilter.value = currentDate.toISOString().split('T')[0];
    loadHistoryForDate(dateFilter.value);
    updateNavigationButtons();
  });

  function updateNavigationButtons() {
    const currentDate = new Date(dateFilter.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable next day button if current date is today
    nextDayButton.disabled = currentDate.getTime() >= today.getTime();
    
    // Update button styles
    nextDayButton.style.opacity = nextDayButton.disabled ? '0.5' : '1';
    nextDayButton.style.cursor = nextDayButton.disabled ? 'not-allowed' : 'pointer';
  }

  function loadHistoryForDate(dateString) {
    const selectedDate = new Date(dateString);
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    browser.history.search({
      text: '',
      startTime: startOfDay.getTime(),
      endTime: endOfDay.getTime(),
      maxResults: 10000
    }).then(updateTable).catch(onError);
  }

  function matchUrlToCategory(url, categories) {
    for (const category of categories) {
      try {
        const pattern = new RegExp(category.pattern);
        if (pattern.test(url)) {
          return category.title;
        }
      } catch (e) {
        console.error(`Invalid regex pattern for category ${category.title}:`, e);
      }
    }
    return 'Uncategorized';
  }

  function createChart(hours, counts) {
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    if (historyChart) {
      historyChart.destroy();
    }

    const selectedDate = new Date(dateFilter.value);
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const chartTitle = isToday ? 'Today\'s Visits per Hour' : 
      `Visits on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    historyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [{
          label: 'Pages Visited',
          data: counts,
          backgroundColor: 'rgba(114, 99, 252, 0.7)',
          borderColor: '#4285f4',
          borderWidth: 1,
          stepped: true,
          fill: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: chartTitle,
            padding: {
              bottom: 10
            }
          }
        },
        interaction: {
          intersect: false,
          axis: 'x'
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              display: true,
              drawBorder: true,
            },
            ticks: {
              precision: 0,
              maxRotation: 45,
              minRotation: 45
            },
            title: {
              display: true,
              text: 'Hour of Day',
              padding: { top: 10 }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              drawBorder: true,
            },
            ticks: {
              precision: 0
            },
            title: {
              display: true,
              text: 'Number of Visits',
              padding: { bottom: 10 }
            }
          }
        }
      }
    });
  }

  

  function updateDisplayForCategory(historyItems) {
    if (!historyItems || historyItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2">No history data found</td></tr>';
      return;
    }

    // Initialize hourly stats for all 24 hours
    const hourlyStats = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyStats[hour] = 0;
    }
    
    // Get start and end of selected day
    const selectedDate = new Date(dateFilter.value);
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);
    
    // Filter by selected category
    const selectedCategory = categoryFilter.value;
    const filteredItems = historyItems.filter(item => {
      if (selectedCategory === 'all') return true;
      return matchUrlToCategory(item.url, currentCategories) === selectedCategory;
    });
    
    // Fill in the actual visit counts
    filteredItems.forEach(item => {
      if (item && item.lastVisitTime) {
        const visitTime = new Date(item.lastVisitTime);
        if (visitTime >= startOfDay && visitTime < endOfDay) {
          const hour = visitTime.getHours();
          hourlyStats[hour]++;
        }
      }
    });

    // Create arrays for chart data
    const hours = Object.keys(hourlyStats).map(hour => {
      const hourNum = parseInt(hour);
      return `${hourNum.toString().padStart(2, '0')}:00`;
    });
    const counts = Object.values(hourlyStats);

    // Create the chart
    createChart(hours, counts);

    // Update the table
    tbody.innerHTML = '';
    Object.entries(hourlyStats).forEach(([hour, count]) => {
      if (count > 0) { // Only show hours with activity
        const hourFormatted = `${hour.toString().padStart(2, '0')}:00 - ${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${hourFormatted}</td>
          <td>${count}</td>
        `;
        tbody.appendChild(row);
      }
    });
  }

  function updateTable(historyItems) {
    currentHistoryItems = historyItems;
    
    // Load categories and update display
    browser.storage.sync.get('categories').then(result => {
      currentCategories = result.categories || [];
      updateCategoryFilter(currentCategories);
      updateDisplayForCategory(historyItems);
    }).catch(error => {
      console.error('Error loading categories:', error);
      updateDisplayForCategory(historyItems);
    });
  }

  function updateCategoryFilter(categories) {
    // Store current selection
    const currentValue = categoryFilter.value;
    
    // Clear existing options except "All Categories"
    while (categoryFilter.options.length > 1) {
      categoryFilter.remove(1);
    }

    // Add categories to dropdown
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.title;
      option.textContent = category.title;
      categoryFilter.appendChild(option);
    });

    // Add Uncategorized option
    const uncategorizedOption = document.createElement('option');
    uncategorizedOption.value = 'Uncategorized';
    uncategorizedOption.textContent = 'Uncategorized';
    categoryFilter.appendChild(uncategorizedOption);

    // Restore selection if it exists, otherwise default to "all"
    if (Array.from(categoryFilter.options).some(opt => opt.value === currentValue)) {
      categoryFilter.value = currentValue;
    } else {
      categoryFilter.value = 'all';
    }
  }

  function onError(error) {
    console.error('Error:', error);
    tbody.innerHTML = `<tr><td colspan="2">Error: ${error.message || 'Unknown error occurred'}</td></tr>`;
  }

  try {
    // Initial load with today's date
    loadHistoryForDate(dateFilter.value);
  } catch (error) {
    onError(error);
  }
});