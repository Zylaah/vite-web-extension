/**
 * Anthropic API client implementation
 */
import { BaseApiClient } from './baseApiClient';
import type { AIResponse } from '../types';

/**
 * Client for Anthropic API
 */
export class AnthropicApiClient extends BaseApiClient {
  constructor() {
    super('anthropic');
  }
  
  /**
   * Calls the Anthropic API
   * @param prompt - The user prompt
   * @param content - The page content
   * @param model - The model to use (defaults to claude-3-opus-20240229)
   * @param isSummary - Whether this is a summary request
   * @returns Promise with the API response
   */
  async call(prompt: string, content: string, model = 'claude-3-opus-20240229', isSummary = false): Promise<AIResponse> {
    try {
      const apiKey = await this.getApiKey();
      const systemPrompt = this.prepareSystemPrompt(content, isSummary);
      
      // Prepare the API request
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          system: systemPrompt,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });
      
      // Check for errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.error?.message || response.statusText
        };
      }
      
      // Parse the response
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      
      return { text };
    } catch (error) {
      const errorMessage = this.handleError(error);
      return { text: errorMessage, error: true };
    }
  }
}

// Export singleton instance
export const AnthropicAPI = new AnthropicApiClient(); 