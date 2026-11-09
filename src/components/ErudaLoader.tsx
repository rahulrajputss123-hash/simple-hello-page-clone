import { useEffect } from 'react';

/**
 * Load eruda mobile debug console when ?debug=1 is in URL
 * Persists across navigation via sessionStorage
 */
export function ErudaLoader() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shouldDebug = 
      window.location.search.includes('debug=1') || 
      sessionStorage.getItem('eruda_enabled') === 'true';

    if (!shouldDebug) return;

    // Store preference
    sessionStorage.setItem('eruda_enabled', 'true');

    // Check if already loaded
    if ((window as any).eruda) {
      console.log('[eruda] Already loaded');
      return;
    }

    console.log('[eruda] Loading mobile debug console...');

    // Load eruda from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.4.1/eruda.js';
    script.onload = () => {
      if ((window as any).eruda) {
        (window as any).eruda.init();
        console.log('[eruda] ✅ Mobile debug console loaded! Tap icon to open.');
      }
    };
    script.onerror = () => {
      console.error('[eruda] ❌ Failed to load');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed (though eruda persists across navigations)
    };
  }, []);

  return null;
}
