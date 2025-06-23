/**
 * Mistral API client implementation
 */
import { StreamingApiClient } from './streamingApiClient';
import type { AIResponse, StreamChunk } from '../types';

/**
 * Client for Mistral AI API
 */
export class MistralApiClient extends StreamingApiClient {
  constructor() {
    super('mistral');
  }
  
  /**
   * Calls the Mistral API
   * @param prompt - The user prompt
   * @param content - The page content
   * @param model - The model to use (defaults to mistral-large-latest)
   * @param isSummary - Whether this is a summary request
   * @param language - The response language
   * @returns Promise with the API response
   */
  async call(prompt: string, content: string, model = 'mistral-large-latest', isSummary = false, language: 'english' | 'french' = 'english'): Promise<AIResponse> {
    try {
      const apiKey = await this.getApiKey();
      const systemPrompt = this.prepareSystemPrompt(content, isSummary, language);
      
      // Prepare the API request
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
  
  /**
   * Calls the Mistral API with streaming
   * @param prompt - The user prompt
   * @param content - The page content
   * @param model - The model to use (defaults to mistral-large-latest)
   * @param isSummary - Whether this is a summary request
   * @param language - The response language
   * @param onChunk - Callback for each streaming chunk
   * @returns Promise with the AI response
   */
  async callStreaming(
    prompt: string, 
    content: string, 
    model = 'mistral-large-latest', 
    isSummary = false,
    language: 'english' | 'french' = 'english',
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<AIResponse> {
    try {
      const apiKey = await this.getApiKey();
      const systemPrompt = this.prepareSystemPrompt(content, isSummary, language);
      
      // Prepare the API request with streaming
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
          max_tokens: 1024,
          stream: true
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
      
      // Process streaming response
      const text = await this.processStreamingResponse(response, onChunk);
      return { text };
    } catch (error) {
      const errorMessage = this.handleError(error);
      return { text: errorMessage, error: true };
    }
  }
  
  /**
   * Extracts delta text from a streaming response chunk
   * @param parsed - The parsed JSON chunk
   * @returns The delta text or null
   */
  protected extractDeltaText(parsed: any): string | null {
    return parsed.choices?.[0]?.delta?.content || null;
  }
}

// Export singleton instance
export const MistralAPI = new MistralApiClient(); 