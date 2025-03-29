document.addEventListener('DOMContentLoaded', function() {
  const categoriesList = document.getElementById('categories-list');
  const addCategoryButton = document.getElementById('add-category');
  const sessionTimeoutInput = document.getElementById('session-timeout');
  let saveTimeout;

  // Initialize theme system with automatic detection
  initializeTheme(null);

  const DEFAULT_CATEGORIES = [
    {
      title: 'Social Media',
      pattern: 'facebook\\.com|twitter\\.com|instagram\\.com|linkedin\\.com|tiktok\\.com|reddit\\.com|x\\.com|blsky\\.info|pinterest\\.com|tumblr\\.com|snapchat\\.com|whatsapp\\.com|telegram\\.org|discord\\.com|mastodon\\.social|threads\\.net|vk\\.com|weibo\\.com'
    },
    {
      title: 'Video Streaming',
      pattern: 'youtube\\.com|netflix\\.com|hulu\\.com|disney\\+|prime\\.video|twitch\\.tv|vimeo\\.com|peacocktv\\.com|hbomax\\.com|crunchyroll\\.com|funimation\\.com|paramountplus\\.com|dailymotion\\.com|tiktok\\.com|plex\\.tv|appletv\\.apple\\.com'
    },
    {
      title: 'News',
      pattern: 'news\\.|nytimes\\.com|cnn\\.com|bbc\\.com|reuters\\.com|bloomberg\\.com|washingtonpost\\.com|wsj\\.com|apnews\\.com|theguardian\\.com|economist\\.com|forbes\\.com|time\\.com|aljazeera\\.com|nbcnews\\.com|foxnews\\.com|usatoday\\.com|huffpost\\.com'
    },
    {
      title: 'Shopping',
      pattern: 'amazon\\.com|ebay\\.com|walmart\\.com|etsy\\.com|shopify\\.com|target\\.com|bestbuy\\.com|aliexpress\\.com|wayfair\\.com|homedepot\\.com|costco\\.com|newegg\\.com|nike\\.com|adidas\\.com|macys\\.com|nordstrom\\.com|zalando\\.com|asos\\.com'
    },
    {
      title: 'Research',
      pattern: 'google\\.com|wikipedia\\.org|scholar\\.google\\.com|researchgate\\.net|academia\\.edu|jstor\\.org|arxiv\\.org|sciencedirect\\.com|pubmed\\.ncbi\\.nlm\\.nih\\.gov|springer\\.com|ieee\\.org|semanticscholar\\.org|worldcat\\.org|doi\\.org|mendeley\\.com'
    },
    {
      title: 'Productivity',
      pattern: 'github\\.com|gitlab\\.com|notion\\.so|trello\\.com|asana\\.com|slack\\.com|zoom\\.us|microsoft\\.com|office\\.com|google\\.docs|dropbox\\.com|evernote\\.com|atlassian\\.com|monday\\.com|clickup\\.com|miro\\.com|figma\\.com|canva\\.com|airtable\\.com'
    },
    {
      title: 'Education',
      pattern: 'coursera\\.org|udemy\\.com|edx\\.org|khanacademy\\.org|duolingo\\.com|codecademy\\.com|brilliant\\.org|skillshare\\.com|pluralsight\\.com|udacity\\.com|lynda\\.com|masterclass\\.com|ted\\.com|memrise\\.com|quizlet\\.com'
    },
    {
      title: 'Finance',
      pattern: 'bankofamerica\\.com|chase\\.com|wellsfargo\\.com|paypal\\.com|mint\\.com|robinhood\\.com|coinbase\\.com|fidelity\\.com|vanguard\\.com|schwab\\.com|etrade\\.com|tdameritrade\\.com|ally\\.com|capitalone\\.com|discover\\.com'
    }
  ];

  // Default session timeout in minutes
  const DEFAULT_SESSION_TIMEOUT = 10;

  // Create save status element
  const saveStatus = document.createElement('div');
  saveStatus.className = 'save-status';
  saveStatus.textContent = 'Settings saved';
  document.body.appendChild(saveStatus);

  function showSaveStatus() {
    saveStatus.classList.add('visible');
    setTimeout(() => {
      saveStatus.classList.remove('visible');
    }, 2000);
  }

  function createCategoryElement(category = { title: '', pattern: '' }) {
    const tr = document.createElement('tr');
    tr.className = 'category-item';
    tr.innerHTML = `
      <td>
        <input type="text" class="title-input" value="${category.title}" placeholder="e.g., Social Media">
      </td>
      <td width="60%">
        <input type="text" class="pattern-input" value="${category.pattern}" placeholder="e.g., facebook\\.com|twitter\\.com">
      </td>
      <td>
        <i class="fas fa-trash-can fa-fw delete-category" title="Delete"></i>
      </td>
    `;

    // Add event listeners for input changes
    const inputs = tr.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', debounceSync);
    });

    // Add delete button handler
    const deleteButton = tr.querySelector('.delete-category');
    deleteButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this category?')) {
        tr.remove();
        syncCategories();
      }
    });

    return tr;
  }

  function getCategories() {
    const categories = [];
    const categoryElements = categoriesList.querySelectorAll('.category-item');
    
    categoryElements.forEach(element => {
      const title = element.querySelector('.title-input').value.trim();
      const pattern = element.querySelector('.pattern-input').value.trim();
      
      if (title || pattern) {
        categories.push({ title, pattern });
      }
    });

    return categories;
  }

  function debounceSync() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(syncSettings, 500);
  }

  function syncCategories() {
    const categories = getCategories();
    browser.storage.sync.set({ categories }).then(() => {
      console.log('Categories saved:', categories);
      showSaveStatus();
    }).catch(error => {
      console.error('Error saving categories:', error);
    });
  }

  function syncSessionTimeout() {
    const sessionTimeout = parseInt(sessionTimeoutInput.value, 10);
    if (!isNaN(sessionTimeout) && sessionTimeout > 0) {
      browser.storage.sync.set({ sessionTimeout }).then(() => {
        console.log('Session timeout saved:', sessionTimeout);
        showSaveStatus();
      }).catch(error => {
        console.error('Error saving session timeout:', error);
      });
    }
  }

  function syncSettings() {
    syncCategories();
    syncSessionTimeout();
  }

  // Load saved settings
  browser.storage.sync.get(['categories', 'sessionTimeout']).then(result => {
    // Handle categories
    const categories = result.categories || [];
    if (categories.length === 0) {
      // Add default categories if none exist
      DEFAULT_CATEGORIES.forEach(category => {
        categoriesList.appendChild(createCategoryElement(category));
      });
      // Save default categories
      syncCategories();
    } else {
      categories.forEach(category => {
        categoriesList.appendChild(createCategoryElement(category));
      });
    }

    // Handle session timeout
    const sessionTimeout = result.sessionTimeout || DEFAULT_SESSION_TIMEOUT;
    sessionTimeoutInput.value = sessionTimeout;
  }).catch(error => {
    console.error('Error loading settings:', error);
    // Add default categories if there's an error
    DEFAULT_CATEGORIES.forEach(category => {
      categoriesList.appendChild(createCategoryElement(category));
    });
    // Set default session timeout
    sessionTimeoutInput.value = DEFAULT_SESSION_TIMEOUT;
    // Save default settings
    syncSettings();
  });

  // Add event listeners
  addCategoryButton.addEventListener('click', () => {
    categoriesList.appendChild(createCategoryElement());
  });

  sessionTimeoutInput.addEventListener('input', debounceSync);
});