/**
 * Scraper Controller for Hana extension
 * Based on SolBrowse's ScraperController pattern
 */
import { getPageContent } from '../utils/contentExtractor';
import { portManager } from './portManager';
import { ContentInitMsg, ContentDeltaMsg } from '../types/messaging';

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

  constructor(tabId: number) {
    this.tabId = tabId;
    this.currentUrl = window.location.href;
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
    this.prepareMutationObserver();
    this.prepareNavigationHooks();
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
    this.stop();
  }

  /** Public accessor for the latest scraped raw text (for debugging). */
  getLastScrapeContent(): string {
    return this.lastScrapeContent;
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
  // Scraping helpers
  // -------------------------------------------

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
    
    const scrapedContent = getPageContent();
    
    // Only send if changed significantly
    if (!this.hasSignificantContentChange(scrapedContent, changeType)) {
      return;
    }
    
    this.lastScrapeContent = scrapedContent;
    this.lastScrapeUrl = currentUrl;
    this.lastScrapeTime = now;
    this.recordScrape();

    // Update global access
    (window as any).hanaPageContent = scrapedContent;

    const msg: ContentDeltaMsg = {
      type: 'DELTA_SCRAPE',
      tabId: this.tabId,
      url: window.location.href,
      html: scrapedContent,
      changeType,
      timestamp: Date.now(),
    };
    
    console.log(`Hana ScraperController: Delta scrape completed (${changeType}), content length: ${scrapedContent.length}`);
    // TODO: Send to background via port manager when implemented
  }, 500);

  private hasSignificantContentChange(newContent: string, changeType: string): boolean {
    const oldLength = this.lastScrapeContent.length;
    const newLength = newContent.length;
    
    // For manual scrapes, always consider significant
    if (changeType === 'manual') return true;
    
    // For navigation, always consider significant
    if (changeType === 'navigation') return true;
    
    // For mutations, check change threshold
    const lengthDiff = Math.abs(newLength - oldLength);
    const percentChange = oldLength > 0 ? lengthDiff / oldLength : 1;
    
    // Consider significant if content changed by more than 5% or 100 characters
    const isSignificant = percentChange > 0.05 || lengthDiff > 100;
    
    if (!isSignificant) {
      console.log(`Hana ScraperController: Content change not significant (${lengthDiff} chars, ${(percentChange * 100).toFixed(1)}%)`);
    }
    
    return isSignificant;
  }

  // -------------------------------------------
  // Observers
  // -------------------------------------------

  private prepareMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      const significantMutations = mutations.filter(isSignificant);
      if (significantMutations.length > 0) {
        console.log(`Hana ScraperController: ${significantMutations.length} significant mutations detected`);
        this.performDeltaScrape('mutation');
      }
    });
  }

  private prepareNavigationHooks(): void {
    // Navigation detection will be set up when activated
  }

  private activateNavigationHooks(): void {
    // Listen for URL changes (SPA navigation)
    let lastUrl = window.location.href;
    
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        console.log(`Hana ScraperController: Navigation detected: ${lastUrl} -> ${currentUrl}`);
        lastUrl = currentUrl;
        this.currentUrl = currentUrl;
        this.performDeltaScrape('navigation');
      }
    };

    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(checkUrlChange, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(checkUrlChange, 0);
    };

    // Listen for popstate
    window.addEventListener('popstate', checkUrlChange);
    
    // Store cleanup function
    this.deactivateNavigationHooks = () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', checkUrlChange);
    };
  }

  private deactivateNavigationHooks(): void {
    // Will be overridden by activateNavigationHooks
  }
} 