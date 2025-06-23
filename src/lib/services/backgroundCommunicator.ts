/**
 * Background communication service for Hana extension
 */
import browser from 'webextension-polyfill';
import type { BackgroundMessage, PrivacyStatus, AIResponse, AIProvider, ModelQuality } from '../types';

/**
 * Service for communicating with the background script
 */
export const BackgroundCommunicator = {
  /**
   * Sends a message to the background script
   * @param message - The message to send
   * @returns Promise with the response
   */
  async sendMessage<T = any>(message: BackgroundMessage): Promise<T> {
    try {
      return await browser.runtime.sendMessage(message);
    } catch (error) {
      console.error('Error sending message to background:', error);
      throw error;
    }
  },

  /**
   * Checks the privacy policy acceptance status
   * @returns Promise with the privacy status
   */
  async checkPrivacyStatus(): Promise<PrivacyStatus> {
    try {
      return await this.sendMessage<PrivacyStatus>({
        action: 'check-privacy-policy'
      });
    } catch (error) {
      console.error('Error checking privacy status:', error);
      // Default to limited if there's an error
      return { accepted: false, limited: true };
    }
  },

  /**
   * Accepts the privacy policy
   * @returns Promise with the success status
   */
  async acceptPrivacyPolicy(): Promise<{ success: boolean }> {
    try {
      return await this.sendMessage<{ success: boolean }>({
        action: 'accept-privacy-policy'
      });
    } catch (error) {
      console.error('Error accepting privacy policy:', error);
      return { success: false };
    }
  },

  /**
   * Gets the current keyboard shortcut for the extension
   * @returns Promise with the shortcut information
   */
  async getShortcut(): Promise<{ name: string, shortcut: string }> {
    try {
      return await this.sendMessage<{ name: string, shortcut: string }>({
        action: 'get-shortcut'
      });
    } catch (error) {
      console.error('Error getting shortcut:', error);
      return { name: 'toggle-input', shortcut: 'Alt+F' };
    }
  },
  
  /**
   * Queries the AI with a prompt
   * @param options - The query options
   * @returns Promise with the AI response
   */
  async queryAI(options: {
    prompt: string;
    provider: string | AIProvider;
    model: string | ModelQuality;
    pageContent: string;
    streaming?: boolean;
  }): Promise<AIResponse> {
    try {
      return await this.sendMessage<AIResponse>({
        action: 'query-ai',
        prompt: options.prompt,
        provider: options.provider,
        model: options.model,
        pageContent: options.pageContent,
        streaming: options.streaming || false
      });
    } catch (error) {
      console.error('Error querying AI:', error);
      return { 
        error: true, 
        text: error instanceof Error ? error.message : 'An error occurred while querying the AI'
      };
    }
  },
  
  /**
   * Starts a streaming query to the AI
   * @param options - The query options
   * @returns Promise with acknowledgment (streaming chunks will be sent via tabs.sendMessage)
   */
  async queryAIStreaming(options: {
    prompt: string;
    provider: string | AIProvider;
    model: string | ModelQuality;
    pageContent: string;
  }): Promise<{ received: boolean }> {
    try {
      return await this.sendMessage<{ received: boolean }>({
        action: 'query-ai-streaming',
        prompt: options.prompt,
        provider: options.provider,
        model: options.model,
        pageContent: options.pageContent
      });
    } catch (error) {
      console.error('Error starting streaming query:', error);
      return { received: false };
    }
  },
  
  /**
   * Analyzes the importance of text segments
   * @param text - The text to analyze
   * @returns Promise with acknowledgment (results will be sent via tabs.sendMessage)
   */
  async analyzeImportance(text: string): Promise<{ received: boolean }> {
    try {
      return await this.sendMessage<{ received: boolean }>({
        action: 'analyze-importance',
        text
      });
    } catch (error) {
      console.error('Error analyzing text importance:', error);
      return { received: false };
    }
  }
}; 