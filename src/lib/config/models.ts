/**
 * AI model configuration for Hana extension
 */
import type { ModelMap } from '../types';

/**
 * Maps provider and quality preference to specific model names
 */
export const MODEL_MAP: ModelMap = {
  mistral: {
    fast: 'mistral-small-latest',
    accurate: 'mistral-large-latest'
  },
  openai: {
    fast: 'gpt-3.5-turbo',
    accurate: 'gpt-4-turbo'
  },
  anthropic: {
    fast: 'claude-3-haiku-20240307',
    accurate: 'claude-3-opus-20240229'
  },
  deepseek: {
    fast: 'deepseek-chat',
    accurate: 'deepseek-coder'
  }
};

/**
 * Gets the model name for a provider and quality preference
 * @param provider - The AI provider
 * @param qualityPreference - The quality preference
 * @returns The specific model name
 */
export function getModelName(provider: string, qualityPreference: string): string {
  if (!MODEL_MAP[provider]) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  const quality = qualityPreference === 'fast' ? 'fast' : 'accurate';
  return MODEL_MAP[provider][quality];
} 