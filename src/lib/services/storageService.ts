/**
 * Storage service for Hana extension
 */
import browser from 'webextension-polyfill';
import type { AIProvider } from '../types';

/**
 * Interface for settings data
 */
export interface SettingsData {
  selectedProvider: AIProvider;
  qualityPreference: string;
  mistralApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  deepseekApiKey?: string;
}

/**
 * Service for managing extension storage
 */
export const StorageService = {
  /**
   * Gets all settings from storage
   * @returns Promise with settings data
   */
  async getSettings(): Promise<SettingsData> {
    try {
      const result = await browser.storage.local.get([
        'selectedProvider',
        'qualityPreference',
        'mistralApiKey',
        'openaiApiKey',
        'anthropicApiKey',
        'deepseekApiKey'
      ]) as any;
      
      return {
        selectedProvider: result.selectedProvider || 'mistral',
        qualityPreference: result.qualityPreference || 'balanced',
        mistralApiKey: result.mistralApiKey || '',
        openaiApiKey: result.openaiApiKey || '',
        anthropicApiKey: result.anthropicApiKey || '',
        deepseekApiKey: result.deepseekApiKey || ''
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        selectedProvider: 'mistral' as AIProvider,
        qualityPreference: 'balanced',
        mistralApiKey: '',
        openaiApiKey: '',
        anthropicApiKey: '',
        deepseekApiKey: ''
      };
    }
  },

  /**
   * Saves settings to storage
   * @param settings - Settings to save
   * @returns Promise
   */
  async saveSettings(settings: Partial<SettingsData>): Promise<void> {
    try {
      // Trim API keys before saving
      const trimmedSettings = { ...settings };
      if (trimmedSettings.mistralApiKey) {
        trimmedSettings.mistralApiKey = trimmedSettings.mistralApiKey.trim();
      }
      if (trimmedSettings.openaiApiKey) {
        trimmedSettings.openaiApiKey = trimmedSettings.openaiApiKey.trim();
      }
      if (trimmedSettings.anthropicApiKey) {
        trimmedSettings.anthropicApiKey = trimmedSettings.anthropicApiKey.trim();
      }
      if (trimmedSettings.deepseekApiKey) {
        trimmedSettings.deepseekApiKey = trimmedSettings.deepseekApiKey.trim();
      }
      
      await browser.storage.local.set(trimmedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  /**
   * Gets the API key for a specific provider (plain text)
   * @param provider - The AI provider
   * @returns Promise with the API key
   */
  async getApiKey(provider: AIProvider): Promise<string> {
    try {
      const keyName = `${provider}ApiKey`;
      const result = await browser.storage.local.get(keyName) as any;
      return result[keyName] || '';
    } catch (error) {
      console.error(`Error getting API key for ${provider}:`, error);
      return '';
    }
  },

  /**
   * Saves an API key for a specific provider (plain text)
   * @param provider - The AI provider
   * @param apiKey - The API key to save
   * @returns Promise
   */
  async saveApiKey(provider: AIProvider, apiKey: string): Promise<void> {
    try {
      const keyName = `${provider}ApiKey`;
      const trimmedKey = apiKey.trim();
      await browser.storage.local.set({ [keyName]: trimmedKey });
    } catch (error) {
      console.error(`Error saving API key for ${provider}:`, error);
      throw error;
    }
  },

  /**
   * Clears all storage
   * @returns Promise
   */
  async clearAll(): Promise<void> {
    try {
      await browser.storage.local.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}; 