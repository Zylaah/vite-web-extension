/**
 * Scraper Controller for Hana extension
 * Based on SolBrowse's ScraperController pattern
 */
import { getPageContent } from '../utils/contentExtractor';
import { portManager } from './portManager';
import { ContentInitMsg, ContentDeltaMsg } from '../types/messaging';
import { ContentCacheManager } from '../services/contentCacheManager';

function isSignificant(mutation: MutationRecord): boolean {
  if (mutation.type === 'attributes') {
    const attrName = mutation.attributeName;
    return attrName !== 'style' && attrName !== 'class';
  }

  if (mutation.type === 'characterData') {
    const parent = mutation.target.parentElement;
    return !!parent && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName);
  }

  if (mutation.type === 'childList') {
    const nodes = Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes));
    return nodes.some((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent?.trim().length || 0) > 0;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        return !['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(el.tagName);
      }
      return false;
    });
  }

  return true; // default to true for any other mutation types
}

function debounce<T extends any[]>(fn: (...args: T) => void, wait = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: T): void => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => fn(...args), wait);
  };
} 

export class ScraperController {
  private currentUrl: string;
  private lastScrapeContent = '';
  private lastScrapeUrl = ''; // Track URL of last scrape
  private lastScrapeTime = 0; // Track time of last scrape
  private scrapeHistory: number[] = []; // Track scrape timestamps for rate limiting
  private mutationObserver: MutationObserver | null = null;
  private readonly tabId: number;
  private overlayOpenCallback: (() => boolean) | null = null;
  private cacheManager: ContentCacheManager;
  private lastContentHash = '';

  constructor(tabId: number) {
    this.tabId = tabId;
    this.currentUrl = window.location.href;
    this.cacheManager = ContentCacheManager.getInstance();
    this.cacheManager.setDebug(true); // Enable debugging to track compression issue
  }

  /** Set callback to check if Overlay is open */
  setOverlayOpenCallback(callback: () => boolean): void {
    this.overlayOpenCallback = callback;
  }

  /** Trigger a manual scrape (e.g., when Overlay opens) */
  triggerManualScrape(): void {
    this.performDeltaScrape('manual');
  }

  /** Initialize scraping infrastructure but do NOT start observers yet. */
  async init(): Promise<void> {
    console.log('Hana ScraperController: Initializing with cache for tab', this.tabId);
    this.prepareMutationObserver();
    this.prepareNavigationHooks();
    
    // Perform initial scrape and cache
    await this.performInitialScrapeWithCache();
  }

  /** Perform initial scrape and start observing */
  start(): void {
    this.performInitialScrape();
    this.mutationObserver?.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    this.activateNavigationHooks();
  }

  stop(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.deactivateNavigationHooks();
  }

  cleanup(): void {
    console.log('Hana ScraperController: Cleaning up');
    this.stop();
  }

  /** Public accessor for the latest scraped raw text (for debugging). */
  getLastScrapeContent(): string {
    return this.lastScrapeContent;
  }

  /**
   * Get current page content, checking cache first for better performance
   */
  async getCurrentContent(forceRefresh = false): Promise<string> {
    const startTime = Date.now();
    console.log('🔍 Hana ScraperController: getCurrentContent starting, forceRefresh:', forceRefresh);
    
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      console.log('📋 Hana ScraperController: Checking cache...');
      const cachedContent = await this.cacheManager.getLatestContent(this.tabId);
      if (cachedContent && this.cacheManager.hasRecentContent(this.tabId, 2 * 60 * 1000)) {
        console.log('✅ Hana ScraperController: Using cached content in', Date.now() - startTime, 'ms, length:', cachedContent.length, 'preview:', cachedContent.substring(0, 100));
        return cachedContent;
      }
      console.log('⚠️ Hana ScraperController: No recent cache, proceeding to fresh scrape');
    }

    // Cache miss or force refresh - scrape fresh content
    console.log('🔄 Hana ScraperController: Scraping fresh content...');
    const result = await this.scrapeContentWithCache('manual', true);
    console.log('✅ Hana ScraperController: Fresh content scraped in', Date.now() - startTime, 'ms, length:', result.length);
    return result;
  }

  /**
   * Get content optimized for summary (prefer cached content for speed)
   */
  async getContentForSummary(): Promise<string> {
    const startTime = Date.now();
    console.log('📝 Hana ScraperController: getContentForSummary starting');
    
    // For summaries, we prefer cached content to speed up response
    console.log('📋 Hana ScraperController: Checking cache for summary...');
    const cachedContent = await this.cacheManager.getLatestContent(this.tabId);
    if (cachedContent && this.cacheManager.hasRecentContent(this.tabId, 5 * 60 * 1000)) {
      console.log('✅ Hana ScraperController: Using cached content for summary in', Date.now() - startTime, 'ms, length:', cachedContent.length, 'preview:', cachedContent.substring(0, 100));
      return cachedContent;
    }

    // No recent cache - scrape and cache
    console.log('🔄 Hana ScraperController: No recent cache, scraping for summary');
    const result = await this.scrapeContentWithCache('manual', true);
    console.log('✅ Hana ScraperController: Summary content scraped in', Date.now() - startTime, 'ms, length:', result.length);
    return result;
  }

  /** Check if we can scrape based on rate limiting */
  private canScrape(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old entries
    this.scrapeHistory = this.scrapeHistory.filter(time => time > oneMinuteAgo);
    
    // Rate limits
    const maxScrapesPerMinute = 5; // More generous than SolBrowse's 3
    
    if (this.scrapeHistory.length >= maxScrapesPerMinute) {
      console.log('Hana ScraperController: Rate limited, max scrapes reached');
      return false;
    }
    
    return true;
  }

  /** Record a scrape timestamp */
  private recordScrape(): void {
    this.scrapeHistory.push(Date.now());
  }

  // -------------------------------------------
  // Scraping helpers with cache integration
  // -------------------------------------------

  private async performInitialScrapeWithCache(): Promise<void> {
    if (!this.canScrape()) {
      console.log('Hana ScraperController: Skipping initial scrape - rate limited');
      // Try to use cached content
      const cachedContent = await this.cacheManager.getLatestContent(this.tabId);
      if (cachedContent) {
        this.lastScrapeContent = cachedContent;
        (window as any).hanaPageContent = cachedContent;
        console.log('Hana ScraperController: Using cached content for initial load');
        return;
      }
      return;
    }

    await this.scrapeContentWithCache('init', true);
  }

  private async performInitialScrape(): Promise<void> {
    if (!this.canScrape()) {
      console.log('Hana ScraperController: Skipping initial scrape - rate limited');
      return;
    }

    const scrapedContent = getPageContent();
    this.lastScrapeContent = scrapedContent;
    this.recordScrape();

    // Store for global access
    (window as any).hanaPageContent = scrapedContent;

    const msg: ContentInitMsg = {
      type: 'INIT_SCRAPE',
      tabId: this.tabId,
      url: window.location.href,
      title: document.title,
      html: scrapedContent,
      timestamp: Date.now(),
    };
    
    console.log(`Hana ScraperController: Initial scrape completed, content length: ${scrapedContent.length}`);
    // TODO: Send to background via port manager when implemented
  }

  private performDeltaScrape = debounce(async (changeType: 'mutation' | 'navigation' | 'manual') => {
    if (!this.canScrape()) {
      console.log('Hana ScraperController: Skipping delta scrape - rate limited');
      return;
    }

    const currentUrl = window.location.href;
    const now = Date.now();
    
    // Skip if same URL scraped recently (within 2 seconds)
    if (this.lastScrapeUrl === currentUrl && (now - this.lastScrapeTime) < 2000) {
      console.log('Hana ScraperController: Skipping scrape - same URL scraped recently');
      return;
    }
    
    await this.scrapeContentWithCache(changeType, false);
  }, 500);

  /**
   * Enhanced scraping with cache integration
   */
  private async scrapeContentWithCache(changeType: 'init' | 'mutation' | 'navigation' | 'manual', force = false): Promise<string> {
    try {
      console.log(`Hana ScraperController: Scraping content with cache (${changeType})...`);
      
      const content = getPageContent();
      const contentHash = this.generateContentHash(content);
      
      // Check if content has actually changed (avoid unnecessary caching)
      if (!force && contentHash === this.lastContentHash) {
        console.log('Hana ScraperController: Content unchanged, skipping cache update');
        return content;
      }

      // Significant change detection for mutations
      if (changeType === 'mutation' && this.lastContentHash) {
        if (!this.hasSignificantContentChange(content, changeType)) {
          return content;
        }
      }

      // Cache the new content
      await this.cacheManager.addSnapshot({
        tabId: this.tabId,
        url: window.location.href,
        title: document.title || 'Untitled',
        content,
        changeType
      });

      this.lastScrapeContent = content;
      this.lastScrapeUrl = window.location.href;
      this.lastScrapeTime = Date.now();
      this.lastContentHash = contentHash;
      this.recordScrape();

      // Store for global access
      (window as any).hanaPageContent = content;

      console.log(`Hana ScraperController: Content scraped and cached (${content.length} chars, ${changeType})`);
      
      // Log cache stats occasionally
      if (changeType === 'init' || Math.random() < 0.1) {
        const stats = this.cacheManager.getStats();
        console.log('Hana ContentCache stats:', stats);
      }

             // Send delta message if not initial
       if (changeType !== 'init') {
         const msg: ContentDeltaMsg = {
           type: 'DELTA_SCRAPE',
           tabId: this.tabId,
           url: window.location.href,
           html: content,
           changeType,
           timestamp: Date.now(),
         };
         // TODO: Send to background via port manager when implemented
       }

      return content;
      
    } catch (error) {
      console.error('Hana ScraperController: Scraping failed:', error);
      
      // Fallback to cached content
      const cachedContent = await this.cacheManager.getLatestContent(this.tabId);
      if (cachedContent) {
        console.log('Hana ScraperController: Using cached content as fallback');
        return cachedContent;
      }
      
      throw error;
    }
  }

  private hasSignificantContentChange(newContent: string, changeType: string): boolean {
    const oldLength = this.lastScrapeContent.length;
    const newLength = newContent.length;
    
    // Special handling for navigation - always significant
    if (changeType === 'navigation') {
      return true;
    }
    
    // Length change threshold
    const lengthChange = Math.abs(newLength - oldLength);
    const lengthChangePercent = oldLength > 0 ? (lengthChange / oldLength) * 100 : 100;
    
    if (lengthChangePercent > 5) { // >5% length change
      console.log(`Hana ScraperController: Significant length change: ${lengthChangePercent.toFixed(1)}%`);
      return true;
    }
    
    // Content similarity check (basic)
    const similarity = this.calculateContentSimilarity(this.lastScrapeContent, newContent);
    if (similarity < 0.95) { // Less than 95% similar
      console.log(`Hana ScraperController: Significant content change: ${((1 - similarity) * 100).toFixed(1)}% different`);
      return true;
    }
    
    return false;
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    if (content1 === content2) return 1.0;
    if (content1.length === 0 && content2.length === 0) return 1.0;
    if (content1.length === 0 || content2.length === 0) return 0.0;
    
    // Simple approach: count common substrings
    const shorter = content1.length < content2.length ? content1 : content2;
    const longer = content1.length >= content2.length ? content1 : content2;
    
    let matches = 0;
    const chunkSize = 50;
    
    for (let i = 0; i <= shorter.length - chunkSize; i += chunkSize) {
      const chunk = shorter.substr(i, chunkSize);
      if (longer.includes(chunk)) {
        matches++;
      }
    }
    
    const totalChunks = Math.ceil(shorter.length / chunkSize);
    return totalChunks > 0 ? matches / totalChunks : 0;
  }

  private prepareMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      const significantMutations = mutations.filter(isSignificant);
      if (significantMutations.length > 0) {
        this.performDeltaScrape('mutation');
      }
    });
  }

  private prepareNavigationHooks(): void {
    // Will be overridden by activateNavigationHooks
  }

  private activateNavigationHooks(): void {
    // Watch for URL changes
    const checkUrlChange = () => {
      const newUrl = window.location.href;
      if (newUrl !== this.currentUrl) {
        console.log(`Hana ScraperController: URL changed from ${this.currentUrl} to ${newUrl}`);
        this.currentUrl = newUrl;
        
        // Clear cache for navigation
        this.cacheManager.clearTab(this.tabId);
        this.lastContentHash = '';
        
        this.performDeltaScrape('navigation');
      }
    };

    // Check for URL changes every 1 second
    setInterval(checkUrlChange, 1000);

    // Listen for popstate events (back/forward)
    window.addEventListener('popstate', () => {
      setTimeout(checkUrlChange, 100);
    });

    // Override pushState and replaceState to detect programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(checkUrlChange, 100);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(checkUrlChange, 100);
    };
  }

  private deactivateNavigationHooks(): void {
    // Will be overridden by activateNavigationHooks
  }

  private generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear cache for current tab (useful for navigation)
   */
  clearCache(): void {
    this.cacheManager.clearTab(this.tabId);
    this.lastContentHash = '';
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * Force cache cleanup
   */
  cleanupCache(): void {
    this.cacheManager.cleanup();
  }
} 