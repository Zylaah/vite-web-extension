/**
 * Overlay Controller for Hana extension
 * Based on SolBrowse's AskBarController pattern
 */
import browser from 'webextension-polyfill';
import { StorageService } from '../services/storageService';
import { IframeInjector, IframeInstance } from '../utils/iframeInjector';
import { TabConversationManager } from '../utils/tabConversationManager';
import { MessageBus } from '../utils/messageHandler';
import { attachToggleKeybind } from '../services/keybindManager';
import { createRoot } from 'react-dom/client';
import * as React from 'react';
import Overlay from '../../pages/content/components/Overlay';
import overlayStyles from '../../pages/content/overlay.css?inline';

export class OverlayController {
  private overlayInstance: IframeInstance | null = null;
  private isOverlayVisible = false;
  private overlayEnabled = true;
  private targetKeybindString = 'Alt+F';
  private summaryKeybindString = 'Ctrl+Alt+F';
  private keypressDisposer: (() => void) | null = null;
  private onOverlayOpenCallback: (() => void) | null = null;
  private scraperController: any; // Will be injected
  private isTransitioning = false; // Prevent rapid toggle operations
  private lastKeyPressTime = 0; // Debounce rapid keypresses

  constructor(private tabManager: TabConversationManager) {}

  setScraperController(scraperController: any): void {
    this.scraperController = scraperController;
  }

  /** Set callback to trigger when Overlay opens */
  setOnOpenCallback(callback: () => void): void {
    this.onOverlayOpenCallback = callback;
  }

  async init(): Promise<void> {
    await this.loadSettings();
    this.setupMessageHandlers();
  }

  cleanup(): void {
    this.hide();
    MessageBus.cleanup();
    this.keypressDisposer?.();
  }

  /** Public accessor for Overlay visibility state */
  isVisible(): boolean {
    return this.isOverlayVisible;
  }

  // ---------------------------------------------------------
  // Visibility helpers
  // ---------------------------------------------------------

  async show(mode: 'chat' | 'summary' = 'chat'): Promise<void> {
    console.log('Hana: show() called with mode:', mode, 'enabled:', this.overlayEnabled, 'visible:', this.isOverlayVisible, 'transitioning:', this.isTransitioning);
    
    if (!this.overlayEnabled || this.isTransitioning) {
      console.log('Hana: show() aborted - overlay disabled or transitioning');
      return;
    }
    
    // Set transitioning flag to prevent rapid operations
    this.isTransitioning = true;
    
    try {
      // Force cleanup of any existing overlay before creating new one
      if (this.isOverlayVisible || this.overlayInstance) {
        console.log('Hana: Cleaning up existing overlay before creating new one');
        this.hide();
        // Wait longer to ensure complete cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Hana: Error during cleanup:', error);
      this.isTransitioning = false;
      return;
    }

    try {
      const settings = await StorageService.getSettings();
      const existingConversation = this.tabManager.getConversation() || null;

      console.log('Hana: Creating shadow overlay...');
      // Create shadow DOM container instead of iframe
      this.overlayInstance = await this.createShadowOverlay({
        mode,
        settings,
        existingConversation: existingConversation as any,
      });

      this.isOverlayVisible = true;
      console.log('Hana: Overlay created and set to visible');
      
      // Trigger content scraping when Overlay opens
      if (this.onOverlayOpenCallback) {
        this.onOverlayOpenCallback();
      }
    } catch (error) {
      console.error('Hana: Error in show():', error);
    } finally {
      // Always clear transitioning flag
      this.isTransitioning = false;
    }
  }

  hide(): void {
    console.log('Hana: hide() called, visible:', this.isOverlayVisible, 'instance exists:', !!this.overlayInstance);
    
    // Set transitioning flag
    this.isTransitioning = true;
    
    try {
      // Remove the shadow DOM container even if isOverlayVisible is false
      if (this.overlayInstance) {
        console.log('Hana: Removing overlay instance');
        this.overlayInstance.remove();
        this.overlayInstance = null;
      }
      
      // Also ensure any lingering containers are removed with more thorough cleanup
      const existingContainers = document.querySelectorAll('#hana-extension-container');
      existingContainers.forEach(container => {
        console.log('Hana: Removing lingering container');
        container.remove();
      });

      this.isOverlayVisible = false;
      
      // Restore focus so keybind continues working
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }
      document.body.focus();
    } finally {
      // Clear transitioning flag after a small delay to prevent immediate re-triggering
      setTimeout(() => {
        this.isTransitioning = false;
      }, 150);
    }
  }

  // ---------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------

  private async loadSettings(): Promise<void> {
    const settings = await StorageService.getSettings();
    this.overlayEnabled = true; // Always enabled for now
    this.targetKeybindString = 'Alt+F'; // TODO: Make configurable
    this.summaryKeybindString = 'Ctrl+Alt+F';

    if (this.overlayEnabled) {
      this.setupKeybindListener();
      this.setupStorageListener();
    }
  }

  private setupKeybindListener(): void {
    // Dispose previous
    if (this.keypressDisposer) {
      this.keypressDisposer();
    }

    // Handle multiple keybinds
    const handleKeyDown = (e: KeyboardEvent) => {
      // Debounce rapid keypresses
      const now = Date.now();
      if (now - this.lastKeyPressTime < 200) {
        console.log('Hana: Ignoring rapid keypress');
        return;
      }
      this.lastKeyPressTime = now;
      
      // Debug logging for all Alt+F and Ctrl+Alt+F combinations
      if (e.altKey && e.key.toLowerCase() === 'f') {
        console.log('Hana: Keyboard shortcut detected:', {
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          key: e.key,
          overlayVisible: this.isOverlayVisible,
          transitioning: this.isTransitioning
        });
      }
      
      // Ctrl+Alt+F for instant summary
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        e.stopPropagation();
        console.log('Hana: Opening overlay in summary mode');
        this.show('summary');
        return;
      }
      
      // Alt+F to toggle overlay in chat mode
      if (e.altKey && !e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent rapid toggling
        if (this.isTransitioning) {
          console.log('Hana: Ignoring keypress - transition in progress');
          return;
        }
        
        console.log('Hana: Toggling overlay in chat mode, currently visible:', this.isOverlayVisible);
        
        if (this.isOverlayVisible) {
          this.hide();
        } else {
          this.show('chat');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    this.keypressDisposer = () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }

  private setupStorageListener(): void {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      // Handle settings changes
      if (changes.selectedProvider || changes.qualityPreference || changes.darkMode) {
        // Reload settings if needed
        this.loadSettings();
      }
    });
  }

  private setupMessageHandlers(): void {
    MessageBus.addHandler('hana-close-overlay', () => {
      if (this.isOverlayVisible) this.hide();
    });

    MessageBus.addHandler('hana-update-tab-conversation', (data) => {
      this.tabManager.setConversation(data.messages, data.conversationId);
    });

    MessageBus.addHandler('hana-get-current-tab', () => {
      if (this.overlayInstance) {
        this.overlayInstance.sendMessage({
          type: 'hana-current-tab-response',
          tabId: (window as any).hanaTabId ?? null,
          url: window.location.href,
          title: document.title,
        });
      }
    });
  }

  private async createShadowOverlay(config: {
    mode: 'chat' | 'summary';
    settings: any;
    existingConversation?: any;
  }): Promise<IframeInstance> {
    // Ensure no existing containers before creating new one
    const existingContainers = document.querySelectorAll('#hana-extension-container');
    existingContainers.forEach(container => container.remove());
    
    // Create container with unique ID to prevent conflicts
    const container = document.createElement('div');
    container.id = 'hana-extension-container';
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease-in-out';
    document.body.appendChild(container);
    
    // Fade in smoothly
    requestAnimationFrame(() => {
      container.style.opacity = '1';
    });
    
    // Create shadow root
    const shadowRoot = container.attachShadow({ mode: 'open' });
    
    // Apply dark mode based on user settings
    const applyDarkMode = async () => {
      try {
        // Get dark mode preference from storage
        const settings = await StorageService.getSettings();
        if (settings.darkMode) {
          shadowRoot.host.classList.add('dark-mode');
        } else {
          shadowRoot.host.classList.remove('dark-mode');
        }
      } catch (error) {
        console.error('Error loading dark mode setting:', error);
        // Fallback to system preference
        const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDarkMode) {
          shadowRoot.host.classList.add('dark-mode');
        } else {
          shadowRoot.host.classList.remove('dark-mode');
        }
      }
    };
    
    await applyDarkMode();
    
    // Listen for storage changes
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.darkMode) {
        applyDarkMode();
      }
    });
    
    // Create app container inside shadow root
    const appContainer = document.createElement('div');
    appContainer.id = 'hana-app';
    shadowRoot.appendChild(appContainer);
    
    // Inject overlay styles into shadow DOM
    const styleElement = document.createElement('style');
    styleElement.textContent = overlayStyles;
    shadowRoot.appendChild(styleElement);
    
    // Create and mount React component
    
    const root = createRoot(appContainer);
    
    // Function to get current page content from scraper with caching
    const getCurrentPageContent = async () => {
      if (this.scraperController && typeof this.scraperController.getCurrentContent === 'function') {
        try {
          return await this.scraperController.getCurrentContent();
        } catch (error) {
          console.warn('Hana: Failed to get content from scraper, falling back to global:', error);
        }
      }
      return (window as any).hanaPageContent || '';
    };

    // Function to get content optimized for summaries (prefer cached)
    const getContentForSummary = async () => {
      if (this.scraperController && typeof this.scraperController.getContentForSummary === 'function') {
        try {
          return await this.scraperController.getContentForSummary();
        } catch (error) {
          console.warn('Hana: Failed to get summary content from scraper, falling back to global:', error);
        }
      }
      return (window as any).hanaPageContent || '';
    };

    // Get initial content synchronously for immediate render
    const initialContent = (window as any).hanaPageContent || '';

    root.render(React.createElement(Overlay, {
      key: `overlay-${config.mode}-${Date.now()}`, // Force remount for different modes
      onClose: () => this.hide(),
      pageContent: initialContent,
      initialMode: config.mode,
      onModeChange: (mode: 'chat' | 'summary') => {
        // Handle mode changes
      },
      getPageContent: () => (window as any).hanaPageContent || '', // Keep sync for compatibility
      getContentForSummary: getContentForSummary, // New async function for summaries
      getCurrentContent: getCurrentPageContent, // New async function for chat
      existingConversation: config.existingConversation,
      onConversationUpdate: (messages: any[], conversationId: string | null) => {
        // Save conversation to tab manager
        this.tabManager.setConversation(messages, conversationId);
      }
    }));

    return {
      iframe: container as any, // For compatibility
      cleanup: () => {},
      remove: () => {
        container.remove();
      },
      sendMessage: (message: any) => {
        // Handle inter-component messaging
        console.log('Overlay message:', message);
      }
    };
  }
} 