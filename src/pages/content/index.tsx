/**
 * New Content Script for Hana extension
 * Based on SolBrowse's controller architecture
 */
import browser from 'webextension-polyfill';
import { TabConversationManager } from '../../lib/utils/tabConversationManager';
import { OverlayController } from '../../lib/controllers/overlayController';
import { ScraperController } from '../../lib/controllers/scraperController';

// Detect whether we are executing inside an extension-origin page
const isExtensionContext = (): boolean => {
  if (
    window.location.protocol === 'chrome-extension:' ||
    window.location.protocol === 'moz-extension:' ||
    window.location.protocol === 'ms-browser-extension:'
  ) {
    return true;
  }
  if (
    window.location.href.includes('chrome-extension://') ||
    window.location.href.includes('moz-extension://')
  ) {
    return true;
  }
  return false;
};

// Ask background script for the tab ID
async function getTabId(): Promise<number | null> {
  try {
    const response = (await browser.runtime.sendMessage({
      type: 'GET_CURRENT_TAB_ID',
    })) as { tabId?: number };
    return typeof response?.tabId === 'number' ? response.tabId : null;
  } catch (error) {
    console.error('Hana Content Script: Error getting tab ID:', error);
    return null;
  }
}

// Entry point
if (isExtensionContext()) {
  console.log('Hana Content Script: Skipping execution in extension context');
} else {
  (async () => {
    try {
      // Prevent multiple injections (e.g. due to SPA re-rendering)
      if ((window as any).hanaContentScript) {
        console.log('Hana Content Script: Already initialised');
        return;
      }

      const tabId = await getTabId();
      if (tabId == null) {
        console.warn('Hana Content Script: Could not obtain tab ID, aborting initialisation.');
        return;
      }

    // Expose for debugging
    (window as any).hanaTabId = tabId;

    // Instantiate controllers following SolBrowse pattern
    const tabManager = TabConversationManager.getInstance();
    const overlay = new OverlayController(tabManager);
    const scraper = new ScraperController(tabId);

    // Connect scraper to overlay state
    scraper.setOverlayOpenCallback(() => overlay.isVisible());
    overlay.setOnOpenCallback(() => scraper.triggerManualScrape());

    await Promise.all([overlay.init(), scraper.init()]);

    // Start scraping immediately; controllers can later coordinate if needed
    scraper.start();

    // Expose globally for debugging/testing
    (window as any).hanaContentScript = { overlay, scraper, tabManager };

    // Listen for debug context requests from the overlay
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'hana-copy-context') {
        const context = {
          url: window.location.href,
          title: document.title,
          lastScrape: scraper.getLastScrapeContent(),
        };
        (event.source as Window)?.postMessage({ 
          type: 'hana-context-response', 
          context 
        }, '*' as any);
      }
    });

    // Cleanup
    window.addEventListener('beforeunload', () => {
      overlay.cleanup();
      scraper.cleanup();
      console.log('Hana Content Script: Cleaned up controllers');
    });

    console.log('Hana Content Script: Successfully initialized with controller architecture');
    } catch (error) {
      console.error('Hana Content Script: Error during initialization:', error);
    }
  })();
} 