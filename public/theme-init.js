// Theme initialization script - runs before first render to prevent FOUC
(function() {
  try {
    // Dark mode
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    // Accent color
    var accent = localStorage.getItem('accentColor');
    if (accent && accent !== 'blue') {
      document.documentElement.setAttribute('data-accent', accent);
    }
  } catch (e) {
    // Ignore localStorage errors in incognito mode
  }
})();
