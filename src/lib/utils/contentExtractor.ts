/**
 * Content extraction utilities for Hana extension
 */
import { Readability } from '@mozilla/readability';
import { decodeHTMLEntities } from './domUtils';

/**
 * Extracts clean, readable content from a webpage
 * @returns The extracted page content as plain text
 */
export function getPageContent(): string {
  const startTime = Date.now();
  console.log('📖 ContentExtractor: Starting extraction');
  
  try {
    // Check if we can use cached result from window
    if ((window as any).hanaPageContentCache && (window as any).hanaPageContentTimestamp) {
      const age = Date.now() - (window as any).hanaPageContentTimestamp;
      if (age < 30000) { // Use cache for 30 seconds
        console.log('⚡ ContentExtractor: Using cached result in', Date.now() - startTime, 'ms');
        return (window as any).hanaPageContentCache;
      }
    }
    
    console.log('🔄 ContentExtractor: Starting Readability parsing');
    
    // Clone the document to avoid modifying the original
    const documentClone = document.cloneNode(true) as Document;
    
    // Create a new Readability object with the cloned document
    const reader = new Readability(documentClone);
    
    // Parse the document
    const article = reader.parse();
    
    console.log('✅ ContentExtractor: Readability parsing completed in', Date.now() - startTime, 'ms');
    
    let result: string;
    if (article && article.textContent) {
      // Clean up the text content
      result = cleanupContent(article.textContent);
    } else {
      // Fallback to basic extraction if Readability fails
      console.log('⚠️ ContentExtractor: Readability failed, using fallback');
      result = fallbackExtraction();
    }
    
    // Cache the result
    (window as any).hanaPageContentCache = result;
    (window as any).hanaPageContentTimestamp = Date.now();
    
    console.log('🎯 ContentExtractor: Extraction completed in', Date.now() - startTime, 'ms, length:', result.length);
    return result;
  } catch (error) {
    console.error('❌ ContentExtractor: Error in', Date.now() - startTime, 'ms:', error);
    return fallbackExtraction();
  }
}

/**
 * Fallback content extraction when Readability fails
 * @returns Basic extracted content from the page
 */
function fallbackExtraction(): string {
  try {
    // Get all paragraph elements
    const paragraphs = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
    
    // Extract text from elements
    let content = '';
    paragraphs.forEach(p => {
      const text = p.textContent?.trim();
      if (text && text.length > 20) { // Only include substantial paragraphs
        content += text + '\n\n';
      }
    });
    
    if (content.length > 100) {
      return cleanupContent(content);
    }
    
    // If still not enough content, get all text
    return cleanupContent(document.body.innerText);
  } catch (error) {
    console.error('Error in fallback extraction:', error);
    return document.body.innerText || 'Could not extract page content.';
  }
}

/**
 * Cleans up extracted content
 * @param content - Raw extracted content
 * @returns Cleaned content
 */
function cleanupContent(content: string): string {
  if (!content) return '';
  
  // Decode HTML entities
  let cleaned = decodeHTMLEntities(content);
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove very long strings that are likely not text
  cleaned = cleaned.replace(/\S{100,}/g, '');
  
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n|\r/g, '\n');
  
  // Remove duplicate line breaks
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return cleaned.trim();
} 