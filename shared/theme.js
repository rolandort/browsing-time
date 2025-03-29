// Theme handling functionality
function initializeTheme(themeButton) {
  // Theme handling
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (themeButton) {
      themeButton.classList.toggle('light-mode', theme === 'light');
      themeButton.innerHTML = theme === 'dark' ? 
        '<i class="fas fa-moon"></i>' : 
        '<i class="fas fa-sun"></i>';
    }
    
    // Dispatch event for chart updates
    const themeChangeEvent = new CustomEvent('themeChanged', { detail: { theme } });
    document.dispatchEvent(themeChangeEvent);
  }

  // Check for system preference
  function getPreferredTheme() {
    // Check if user has already set a preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Otherwise, use system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light mode
    return 'light';
  }

  // Initialize theme based on preference
  const preferredTheme = getPreferredTheme();
  setTheme(preferredTheme);

  // Listen for system theme changes
  if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Modern browsers
    if (colorSchemeQuery.addEventListener) {
      colorSchemeQuery.addEventListener('change', (e) => {
        // Only change theme if user hasn't manually set a preference
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      });
    } 
    // Older browsers
    else if (colorSchemeQuery.addListener) {
      colorSchemeQuery.addListener((e) => {
        // Only change theme if user hasn't manually set a preference
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  // Theme switch handler
  if (themeButton) {
    themeButton.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });
  }

  return { setTheme };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeTheme };
}