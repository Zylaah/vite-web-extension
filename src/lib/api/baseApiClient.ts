/**
 * Base API client for AI providers
 */
import { StorageService } from '../services/storageService';
import { createQuestionPrompt, createSummaryPrompt } from '../config/prompts';
import type { AIProvider } from '../types';

/**
 * Base class for all API clients
 */
export abstract class BaseApiClient {
  protected provider: AIProvider;
  
  constructor(provider: AIProvider) {
    this.provider = provider;
  }
  
  /**
   * Gets the API key for the provider
   * @returns Promise with the API key
   * @throws Error if API key is not found
   */
  protected async getApiKey(): Promise<string> {
    const apiKey = await StorageService.getApiKey(this.provider);
    if (!apiKey) {
      throw new Error(`API key for ${this.provider} not found. Please add your API key in the options page.`);
    }
    return apiKey;
  }
  
  /**
   * Calls the API with a prompt and content
   * @param prompt - The user prompt
   * @param content - The page content
   * @param model - The model to use
   * @param isSummary - Whether this is a summary request
   * @returns Promise with the API response
   */
  abstract call(prompt: string, content: string, model?: string, isSummary?: boolean): Promise<any>;
  
  /**
   * Prepares the system prompt
   * @param content - The page content
   * @param isSummary - Whether this is a summary request
   * @returns The system prompt
   */
  protected prepareSystemPrompt(content: string, isSummary = false): string {
    return isSummary 
      ? createSummaryPrompt(content)
      : createQuestionPrompt(content);
  }
  
  /**
   * Handles API errors
   * @param error - The error object
   * @returns Error message
   */
  protected handleError(error: any): string {
    console.error(`${this.provider} API error:`, error);
    
    // Check for common API errors
    if (error.status === 401 || error.status === 403) {
      return `Authentication error: Please check your ${this.provider} API key.`;
    }
    
    if (error.status === 429) {
      return `Rate limit exceeded for ${this.provider} API. Please try again later.`;
    }
    
    if (error.status >= 500) {
      return `${this.provider} API server error. Please try again later.`;
    }
    
    return error.message || `An error occurred while communicating with the ${this.provider} API.`;
  }
} 