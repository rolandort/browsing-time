document.addEventListener('DOMContentLoaded', function() {
  console.log('Extension page loaded');
  const categoryFilter = document.getElementById('category-filter');
  const dateFilter = document.getElementById('date-filter');
  const prevDayButton = document.getElementById('prev-day');
  const nextDayButton = document.getElementById('next-day');
  const todayButton = document.getElementById('today');
  const themeButton = document.getElementById('theme-switch');
  let currentHistoryItems = [];
  let currentCategories = [];
  let dailyChart = null;
  let categoryChart = null;
  let hourlyChart = null;
  let domainChart = null;

  // Add error handling function
  function onError(error) {
    console.error('Error:', error);
    // Clear any existing charts
    if (dailyChart) dailyChart.destroy();
    if (categoryChart) categoryChart.destroy();
    if (hourlyChart) hourlyChart.destroy();
    if (domainChart) domainChart.destroy();
    
    // Show default state for charts
    createDailyChart([], [], 'all');
    createCategoryChart([''], [0]);
    createHourlyChart([], []);
    createDomainChart([], []);
  }

  // Set default date to today and initialize date navigation
  const today = new Date();
  dateFilter.value = today.toISOString().split('T')[0];
  updateNavigationButtons();
  loadHistoryForDate(dateFilter.value); // initialize the chart with the current date and category
  loadHistorForLast30Days();

  // Initialize theme 
  initializeTheme(themeButton);
  
  // Load categories initially
  browser.storage.sync.get('categories').then(result => {
    currentCategories = result.categories || [];
    updateCategoryFilter(currentCategories);
  }).catch(error => {
    console.error('Error loading categories:', error);
  });
  
  // Listen for theme changes to update charts
  document.addEventListener('themeChanged', () => {
    if (currentHistoryItems.length > 0) {
      loadHistorForLast30Days();
      updateCategoryChart(currentHistoryItems);
      updateHourlyChart(currentHistoryItems);
      updateDomainChart(currentHistoryItems);
    }
  });

  // Helper function to get theme colors
  function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      
      text: style.getPropertyValue('--text-color').trim(),
      grid: style.getPropertyValue('--chart-grid').trim(),
      background: style.getPropertyValue('--background-color').trim(),
      chartBar: 'rgba(66, 133, 244, 0.7)',
      chartBorder: 'rgba(66, 133, 244, 1)'
    };
  }


  // Add filter handlers
  categoryFilter.addEventListener('change', function() {
    const selectedDate = new Date(dateFilter.value);
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);
    loadHistoryForDate(dateFilter.value);
    loadHistorForLast30Days();
    updateNavigationButtons();
  });

  dateFilter.addEventListener('change', function() {
      (dateFilter.value);
    loadHistoryForDate(dateFilter.value);
    loadHistorForLast30Days();
    updateNavigationButtons();
  });

  todayButton.addEventListener('click', function() {
    const currentDate = new Date();
    // currentDate.setDate(currentDate.getDate());
    dateFilter.value = currentDate.toISOString().split('T')[0];
    loadHistoryForDate(dateFilter.value);
    loadHistorForLast30Days();
    updateNavigationButtons();
  });

  prevDayButton.addEventListener('click', function() {
    const currentDate = new Date(dateFilter.value);
    currentDate.setDate(currentDate.getDate() - 1);
    dateFilter.value = currentDate.toISOString().split('T')[0];
    loadHistoryForDate(dateFilter.value);
    loadHistorForLast30Days();
    updateNavigationButtons();
  });

  nextDayButton.addEventListener('click', function() {
    const currentDate = new Date(dateFilter.value);
    currentDate.setDate(currentDate.getDate() + 1);
    dateFilter.value = currentDate.toISOString().split('T')[0];
    loadHistoryForDate(dateFilter.value);
    loadHistorForLast30Days();
    updateNavigationButtons();
  });

  function updateNavigationButtons() {
    const currentDate = new Date(dateFilter.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable next day button if current date is today
    nextDayButton.disabled = currentDate.getTime() >= today.getTime();
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

  // Update all charts for a given date
  function loadHistoryForDate(dateString) {
    const selectedDate = new Date(dateString);
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    browser.history.search({
      text: '',
      startTime: startOfDay.getTime(),
      endTime: endOfDay.getTime(),
      maxResults: 10000 // max history items e.g. 10000
    }).then(historyItems => {
      currentHistoryItems = historyItems; // Store the current history items
      updateCategoryChart(historyItems);
      updateHourlyChart(historyItems);
      updateDomainChart(historyItems);
    }).catch(onError);
  }


  // Update all charts for a given date
  function loadHistorForLast30Days() {
    const startOfDay = new Date();
    const endOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() - 30);
    endOfDay.setDate(startOfDay.getDate() + 1);

    browser.history.search({
      text: '',
      startTime: startOfDay.getTime(),
      endTime: endOfDay.getTime(),
      maxResults: 10000 // max history items e.g. 10000
    }).then(historyItems => {
      updateDailyChart(historyItems);
    }).catch(onError);
  }

  // CATEGORY CHART (stacked bar chart)
  function updateCategoryChart(historyItems) {
    if (!historyItems || historyItems.length === 0 || !currentCategories || currentCategories.length === 0) {
      createCategoryChart(['No Data'], [0]);
      return;
    }

    const categoryStats = {
      'Uncategorized': 0
    };

    currentCategories.forEach(category => {
      categoryStats[category.title] = 0;
    });

    historyItems.forEach(item => {
      const category = matchUrlToCategory(item.url, currentCategories);
      categoryStats[category]++;
    });

    // Sort categories but exclude Uncategorized
    const sortedCategories = Object.entries(categoryStats)
      .filter(([category]) => category !== 'Uncategorized')
      .sort(([,a], [,b]) => b - a);

    // Add Uncategorized at the end if it has any entries
    if (categoryStats['Uncategorized'] > 0) {
      sortedCategories.push(['Uncategorized', categoryStats['Uncategorized']]);
    }

    const categories = sortedCategories.map(([category]) => category);
    const counts = sortedCategories.map(([,count]) => count);

    // Create colors array with gray for Uncategorized
    const colors = categories.map((category, index) => {
      if (category === 'Uncategorized') {
        return 'hsla(0, 0%, 75%, 0.7)'; // gray color for Uncategorized
      }
      const hue = (index * 137.508) % 360;
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    });

    const borderColors = colors.map(color => {
      if (color === 'hsla(0, 0%, 75%, 0.7)') {
        return 'hsla(0, 0%, 75%, 1)'; // solid gray for Uncategorized border
      }
      return color.replace('0.7', '1');
    });

    createCategoryChart(categories, counts, colors, borderColors);
  }

  function createCategoryChart(categories, counts, colors = null, borderColors = null) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const themeColors = getThemeColors();
    
    if (categoryChart) {
      categoryChart.destroy();
    }

    // Generate colors if not provided
    if (!colors) {
      colors = categories.map((category, index) => {
        if (category === 'Uncategorized') {
          return 'hsla(0, 0.00%, 50%, 0.70)'; // gray color for Uncategorized
        }
        const hue = (index * 137.508) % 360;
        return `hsla(${hue}, 70%, 60%, 0.7)`;
      });
    }

    // Generate border colors if not provided
    if (!borderColors) {
      borderColors = colors.map(color => {
        if (color === 'hsla(0, 0%, 50%, 0.7)') {
          return 'hsla(0, 0%, 50%, 1)'; // solid gray for Uncategorized border
        }
        return color.replace('0.7', '1');
      });
    }

    categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Page Visits'],
        datasets: categories.map((category, index) => ({
          label: category,
          data: [counts[index]],
          backgroundColor: colors[index],
          borderColor: borderColors[index],
          borderWidth: 1,
          borderRadius: 3,
          borderSkipped: 'middle'
        }))
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Categories',
            align: 'start',
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 12,
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
              font: {
                size: 12
              },
              generateLabels: function(chart) {
                const datasets = chart.data.datasets;
                return datasets.map((dataset, i) => {
                  const value = dataset.data[0];
                  const total = datasets.reduce((acc, ds) => acc + ds.data[0], 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return {
                    text: `${dataset.label} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor,
                    strokeStyle: dataset.borderColor,
                    fontColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color'), // color does not work for doughnut chart
                    lineWidth: 1,
                    hidden: false,
                    index: i
                  };
                });
              }
            }
          }
        },
        scales: {
          x: {
            border: {
              display: false
            },
            stacked: true,
            grid: {
              display: false,
              offset: false
            },
            ticks: {
              display: false,
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
  
            },
            title: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            }
          },
          y: {
            border: {
              display: false
            },
            stacked: true,
            grid: {
              display: false
            },
            ticks: {
              display: false,
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            }
          }
        }
      }
    });
  }

  // HOURLY CHART
  function updateHourlyChart(historyItems) {
    if (!historyItems || historyItems.length === 0) {
      createHourlyChart([], []);
      return;
    }

    // Initialize 10-minute interval stats (144 intervals in a day)
    const intervalStats = {};
    for (let interval = 0; interval < 144; interval++) {
      intervalStats[interval] = 0;
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
          // Calculate which 10-minute interval this falls into
          const minutes = visitTime.getHours() * 60 + visitTime.getMinutes();
          const interval = Math.floor(minutes / 10);
          intervalStats[interval]++;
        }
      }
    });

    // Calculate actual active time of the current day
    const visits = filteredItems.map(item => item.lastVisitTime);
    const sortedVisits = visits.sort((a, b) => a - b);
    let totalActiveTime = 0;
    let prevVisitTime = null;
    let breaks = 0;
    for (const visitTime of sortedVisits) {
      if (prevVisitTime && visitTime - prevVisitTime > 10 * 60 * 1000) {
        breaks++;
      } else {
        totalActiveTime += visitTime - (prevVisitTime || visitTime);
      }
      prevVisitTime = visitTime;
    }
    const activeTime = document.getElementById('activeTime');
    const activeTimeHours = Math.floor(totalActiveTime / 1000 / 60 / 60);
    const activeTimeMinutes = Math.floor(totalActiveTime / 1000 / 60) % 60;
    activeTime.textContent = `${activeTimeHours}h ${activeTimeMinutes}min`;
    

    // Calculate start and end times
    const firstVisitOfTheDay = filteredItems.length > 0 ? new Date(Math.min(...filteredItems.map(item => item.lastVisitTime))) : null;
    const lastVisitOfTheDay = filteredItems.length > 0 ? new Date(Math.max(...filteredItems.map(item => item.lastVisitTime))) : null;

    const startTime = document.getElementById('startTime');
    startTime.textContent = firstVisitOfTheDay ? firstVisitOfTheDay.toLocaleTimeString() : 'N/A'
    
    const endTime = document.getElementById('endTime');
    endTime.textContent = lastVisitOfTheDay ? lastVisitOfTheDay.toLocaleTimeString() : 'N/A'

    if (firstVisitOfTheDay && lastVisitOfTheDay) {
      const totalTime = document.getElementById('totalTime');
      const duration = moment.duration(moment(lastVisitOfTheDay).diff(moment(firstVisitOfTheDay)));
      totalTime.textContent = `${duration.hours()}h ${duration.minutes()}min`;

      const breakTime = document.getElementById('breakTime');
      const breakDuration = moment.duration(duration - totalActiveTime);
      breakTime.textContent = `${breakDuration.hours()}h ${breakDuration.minutes()}min (${breaks} breaks)`;
  }
      
    // Create arrays for chart data
    const intervals = Object.keys(intervalStats).map(interval => {
      const intervalNum = parseInt(interval);
      const hours = Math.floor((intervalNum * 10) / 60);
      const minutes = (intervalNum * 10) % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });
    const counts = Object.values(intervalStats);

    // Create the chart
    createHourlyChart(intervals, counts, selectedCategory);
  }


  function createHourlyChart(intervals, counts, chartTitle) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    const themeColors = getThemeColors();
    
    if (hourlyChart) {
      hourlyChart.destroy();
    }

    // Create data points with proper time values
    const dataPoints = intervals.map((time, index) => ({
      x: moment(time, 'HH:mm').toDate(),
      y: counts[index]
    }));

    hourlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        datasets: [{
          label: 'Pages',
          data: dataPoints,
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-bar'),
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-border'),
          borderWidth: 1,
          borderRadius: 3
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
            text: 'Hourly Activity (' + chartTitle + ')',
            align: 'start',
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
            padding: { bottom: 20 },
            font: {
              size: 14,
              weight: 'bold'
            }

          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              parser: 'HH:mm',
              tooltipFormat: 'HH:mm',
              unit: 'hour',
              format: "HH:mm",
              displayFormats: {
                  hour: 'HH'
              }
            },
            grid: {
              offset: true,
              display: false,
            },
            ticks: {
              source: 'auto',
              autoSkip: false,
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
              font: {
                size: 11
              },
              align: 'start'
            },
            min: moment('00:00', 'HH:mm').toDate(),
            max: moment('23:59', 'HH:mm').toDate(),
            title: {
              display: true,
              text: 'Time of Day',
              color: themeColors.text,
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid')
            },
            ticks: {
              precision: 0,
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
              font: {
                size: 12
              }
            },
            title: {
              display: true,
              text: 'Pages',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
              padding: { bottom: 10 }
            }
          }
        }
      }
    });
  }

  // DOMAIN CHART
  function updateDomainChart(historyItems) {
    const domainStats = {};
    
    historyItems.forEach(item => {
      const domain = getDomainFromUrl(item.url);
      domainStats[domain] = (domainStats[domain] || 0) + 1;
    });

    const sortedDomains = Object.entries(domainStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 25);

    const domains = sortedDomains.map(([domain]) => domain);
    const counts = sortedDomains.map(([,count]) => count);

    createDomainChart(domains, counts);
  }

  function createDomainChart(domains, counts) {
    const ctx = document.getElementById('domainChart').getContext('2d');
    const themeColors = getThemeColors();
    
    if (domainChart) {
      domainChart.destroy();
    }
    const colors = counts.map((_, index) => {
      const hue = (index * 137.508) % 360;
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    });

    domainChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: domains,
        datasets: [{
          data: counts,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              boxWidth: 12,
              font: {
                size: 12
              },
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const value = data.datasets[0].data[i];
                    const total = data.datasets[0].data.reduce((acc, val) => acc + val, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return {
                      text: `${label.length > 20 ? label.substr(0, 20) + '...' : label}\t(${value} views / ${percentage} %)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: data.datasets[0].borderColor[i],
                      lineWidth: 1,
                      fontColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color'), // color does not work for doughnut chart
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          title: {
            display: true,
            text: 'Top Domains',
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
            align: 'start',
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              bottom: 20
            }
          }
        },
        cutout: '60%'
      }
    });

    // Chart.overrides.doughnut.plugins.legend.options.color = 'red'; // themeColors.text;  

  }

  // Add settings link handler
  document.getElementById('openSettings').addEventListener('click', function(e) {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  });


  function getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname;
      return hostname.replace(/^www\./,'');
    } catch (e) {
      console.error('Invalid URL:', url);
      return url;
    }
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

  // DAILY CHART (of last 30 days)
  function updateDailyChart(historyItems) {

    if (!historyItems || historyItems.length === 0) {
      return;
    }

    const selectedCategory = categoryFilter.value;
    const filteredItems = selectedCategory === 'all' ? 
      historyItems : 
      historyItems.filter(item => matchUrlToCategory(item.url, currentCategories) === selectedCategory);

    // Group history items by date for the last 30 days
    const dailyStats = {};
    
    // Create entries for all days in the range
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 29); // 30 days including today

    for (let d = new Date(startTime); d <= endTime; d.setDate(d.getDate() + 1)) {
      dailyStats[moment(d).format('MMM D')] = 0;
    }
    
    // Fill in the actual visit counts
    filteredItems.forEach(item => {
      if (item && item.lastVisitTime) {
        const date = moment(item.lastVisitTime).format('MMM D');
        dailyStats[date] = (dailyStats[date] || 0) + 1;
      }
    });

    // Sort dates in ascending order for the chart
    const sortedDates = Object.keys(dailyStats).sort((a, b) => {
      return moment(a, 'MMM D').valueOf() - moment(b, 'MMM D').valueOf();
    });

    // Create arrays for chart data
    const dates = sortedDates;
    const counts = sortedDates.map(date => dailyStats[date]);

    // Create the dailyChart
    createDailyChart(dates, counts, selectedCategory);
  }

  function createDailyChart(dates, counts, selectedCategory = 'all') {
    const ctx = document.getElementById('dailyChart').getContext('2d');
    const themeColors = getThemeColors();
    
    if (dailyChart) {
      dailyChart.destroy();
    }

    const chartTitle = selectedCategory === 'all' ? 
      'Daily Activity (Last 30 Days)' : 
      `Daily Activity - ${selectedCategory} (Last 30 Days)`;

    // Create data points with proper date values and highlight selected date
    const selectedDate = moment(dateFilter.value).format('MMM DD');
    const dataPoints = dates.map((date, index) => ({
      x: moment(date, 'MMM DD').toDate(),
      y: counts[index],
      backgroundColor: date === selectedDate ? 
        themeColors.chartBar.replace('0.7', '1') : // Full opacity for selected date
        themeColors.chartBar,
      borderColor: date === selectedDate ?
        themeColors.chartBorder.replace('1', '1.5') : // Thicker border for selected date
        themeColors.chartBorder
    }));

    dailyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        datasets: [{
          label: 'Pages',
          data: dataPoints,
          backgroundColor: dataPoints.map(point => point.backgroundColor),
          borderColor: dataPoints.map(point => point.borderColor),
          borderWidth: 1,
          borderRadius: 3
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
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
            align: 'start',
            padding: { bottom: 20 },
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'DD.'
              },
              tooltipFormat: 'YYYY-MM-DD'
            },
            grid: {
              display: false,
              color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid')
            },
            ticks: {
              source: 'auto',
              autoSkip: false,
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
              font: {
                size: 11
              }
            },
            title: {
              display: true,
              text: 'Date',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid')
            },
            ticks: {
              precision: 0,
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
              font: {
                size: 12
              }
            },
            title: {
              display: true,
              text: 'Pages',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
              padding: { bottom: 10 }
            }
          }
        }
      }
    });
  }

}); 