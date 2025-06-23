/**
 * Background script for Hana extension
 */
import browser from 'webextension-polyfill';
import { PrivacyManager } from '../../lib/services/privacyManager';
import { RateLimiter } from '../../lib/utils/rateLimiter';
import { StorageService } from '../../lib/services/storageService';

import { getModelName } from '../../lib/config/models';
import { getApiClient } from '../../lib/api/apiFactory';
import { ImportanceAnalyzer } from '../../lib/services/importanceAnalyzer';

console.log('Hana background script loaded');

/**
 * Handle extension installation
 */
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Extension installed, opening options page');
    // Open the options page on first install
    await browser.runtime.openOptionsPage();
  }
});

/**
 * Main message listener
 */
browser.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  // Debug: Log all received messages
  console.log('🔍 Hana Background: Received message with action:', message.action, 'type:', message.type, 'at', Date.now());
  console.log('🔍 Hana Background: Full message:', message);
  console.log('🔍 Hana Background: Sender tab ID:', sender.tab?.id);
  
  // Wrap in async IIFE to use await
  (async () => {
    const messageType = message.action || message.type;
    console.log(`Received message: ${messageType}`);
    
    switch (messageType) {
      case 'query-ai':
        // Check privacy first
        if (!(await PrivacyManager.canRun())) {
          console.log('Query rejected - privacy policy not accepted');
          sendResponse({ 
            error: true, 
            text: "You must accept the privacy policy to use this extension. Please open the extension settings to accept it.", 
            privacyRejected: true
          });
          return;
        }
        
        // Check content length
        if (!message.pageContent || message.pageContent.length < 10) {
          console.error('Page content is too short or empty');
          sendResponse({ 
            error: true, 
            text: "The page content is too short or empty. Unable to generate a response." 
          });
          return;
        }
        
        // Check rate limit
        if (RateLimiter.check()) {
          console.log('Rate limit reached');
          sendResponse({ 
            error: true, 
            text: `You have reached the request limit. Please try again in ${Math.ceil(RateLimiter.getTimeRemaining() / 1000)} seconds.` 
          });
          return;
        }
        
        try {
          // Get settings for language preference
          const settings = await StorageService.getSettings();
          
          // Get the appropriate API client
          const apiClient = getApiClient(message.provider);
          
          // Call the API
          const model = getModelName(message.provider, message.model);
          const isSummary = message.prompt.toLowerCase().includes('summarize');
          console.log(`Calling ${message.provider} API with model ${model}, isSummary: ${isSummary}, language: ${settings.responseLanguage}`);
          
          const response = await apiClient.call(message.prompt, message.pageContent, model, isSummary, settings.responseLanguage);
          sendResponse(response);
        } catch (error: any) {
          console.error('Error calling API:', error);
          sendResponse({ 
            error: true, 
            text: error.message || `An error occurred while calling the ${message.provider} API.` 
          });
        }
        break;
        
      case 'query-ai-streaming':
        // Check privacy first
        if (!(await PrivacyManager.canRun())) {
          console.log('Streaming query rejected - privacy policy not accepted');
          sendResponse({ 
            error: true, 
            text: "You must accept the privacy policy to use this extension. Please open the extension settings to accept it.", 
            privacyRejected: true
          });
          return;
        }
        
        // Check content length
        if (!message.pageContent || message.pageContent.length < 10) {
          console.error('Page content is too short or empty');
          sendResponse({ 
            error: true, 
            text: "The page content is too short or empty. Unable to generate a response." 
          });
          return;
        }
        
        // Check rate limit
        if (RateLimiter.check()) {
          console.log('Rate limit reached for streaming');
          sendResponse({ 
            error: true, 
            text: `You have reached the request limit. Please try again in ${Math.ceil(RateLimiter.getTimeRemaining() / 1000)} seconds.` 
          });
          return;
        }
        
        console.log('🚀 Hana Background: Starting streaming query at', Date.now());
        const streamingStartTime = Date.now();
        
        try {
          // Acknowledge receipt immediately
          console.log('📡 Hana Background: Sending acknowledgment at', Date.now() - streamingStartTime, 'ms');
          sendResponse({ received: true });
          
          // Get settings for language preference
          const settings = await StorageService.getSettings();
          
          // Get the appropriate API client
          console.log('🔧 Hana Background: Getting API client at', Date.now() - streamingStartTime, 'ms');
          const apiClient = getApiClient(message.provider);
          
          // Check if client supports streaming
          if ('callStreaming' in apiClient) {
            const model = getModelName(message.provider, message.model);
            const isSummary = message.prompt.toLowerCase().includes('summarize');
            console.log(`🤖 Hana Background: Starting streaming call to ${message.provider} API with model ${model}, language: ${settings.responseLanguage} at ${Date.now() - streamingStartTime}ms`);
            
            // Start streaming
            await (apiClient as any).callStreaming(
              message.prompt, 
              message.pageContent, 
              model, 
              isSummary,
              settings.responseLanguage,
              (chunk: any) => {
                // Send chunk to content script
                browser.tabs.sendMessage(sender.tab?.id || 0, {
                  action: 'streaming-chunk',
                  chunk
                });
              }
            );
            
            console.log('✅ Hana Background: Streaming completed at', Date.now() - streamingStartTime, 'ms');
            
            // Send completion message
            browser.tabs.sendMessage(sender.tab?.id || 0, {
              action: 'streaming-complete'
            });
          } else {
            // Fallback to regular call
            console.log('⚠️ Hana Background: Using fallback non-streaming call');
            const model = getModelName(message.provider, message.model);
            const isSummary = message.prompt.toLowerCase().includes('summarize');
            const response = await apiClient.call(message.prompt, message.pageContent, model, isSummary, settings.responseLanguage);
            
            browser.tabs.sendMessage(sender.tab?.id || 0, {
              action: 'streaming-complete',
              response
            });
          }
        } catch (error: any) {
          console.error('❌ Hana Background: Error in streaming call at', Date.now() - streamingStartTime, 'ms:', error);
          browser.tabs.sendMessage(sender.tab?.id || 0, {
            action: 'streaming-error',
            error: error.message || 'An error occurred during streaming'
          });
        }
        break;

      case 'accept-privacy-policy':
        try {
          await PrivacyManager.acceptPolicy();
          sendResponse({ success: true });
                 } catch (error: any) {
           console.error('Error accepting privacy policy:', error);
           sendResponse({ error: true, message: error.message });
         }
        break;

      case 'check-privacy-policy':
        try {
          const status = await PrivacyManager.getStatus();
          sendResponse(status); 
                 } catch (error: any) {
           console.error('Error checking privacy policy status:', error);
           sendResponse({ error: true, message: "Failed to check privacy status." });
         }
        break;

      case 'get-shortcut':
        // Placeholder for keyboard shortcut management
        sendResponse({ name: 'toggle-input', shortcut: 'Alt+F' });
        break;

      case 'GET_CURRENT_TAB_ID':
        // Return the current tab ID for the content script
        if (sender.tab?.id) {
          sendResponse({ tabId: sender.tab.id });
        } else {
          sendResponse({ error: 'No tab ID available' });
        }
        break;


        
      case 'analyze-importance':
        if (!message.text) {
          sendResponse({ error: true, text: 'No text provided for analysis', importantParts: [] });
          return;
        }
        
        // Check privacy policy
        if (!(await PrivacyManager.canRun())) {
          sendResponse({ 
            error: true, 
            text: "You must accept the privacy policy to use this feature.", 
            privacyRejected: true,
            importantParts: []
          });
          return;
        }
          
        // Check rate limit
        if (RateLimiter.check(20, 60 * 1000)) { // More reasonable rate limit for analysis (was 3)
          console.log('Rate limit reached for importance analysis');
          sendResponse({ 
            error: true, 
            text: "Rate limit reached for analysis. Please try again later.", 
            importantParts: [] 
          });
          return;
        }
        
        try {
          // Acknowledge receipt immediately
          sendResponse({ received: true });
          
          // Analyze the text
          console.log('Analyzing text importance...');
          const importantParts = await ImportanceAnalyzer.analyze(message.text);
          
          // Send the results to the content script
          browser.tabs.sendMessage(sender.tab?.id || 0, {
            action: 'analysis-complete',
            importantParts
          });
        } catch (error: any) {
          console.error('Error analyzing importance:', error);
          browser.tabs.sendMessage(sender.tab?.id || 0, {
            action: 'analysis-error',
            error: error.message || 'An error occurred during analysis'
          });
        }
        break;

      default:
        console.warn("Received unhandled message action:", message.action);
        break;
    }
  })().catch((err: any) => {
    console.error("Error in background onMessage listener:", err);
    try {
      // Ensure a useful message is always sent
      const errorMessage = err?.message || "An unknown error occurred in the background script.";
      sendResponse({ error: true, text: errorMessage });
    } catch (e: any) { 
      console.error("Failed to send generic error response:", e); 
    }
  });

  // Return true to indicate asynchronous response handling
  return true;
});
