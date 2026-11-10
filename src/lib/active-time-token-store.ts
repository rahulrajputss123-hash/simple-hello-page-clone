/**
 * Global token store for Active Time Quest
 * 
 * Stores the ping token both in memory (for fast access) and localStorage
 * (for persistence across app restarts). This ensures the token chain is maintained
 * even when the user closes and reopens the app.
 */

const STORAGE_KEY = 'active_time_ping_token';

class ActiveTimeTokenStore {
  private token: string | null = null;
  private questKey: string | null = null;

  constructor() {
    // Restore from localStorage on init
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.token = parsed.token;
          this.questKey = parsed.questKey;
        }
      } catch (err) {
        console.error('[token-store] Failed to restore from localStorage:', err);
      }
    }
  }

  /**
   * Get the current token for a quest
   */
  getToken(questKey: string): string | null {
    if (this.questKey === questKey) {
      return this.token;
    }
    return null;
  }

  /**
   * Set a new token for a quest
   */
  setToken(questKey: string, token: string | null): void {
    this.questKey = questKey;
    this.token = token;

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ questKey, token }));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error('[token-store] Failed to save to localStorage:', err);
      }
    }
  }

  /**
   * Clear the token for a quest
   */
  clearToken(questKey: string): void {
    if (this.questKey === questKey) {
      this.token = null;
      this.questKey = null;
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
          console.error('[token-store] Failed to remove from localStorage:', err);
        }
      }
    }
  }
}

// Singleton instance
export const activeTimeTokenStore = new ActiveTimeTokenStore();
