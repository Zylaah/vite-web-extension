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

export class OverlayController {
  private overlayInstance: IframeInstance | null = null;
  private isOverlayVisible = false;
  private overlayEnabled = true;
  private targetKeybindString = 'Alt+F';
  private summaryKeybindString = 'Ctrl+Alt+F';
  private keypressDisposer: (() => void) | null = null;
  private onOverlayOpenCallback: (() => void) | null = null;

  constructor(private tabManager: TabConversationManager) {}

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
    console.log('Hana: show() called with mode:', mode, 'enabled:', this.overlayEnabled, 'visible:', this.isOverlayVisible);
    
    if (!this.overlayEnabled || this.isOverlayVisible) {
      console.log('Hana: show() aborted - overlay disabled or already visible');
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
    }
  }

  hide(): void {
    if (!this.isOverlayVisible) return;

    // Remove the shadow DOM container
    if (this.overlayInstance) {
      this.overlayInstance.remove();
      this.overlayInstance = null;
    }

    this.isOverlayVisible = false;
    // Restore focus so keybind continues working
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
    document.body.focus();
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
      // Debug logging for all Alt+F and Ctrl+Alt+F combinations
      if (e.altKey && e.key.toLowerCase() === 'f') {
        console.log('Hana: Keyboard shortcut detected:', {
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          key: e.key,
          overlayVisible: this.isOverlayVisible
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
    // Create container
    const container = document.createElement('div');
    container.id = 'hana-extension-container';
    document.body.appendChild(container);
    
    // Create shadow root
    const shadowRoot = container.attachShadow({ mode: 'open' });
    
    // Apply dark mode based on user settings
    const applyDarkMode = async () => {
      try {
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
    const overlayStyles = await import('../../pages/content/overlay.css?inline');
    const styleElement = document.createElement('style');
    styleElement.textContent = overlayStyles.default;
    shadowRoot.appendChild(styleElement);
    
    // Create and mount React component
    const { createRoot } = await import('react-dom/client');
    const React = await import('react');
    const { default: Overlay } = await import('../../pages/content/components/Overlay');
    
    const root = createRoot(appContainer);
    
    // Function to get current page content from scraper
    const getCurrentPageContent = () => {
      return (window as any).hanaPageContent || '';
    };

    root.render(React.createElement(Overlay, {
      onClose: () => this.hide(),
      pageContent: getCurrentPageContent(),
      initialMode: config.mode,
      onModeChange: (mode: 'chat' | 'summary') => {
        // Handle mode changes
      },
      getPageContent: getCurrentPageContent, // Pass function to get updated content
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