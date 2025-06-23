/**
 * Rate limiter utility for Hana extension
 */

// Configuration
const DEFAULT_LIMIT = 5; // Default requests per minute
const DEFAULT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const BACKOFF_MULTIPLIER = 2; // Exponential backoff multiplier

/**
 * Rate limiter for API requests
 */
export const RateLimiter = {
  // State
  requestTimes: [] as number[],
  isLimited: false,
  currentBackoff: 0,
  lastLimitTime: 0,
  
  /**
   * Checks if the request should be rate limited
   * @param limit - Optional custom request limit
   * @param window - Optional custom time window
   * @returns True if the request should be limited
   */
  check(limit = DEFAULT_LIMIT, window = DEFAULT_WINDOW): boolean {
    const now = Date.now();
    
    // If we're in a backoff period, check if it's expired
    if (this.isLimited) {
      const timeElapsed = now - this.lastLimitTime;
      if (timeElapsed < this.currentBackoff) {
        // Still in backoff period
        return true;
      }
      // Backoff period expired
      this.isLimited = false;
    }
    
    // Clean up old requests
    this.requestTimes = this.requestTimes.filter(time => now - time < window);
    
    // Check if we've exceeded the limit
    if (this.requestTimes.length >= limit) {
      // Set rate limit
      this.isLimited = true;
      this.lastLimitTime = now;
      
      // Calculate exponential backoff
      this.currentBackoff = this.currentBackoff === 0 
        ? DEFAULT_WINDOW 
        : Math.min(this.currentBackoff * BACKOFF_MULTIPLIER, 5 * 60 * 1000); // Max 5 minutes
      
      return true;
    }
    
    // Add current request to the list
    this.requestTimes.push(now);
    return false;
  },
  
  /**
   * Resets the rate limiter
   */
  reset(): void {
    this.requestTimes = [];
    this.isLimited = false;
    this.currentBackoff = 0;
    this.lastLimitTime = 0;
  },
  
  /**
   * Gets the time remaining until the rate limit expires
   * @returns Time in milliseconds until the rate limit expires, or 0 if not limited
   */
  getTimeRemaining(): number {
    if (!this.isLimited) return 0;
    
    const now = Date.now();
    const timeElapsed = now - this.lastLimitTime;
    const remaining = this.currentBackoff - timeElapsed;
    
    return Math.max(0, remaining);
  }
}; 