// Type definitions for Hana extension

// API Providers
export type AIProvider = 'mistral' | 'openai' | 'anthropic' | 'deepseek';

// Model quality preferences
export type ModelQuality = 'fast' | 'accurate';

// Model mapping structure
export interface ModelMap {
  [provider: string]: {
    fast: string;
    accurate: string;
  };
}

// User settings
export interface UserSettings {
  mistralApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  deepseekApiKey?: string;
  selectedProvider: AIProvider;
  qualityPreference: ModelQuality;
  darkMode: boolean;
  highlightImportant: boolean;
}

// API Response structure
export interface AIResponse {
  text: string;
  error?: boolean;
  privacyRejected?: boolean;
}

// Stream chunk format
export interface StreamChunk {
  text: string;
  isDone: boolean;
}

// Important text part for highlighting
export interface ImportantTextPart {
  text: string;
  importance: number; // 1 or 2, higher means more important
}

// Privacy status
export interface PrivacyStatus {
  accepted: boolean;
  limited: boolean;
}

// Article link structure
export interface ArticleLink {
  url: string;
  text: string;
  favicon?: string;
  domain?: string;
}

// Message for background communication
export interface BackgroundMessage {
  action: string;
  [key: string]: any;
} 