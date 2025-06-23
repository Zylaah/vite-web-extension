/**
 * Content script for Hana extension
 */
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { getPageContent } from '../../lib/utils/contentExtractor';
import { BackgroundCommunicator } from '../../lib/services/backgroundCommunicator';
import { HighlightService } from '../../lib/services/highlightService';
import { ImportantTextPart } from '../../lib/types';
import Overlay from './components/Overlay';
import './style.css';
import overlayStyles from './overlay.css?inline';

// Create shadow DOM for isolation
const createShadowContainer = () => {
  // Create container
  const container = document.createElement('div');
  container.id = 'hana-extension-container';
  document.body.appendChild(container);
  
  // Create shadow root
  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  // Create app container inside shadow root
  const appContainer = document.createElement('div');
  appContainer.id = 'hana-app';
  shadowRoot.appendChild(appContainer);
  
  // Inject overlay styles into shadow DOM
  const styleElement = document.createElement('style');
  styleElement.textContent = overlayStyles;
  shadowRoot.appendChild(styleElement);
  
  return appContainer;
};

// Main content script
const main = async () => {
  console.log('Hana content script loaded');
  
  // Extract page content
  const pageContent = getPageContent();
  console.log(`Extracted ${pageContent.length} characters from page`);
  
  // Create container
  const container = createShadowContainer();
  const root = createRoot(container);
  
  // Get shadow root for highlighting
  const shadowRoot = document.getElementById('hana-extension-container')?.shadowRoot;
  
  // Render app
  const App = () => {
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayMode, setOverlayMode] = useState<'chat' | 'summary'>('chat');
    const [importantParts, setImportantParts] = useState<ImportantTextPart[]>([]);
    
    const handleModeChange = (mode: 'chat' | 'summary') => {
      setOverlayMode(mode);
    };
    
    // Listen for keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = async (e: KeyboardEvent) => {
        // Ctrl+Alt+F for instant summary
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          e.stopPropagation();
          
          // Show overlay in summary mode (it will auto-trigger summary)
          setOverlayMode('summary');
          setShowOverlay(true);
          return;
        }
        
        // Default shortcut: Alt+F to toggle overlay in chat mode
        if (e.altKey && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          e.stopPropagation();
          
          if (showOverlay && overlayMode === 'chat') {
            // If already in chat mode, just toggle visibility
            setShowOverlay(false);
          } else {
            // Force chat mode and show overlay
            setOverlayMode('chat');
            setShowOverlay(true);
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, []);
    
    // Listen for messages from background script
    useEffect(() => {
      const handleMessage = (message: any) => {
        if (message.action === 'toggle-overlay') {
          setShowOverlay(prev => !prev);
        }
        
        // Handle importance analysis results
        if (message.action === 'analysis-complete' && message.importantParts) {
          console.log('Received importance analysis results:', message.importantParts);
          setImportantParts(message.importantParts);
          
          // Apply highlights if shadow root is available
          if (shadowRoot) {
            HighlightService.highlightImportantText(message.importantParts, shadowRoot);
          }
        }
        
        // Handle analysis errors
        if (message.action === 'analysis-error') {
          console.error('Analysis error:', message.error);
        }
      };
      
      browser.runtime.onMessage.addListener(handleMessage);
      return () => {
        browser.runtime.onMessage.removeListener(handleMessage);
      };
    }, []);
    
    // Function to analyze page content for important parts
    const analyzeImportance = async () => {
      try {
        console.log('Requesting importance analysis...');
        await BackgroundCommunicator.analyzeImportance(pageContent);
      } catch (error) {
        console.error('Error requesting importance analysis:', error);
      }
    };
    
    // Function to clear highlights
    const clearHighlights = () => {
      if (shadowRoot) {
        HighlightService.removeHighlights(shadowRoot);
        setImportantParts([]);
      }
    };
    
    return showOverlay ? (
      <Overlay 
        onClose={() => {
          setShowOverlay(false);
          // Reset to chat mode when closing overlay
          setTimeout(() => setOverlayMode('chat'), 0);
        }}
        pageContent={pageContent}
        initialMode={overlayMode}
        onModeChange={handleModeChange}
      />
    ) : null;
  };
  
  root.render(<App />);
};

// Run main function
main().catch(error => {
  console.error('Error in Hana content script:', error);
});
