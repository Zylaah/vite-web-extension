/**
 * Background script for Hana extension
 */
import browser from 'webextension-polyfill';
import { PrivacyManager } from '../../lib/services/privacyManager';
import { RateLimiter } from '../../lib/utils/rateLimiter';
import { CryptoUtils } from '../../lib/utils/crypto';
import { getModelName } from '../../lib/config/models';

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
        
        // Placeholder for actual API calls
        // In Phase 2, we'll implement the actual API integrations
        sendResponse({ 
          text: `[Placeholder] Response from ${message.provider} using ${getModelName(message.provider, message.model)}. This is a placeholder response that will be replaced with actual API integration in Phase 2.` 
        });
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
