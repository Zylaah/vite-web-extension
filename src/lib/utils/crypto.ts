/**
 * Crypto utilities for Hana extension
 */
import browser from 'webextension-polyfill';

// Salt for encryption (not a security risk as it's just for obfuscation)
const SALT = 'hana-extension-v2';

/**
 * Simple encryption for API keys
 * Note: This is not secure against determined attackers with access to extension code,
 * but provides basic obfuscation to prevent casual viewing of API keys
 */
export const CryptoUtils = {
  /**
   * Encrypts an API key
   * @param apiKey - The API key to encrypt
   * @returns Promise with the encrypted key
   */
  async encryptApiKey(apiKey: string): Promise<string> {
    if (!apiKey) return '';
    
    try {
      // Create a simple XOR-based encryption with extension ID as key
      const extensionId = browser.runtime.id;
      const key = SALT + extensionId;
      
      // Convert strings to array of character codes
      const keyChars = [...key].map(char => char.charCodeAt(0));
      const apiKeyChars = [...apiKey].map(char => char.charCodeAt(0));
      
      // XOR each character with the corresponding key character
      const encryptedChars = apiKeyChars.map((char, i) => {
        const keyChar = keyChars[i % keyChars.length];
        return char ^ keyChar;
      });
      
      // Convert to base64 for storage
      const encryptedBytes = new Uint8Array(encryptedChars);
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedBytes));
      
      return encryptedBase64;
    } catch (error) {
      console.error('Error encrypting API key:', error);
      throw error;
    }
  },
  
  /**
   * Decrypts an API key
   * @param encryptedKey - The encrypted API key
   * @returns Promise with the decrypted key
   */
  async decryptApiKey(encryptedKey: string): Promise<string> {
    if (!encryptedKey) return '';
    
    try {
      // Get the extension ID for the key
      const extensionId = browser.runtime.id;
      const key = SALT + extensionId;
      
      // Convert key to array of character codes
      const keyChars = [...key].map(char => char.charCodeAt(0));
      
      // Decode base64
      const encryptedBytes = Uint8Array.from(atob(encryptedKey), char => char.charCodeAt(0));
      
      // XOR each byte with the corresponding key byte
      const decryptedChars = Array.from(encryptedBytes).map((char, i) => {
        const keyChar = keyChars[i % keyChars.length];
        return char ^ keyChar;
      });
      
      // Convert back to string
      const decryptedKey = String.fromCharCode(...decryptedChars);
      
      return decryptedKey;
    } catch (error) {
      console.error('Error decrypting API key:', error);
      throw error;
    }
  }
}; 