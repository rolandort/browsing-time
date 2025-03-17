// Theme handling functionality
function initializeTheme(themeButton) {
  // Theme handling
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (themeButton) {
      themeButton.classList.toggle('light-mode', theme === 'light');
      themeButton.innerHTML = theme === 'dark' ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
    }
    
    // Dispatch event for chart updates
    const themeChangeEvent = new CustomEvent('themeChanged', { detail: { theme } });
    document.dispatchEvent(themeChangeEvent);
  }

  // Initialize theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

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