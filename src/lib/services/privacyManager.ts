/**
 * Privacy Manager service for Hana extension
 */
import browser from 'webextension-polyfill';
import type { PrivacyStatus } from '../types';

/**
 * Service for managing privacy policy consent
 */
export const PrivacyManager = {
  /**
   * Checks if the user has accepted the privacy policy
   * @returns Promise with the privacy status
   */
  async getStatus(): Promise<PrivacyStatus> {
    try {
      const data = await browser.storage.local.get('privacyPolicyAccepted');
      const accepted = !!data.privacyPolicyAccepted;
      return {
        accepted,
        limited: !accepted
      };
    } catch (error) {
      console.error('Error checking privacy policy status:', error);
      return { accepted: false, limited: true };
    }
  },

  /**
   * Checks if the extension can run based on privacy policy acceptance
   * @returns Promise with boolean indicating if the extension can run
   */
  async canRun(): Promise<boolean> {
    const status = await this.getStatus();
    return status.accepted;
  },

  /**
   * Marks the privacy policy as accepted
   * @returns Promise that resolves when the privacy policy is accepted
   */
  async acceptPolicy(): Promise<void> {
    try {
      await browser.storage.local.set({ privacyPolicyAccepted: true });
    } catch (error) {
      console.error('Error accepting privacy policy:', error);
      throw error;
    }
  },

  /**
   * Opens the privacy policy page
   * @returns Promise that resolves when the page is opened
   */
  async openPrivacyPolicy(): Promise<void> {
    try {
      await browser.tabs.create({
        url: browser.runtime.getURL('src/pages/options/index.html?section=privacy')
      });
    } catch (error) {
      console.error('Error opening privacy policy:', error);
      throw error;
    }
  }
}; 