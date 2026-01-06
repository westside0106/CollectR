// Theme initialization script - runs before first render to prevent FOUC
(function() {
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    // Ignore localStorage errors in incognito mode
  }
})();
