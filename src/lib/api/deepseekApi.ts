/**
 * DeepSeek API client implementation
 */
import { BaseApiClient } from './baseApiClient';
import type { AIResponse } from '../types';

/**
 * Client for DeepSeek API
 */
export class DeepSeekApiClient extends BaseApiClient {
  constructor() {
    super('deepseek');
  }
  
  /**
   * Calls the DeepSeek API
   * @param prompt - The user prompt
   * @param content - The page content
   * @param model - The model to use (defaults to deepseek-chat)
   * @param isSummary - Whether this is a summary request
   * @returns Promise with the API response
   */
  async call(prompt: string, content: string, model = 'deepseek-chat', isSummary = false): Promise<AIResponse> {
    try {
      const apiKey = await this.getApiKey();
      const systemPrompt = this.prepareSystemPrompt(content, isSummary);
      
      // Prepare the API request
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
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
      const text = data.choices[0]?.message?.content || '';
      
      return { text };
    } catch (error) {
      const errorMessage = this.handleError(error);
      return { text: errorMessage, error: true };
    }
  }
}

// Export singleton instance
export const DeepSeekAPI = new DeepSeekApiClient(); 