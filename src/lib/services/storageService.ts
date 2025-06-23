/**
 * Storage service for Hana extension
 */
import browser from 'webextension-polyfill';
import type { UserSettings, AIProvider, ModelQuality } from '../types';

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  selectedProvider: 'mistral',
  qualityPreference: 'accurate',
  darkMode: false,
  highlightImportant: true
};

/**
 * Service for managing extension storage
 */
export const StorageService = {
  /**
   * Gets all user settings
   * @returns Promise with the user settings
   */
  async getSettings(): Promise<UserSettings> {
    try {
      const data = await browser.storage.local.get(null);
      return { ...DEFAULT_SETTINGS, ...data };
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Updates user settings
   * @param settings - Partial settings to update
   * @returns Promise that resolves when settings are saved
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      await browser.storage.local.set(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  /**
   * Gets the API key for a specific provider
   * @param provider - The AI provider
   * @returns Promise with the API key or undefined
   */
  async getApiKey(provider: AIProvider): Promise<string | undefined> {
    try {
      const keyName = `${provider}ApiKey`;
      const data = await browser.storage.local.get(keyName);
      return data[keyName] as string | undefined;
    } catch (error) {
      console.error(`Error getting API key for ${provider}:`, error);
      return undefined;
    }
  },

  /**
   * Sets the API key for a specific provider
   * @param provider - The AI provider
   * @param apiKey - The API key to save
   * @returns Promise that resolves when the API key is saved
   */
  async setApiKey(provider: AIProvider, apiKey: string): Promise<void> {
    try {
      const keyName = `${provider}ApiKey`;
      await browser.storage.local.set({ [keyName]: apiKey });
    } catch (error) {
      console.error(`Error setting API key for ${provider}:`, error);
      throw error;
    }
  },

  /**
   * Gets the selected AI provider
   * @returns Promise with the selected provider
   */
  async getSelectedProvider(): Promise<AIProvider> {
    try {
      const data = await browser.storage.local.get('selectedProvider');
      return (data.selectedProvider as AIProvider) || DEFAULT_SETTINGS.selectedProvider;
    } catch (error) {
      console.error('Error getting selected provider:', error);
      return DEFAULT_SETTINGS.selectedProvider;
    }
  },

  /**
   * Gets the quality preference
   * @returns Promise with the quality preference
   */
  async getQualityPreference(): Promise<ModelQuality> {
    try {
      const data = await browser.storage.local.get('qualityPreference');
      return (data.qualityPreference as ModelQuality) || DEFAULT_SETTINGS.qualityPreference;
    } catch (error) {
      console.error('Error getting quality preference:', error);
      return DEFAULT_SETTINGS.qualityPreference;
    }
  },

  /**
   * Gets the dark mode preference
   * @returns Promise with the dark mode preference
   */
  async getDarkMode(): Promise<boolean> {
    try {
      const data = await browser.storage.local.get('darkMode');
      return typeof data.darkMode === 'boolean' ? data.darkMode : DEFAULT_SETTINGS.darkMode;
    } catch (error) {
      console.error('Error getting dark mode preference:', error);
      return DEFAULT_SETTINGS.darkMode;
    }
  }
}; 