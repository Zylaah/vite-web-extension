/**
 * Streaming API client for real-time responses
 */
import { BaseApiClient } from './baseApiClient';
import type { AIResponse, StreamChunk } from '../types';

/**
 * Base class for streaming API clients
 */
export abstract class StreamingApiClient extends BaseApiClient {
  /**
   * Calls the API with streaming enabled
   * @param prompt - The user prompt
   * @param content - The page content
   * @param model - The model to use
   * @param isSummary - Whether this is a summary request
   * @param language - The response language
   * @param onChunk - Callback for each streaming chunk
   * @returns Promise with the final response
   */
  abstract callStreaming(
    prompt: string, 
    content: string, 
    model?: string, 
    isSummary?: boolean,
    language?: 'english' | 'french',
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<AIResponse>;
  
  /**
   * Processes a streaming response
   * @param response - The fetch response
   * @param onChunk - Callback for each chunk
   * @returns Promise with the final text
   */
  protected async processStreamingResponse(
    response: Response,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available for streaming');
    }
    
    const decoder = new TextDecoder();
    let fullText = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Send final chunk
          if (onChunk) {
            onChunk({ text: fullText, isDone: true });
          }
          break;
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            // Skip if it's [DONE]
            if (data.trim() === '[DONE]') {
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              const deltaText = this.extractDeltaText(parsed);
              
              if (deltaText) {
                fullText += deltaText;
                
                // Send chunk update
                if (onChunk) {
                  onChunk({ text: fullText, isDone: false });
                }
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.warn('Failed to parse streaming chunk:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    return fullText;
  }
  
  /**
   * Extracts delta text from a streaming response chunk
   * @param parsed - The parsed JSON chunk
   * @returns The delta text or null
   */
  protected abstract extractDeltaText(parsed: any): string | null;
} 