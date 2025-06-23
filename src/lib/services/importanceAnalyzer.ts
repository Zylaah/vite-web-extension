/**
 * Service for analyzing important parts of text
 */
import { createImportanceAnalysisPrompt } from '../config/prompts';
import { getApiClient } from '../api/apiFactory';
import { StorageService } from './storageService';
import type { ImportantTextPart } from '../types';

/**
 * Service for analyzing important parts of text
 */
export const ImportanceAnalyzer = {
  /**
   * Analyzes text to find important parts
   * @param text - The text to analyze
   * @returns Promise with the important parts
   */
  async analyze(text: string): Promise<ImportantTextPart[]> {
    try {
      // Highlighting is always enabled in simplified version
      
      // Get the selected provider
      const settings = await StorageService.getSettings();
      const provider = settings.selectedProvider;
      
      // Get the API client
      const apiClient = getApiClient(provider);
      
      // Create the prompt
      const prompt = createImportanceAnalysisPrompt(text);
      
      // Call the API
      console.log('Analyzing text importance...');
      const response = await apiClient.call(prompt, '', undefined, false);
      
      if (response.error) {
        console.error('Error analyzing importance:', response.text);
        return [];
      }
      
      // Parse the response
      try {
        // Extract JSON from the response
        const jsonMatch = response.text.match(/\[\s*\{.*\}\s*\]/s);
        const jsonStr = jsonMatch ? jsonMatch[0] : response.text;
        
        // Parse the JSON
        const importantParts = JSON.parse(jsonStr) as ImportantTextPart[];
        
        // Validate the response
        if (!Array.isArray(importantParts)) {
          throw new Error('Invalid response format: not an array');
        }
        
        // Filter valid parts
        return importantParts.filter(part => 
          part && 
          typeof part.text === 'string' && 
          typeof part.importance === 'number' &&
          part.text.length > 0
        );
      } catch (error) {
        console.error('Error parsing importance analysis response:', error);
        return [];
      }
    } catch (error) {
      console.error('Error analyzing importance:', error);
      return [];
    }
  }
}; 