/**
 * API factory for getting the appropriate API client
 */
import { MistralAPI } from './mistralApi';
import { OpenAIAPI } from './openaiApi';
import { AnthropicAPI } from './anthropicApi';
import { DeepSeekAPI } from './deepseekApi';
import type { AIProvider } from '../types';

/**
 * Gets the appropriate API client based on the provider
 * @param provider - The AI provider
 * @returns The API client
 */
export function getApiClient(provider: AIProvider) {
  switch (provider) {
    case 'mistral':
      return MistralAPI;
    case 'openai':
      return OpenAIAPI;
    case 'anthropic':
      return AnthropicAPI;
    case 'deepseek':
      return DeepSeekAPI;
    default:
      // Default to Mistral
      return MistralAPI;
  }
} 