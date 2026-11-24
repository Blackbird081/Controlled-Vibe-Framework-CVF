// Blocking inline script for the root layout <head>. It runs before first paint so the
// `dark` class on <html> is correct before React hydrates.
// It must stay consistent with ThemeProvider in src/lib/theme.tsx: same storage key
// ('cvf_theme'), same accepted values ('light' | 'dark'), same default ('dark').
// Any storage read error (blocked storage, private mode) falls back to the default.
export const THEME_STORAGE_KEY = 'cvf_theme';
export const THEME_DEFAULT = 'dark';

export const THEME_INIT_SCRIPT = `(function () {
  var theme = '${THEME_DEFAULT}';
  try {
    var saved = window.localStorage.getItem('${THEME_STORAGE_KEY}');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch (e) {}
  if (theme === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
})();`;
