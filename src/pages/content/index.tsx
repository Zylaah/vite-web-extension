/**
 * Content script for Hana extension
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { BackgroundCommunicator } from '../../lib/services/backgroundCommunicator';
import { getPageContent } from '../../lib/utils/contentExtractor';
import { createShadowRoot, addStyleToShadowRoot } from '../../lib/utils/domUtils';

console.log('Hana content script loaded');

// Create shadow host for isolation
const shadowHost = document.createElement('div');
shadowHost.id = 'hana-shadow-host';
document.body.appendChild(shadowHost);

// Create shadow root
const shadowRoot = createShadowRoot(shadowHost);

// Add stylesheet
addStyleToShadowRoot(shadowRoot, 'contentStyle.css');

// Create container for React
const container = document.createElement('div');
container.id = 'hana-container';
shadowRoot.appendChild(container);

// Initialize React
const root = createRoot(container);

// Placeholder component - will be replaced with actual UI components in Phase 2
root.render(
  <div className="hana-overlay">
    <div className="hana-header">
      <h3>Hana AI Assistant</h3>
      <p>Phase 1 foundation is complete. UI components will be added in Phase 2.</p>
    </div>
  </div>
);

// Set up keyboard shortcut listener
let shortcut = 'Alt+F'; // Default shortcut

// Load custom shortcut if available
async function loadShortcut() {
  try {
    const result = await BackgroundCommunicator.getShortcut();
    shortcut = result.shortcut;
    console.log('Loaded custom shortcut:', shortcut);
  } catch (error) {
    console.error('Error loading shortcut:', error);
  }
}

loadShortcut();

// Toggle overlay function (placeholder)
function toggleOverlay() {
  console.log('Toggle overlay triggered');
  
  // Check privacy policy
  BackgroundCommunicator.checkPrivacyStatus().then(status => {
    if (status.limited) {
      console.log('Privacy policy not accepted');
      // In Phase 2, we'll show the privacy notice
      return;
    }
    
    // In Phase 2, we'll implement the actual overlay toggle
    console.log('Privacy policy accepted, would show overlay');
    
    // Example of content extraction
    const pageContent = getPageContent();
    console.log('Extracted page content length:', pageContent.length);
  });
}

// Listen for keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Simple shortcut detection (will be improved in Phase 2)
  if (e.altKey && e.key === 'f') {
    e.preventDefault();
    toggleOverlay();
  }
});

// Listen for messages from background script
browser.runtime.onMessage.addListener((message: any) => {
  if (message.command === 'toggle-input') {
    toggleOverlay();
  }
  return true;
});
