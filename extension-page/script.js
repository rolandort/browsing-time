document.addEventListener('DOMContentLoaded', function() {
  console.log('Extension page loaded');
  const tbody = document.getElementById('history-data');
  const categoryBody = document.getElementById('category-data');
  const domainBody = document.getElementById('domain-data');
  const categoryFilter = document.getElementById('category-filter');
  let historyChart = null;
  let categoryChart = null;
  let domainChart = null;
  let currentHistoryItems = [];
  let currentCategories = [];

  // Add category filter handler
  categoryFilter.addEventListener('change', function() {
    updateDisplayForCategory(currentHistoryItems);
  });

  function createChart(dates, counts, selectedCategory = 'all') {
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    if (historyChart) {
      historyChart.destroy();
    }

    const chartTitle = selectedCategory === 'all' ? 
      'Daily Activity' : 
      `Daily Activity - ${selectedCategory}`;

    historyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [{
          label: 'Pages Visited',
          data: counts,
          backgroundColor: 'rgba(66, 133, 244, 0.7)',
          borderColor: '#4285f4',
          borderWidth: 1
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
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              drawBorder: true,
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: {
                size: 12
              }
            },
            title: {
              display: true,
              text: 'Date',
              font: {
                size: 14,
                weight: 'bold'
              },
              padding: { top: 20 }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              drawBorder: true,
            },
            ticks: {
              precision: 0,
              font: {
                size: 12
              }
            },
            title: {
              display: true,
              text: 'Number of Pages Visited',
              font: {
                size: 14,
                weight: 'bold'
              },
              padding: { bottom: 10 }
            }
          }
        }
      }
    });
  }

  function createCategoryChart(categories, counts) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
      categoryChart.destroy();
    }

    const colors = counts.map((_, index) => {
      const hue = (index * 137.508) % 360;
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    });

    categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Pages Visited',
          data: counts,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Category Distribution',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              drawBorder: true,
            },
            ticks: {
              precision: 0,
              font: {
                size: 12
              }
            },
            title: {
              display: true,
              text: 'Number of Pages Visited',
              font: {
                size: 14,
                weight: 'bold'
              },
              padding: { top: 20 }
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12
              },
              callback: function(value) {
                const label = this.getLabelForValue(value);
                return label.length > 25 ? label.substr(0, 22) + '...' : label;
              }
            },
            title: {
              display: true,
              text: 'Category',
              font: {
                size: 14,
                weight: 'bold'
              },
              padding: { bottom: 10 }
            }
          }
        }
      }
    });
  }

  function createDomainChart(domains, counts) {
    const ctx = document.getElementById('domainChart').getContext('2d');
    
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
                      text: `${label.length > 15 ? label.substr(0, 12) + '...' : label} (${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: data.datasets[0].borderColor[i],
                      lineWidth: 1,
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
            text: 'Top 10 Domains',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          }
        },
        cutout: '60%'
      }
    });
  }

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

  function updateDomainStats(historyItems) {
    const domainStats = {};
    
    historyItems.forEach(item => {
      const domain = getDomainFromUrl(item.url);
      domainStats[domain] = (domainStats[domain] || 0) + 1;
    });

    const sortedDomains = Object.entries(domainStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const domains = sortedDomains.map(([domain]) => domain);
    const counts = sortedDomains.map(([,count]) => count);

    createDomainChart(domains, counts);

    domainBody.innerHTML = '';
    sortedDomains.forEach(([domain, count]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${domain}</td>
        <td>${count}</td>
      `;
      domainBody.appendChild(row);
    });
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

  function updateDisplayForCategory(historyItems) {
    if (!historyItems || historyItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2">No history data found</td></tr>';
      return;
    }

    const selectedCategory = categoryFilter.value;
    const filteredItems = selectedCategory === 'all' ? 
      historyItems : 
      historyItems.filter(item => matchUrlToCategory(item.url, currentCategories) === selectedCategory);

    // Update domain stats for filtered items
    updateDomainStats(filteredItems);

    // Group history items by date
    const dailyStats = {};
    
    // Create entries for all days in the range
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 14);

    for (let d = new Date(startTime); d <= endTime; d.setDate(d.getDate() + 1)) {
      dailyStats[d.toLocaleDateString()] = 0;
    }
    
    // Fill in the actual visit counts
    filteredItems.forEach(item => {
      if (item && item.lastVisitTime) {
        const date = new Date(item.lastVisitTime).toLocaleDateString();
        dailyStats[date] = (dailyStats[date] || 0) + 1;
      }
    });

    // Sort dates in ascending order for the chart
    const sortedDates = Object.keys(dailyStats).sort((a, b) => {
      return new Date(a) - new Date(b);
    });

    // Create arrays for chart data
    const dates = sortedDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const counts = sortedDates.map(date => dailyStats[date]);

    // Create the chart
    createChart(dates, counts, selectedCategory);

    // Sort dates in descending order for the table
    const reversedDates = [...sortedDates].reverse();

    // Update the table
    tbody.innerHTML = '';
    reversedDates.forEach(date => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${date}</td>
        <td>${dailyStats[date]}</td>
      `;
      tbody.appendChild(row);
    });
  }

  function updateCategoryStats(historyItems, categories) {
    const categoryStats = {
      'Uncategorized': 0
    };

    categories.forEach(category => {
      categoryStats[category.title] = 0;
    });

    historyItems.forEach(item => {
      const category = matchUrlToCategory(item.url, categories);
      categoryStats[category]++;
    });

    const sortedCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a);

    const chartCategories = sortedCategories
      .filter(([category]) => category !== 'Uncategorized')
      .map(([category]) => category);
    
    const chartCounts = sortedCategories
      .filter(([category]) => category !== 'Uncategorized')
      .map(([,count]) => count);

    if (chartCategories.length > 0) {
      createCategoryChart(chartCategories, chartCounts);
    } else {
      createCategoryChart(['No categories defined'], [0]);
    }

    categoryBody.innerHTML = '';
    sortedCategories.forEach(([category, count]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${category}</td>
        <td>${count}</td>
      `;
      categoryBody.appendChild(row);
    });
  }

  function updateTable(historyItems) {
    currentHistoryItems = historyItems;
    
    // Load categories and update display
    browser.storage.sync.get('categories').then(result => {
      currentCategories = result.categories || [];
      updateCategoryFilter(currentCategories);
      updateDisplayForCategory(historyItems);
      updateCategoryStats(historyItems, currentCategories);
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
    categoryBody.innerHTML = `<tr><td colspan="2">Error: ${error.message || 'Unknown error occurred'}</td></tr>`;
    domainBody.innerHTML = `<tr><td colspan="2">Error: ${error.message || 'Unknown error occurred'}</td></tr>`;
  }

  try {
    // Calculate the date range (14 days ago until now)
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 30);

    // Query the browser history
    browser.history.search({
      text: '',
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
      maxResults: 10000
    }).then(updateTable).catch(onError);

  } catch (error) {
    onError(error);
  }
}); 