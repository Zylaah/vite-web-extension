/**
 * Background script for Hana extension
 */
import browser from 'webextension-polyfill';
import { PrivacyManager } from '../../lib/services/privacyManager';
import { RateLimiter } from '../../lib/utils/rateLimiter';
import { CryptoUtils } from '../../lib/utils/crypto';
import { getModelName } from '../../lib/config/models';
import { getApiClient } from '../../lib/api/apiFactory';
import { ImportanceAnalyzer } from '../../lib/services/importanceAnalyzer';

console.log('Hana background script loaded');

/**
 * Main message listener
 */
browser.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  // Wrap in async IIFE to use await
  (async () => {
    console.log(`Received message action: ${message.action}`);
    
    switch (message.action) {
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
          // Get the appropriate API client
          const apiClient = getApiClient(message.provider);
          
          // Call the API
          const model = getModelName(message.provider, message.model);
          const isSummary = message.prompt.toLowerCase().includes('summarize');
          console.log(`Calling ${message.provider} API with model ${model}, isSummary: ${isSummary}`);
          
          const response = await apiClient.call(message.prompt, message.pageContent, model, isSummary);
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
        
        try {
          // Acknowledge receipt immediately
          sendResponse({ received: true });
          
          // Get the appropriate API client
          const apiClient = getApiClient(message.provider);
          
          // Check if client supports streaming
          if ('callStreaming' in apiClient) {
            const model = getModelName(message.provider, message.model);
            const isSummary = message.prompt.toLowerCase().includes('summarize');
            console.log(`Starting streaming call to ${message.provider} API with model ${model}`);
            
            // Start streaming
            await (apiClient as any).callStreaming(
              message.prompt, 
              message.pageContent, 
              model, 
              isSummary,
              (chunk: any) => {
                // Send chunk to content script
                browser.tabs.sendMessage(sender.tab?.id || 0, {
                  action: 'streaming-chunk',
                  chunk
                });
              }
            );
            
            // Send completion message
            browser.tabs.sendMessage(sender.tab?.id || 0, {
              action: 'streaming-complete'
            });
          } else {
            // Fallback to regular call
            const model = getModelName(message.provider, message.model);
            const isSummary = message.prompt.toLowerCase().includes('summarize');
            const response = await apiClient.call(message.prompt, message.pageContent, model, isSummary);
            
            browser.tabs.sendMessage(sender.tab?.id || 0, {
              action: 'streaming-complete',
              response
            });
          }
        } catch (error: any) {
          console.error('Error in streaming call:', error);
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

      case 'encrypt-api-key':
        if (!message.apiKey) {
          sendResponse({ error: 'No API key provided' });
        } else {
          try {
            const encryptedKey = await CryptoUtils.encryptApiKey(message.apiKey);
            sendResponse({ encryptedKey });
                     } catch(error: any) {
             console.error('Error encrypting API key:', error);
             sendResponse({ error: true, message: error.message });
           }
        }
        break;

      case 'decrypt-api-key':
        if (!message.encryptedKey) {
          sendResponse({ error: 'No encrypted key provided' });
        } else {
          try {
            const decryptedKey = await CryptoUtils.decryptApiKey(message.encryptedKey);
            sendResponse({ decryptedKey });
                     } catch (error: any) {
             console.error('Error decrypting API key:', error);
             sendResponse({ error: true, message: error.message });
           }
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
        if (RateLimiter.check(3, 60 * 1000)) { // Stricter rate limit for analysis
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
