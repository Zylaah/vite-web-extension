/**
 * DOM utility functions for Hana extension
 */
import browser from 'webextension-polyfill';

/**
 * Safely decodes HTML entities in a text string
 * @param text - The text to decode
 * @returns The decoded text
 */
export function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param unsafe - The unsafe string that might contain HTML
 * @returns Safely escaped string
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Creates a shadow DOM root for isolated styling
 * @param host - The host element to attach the shadow root to
 * @returns The created shadow root
 */
export function createShadowRoot(host: HTMLElement): ShadowRoot {
  return host.attachShadow({ mode: 'closed' });
}

/**
 * Adds a stylesheet to a shadow root
 * @param shadowRoot - The shadow root to add the stylesheet to
 * @param cssPath - The path to the CSS file
 */
export function addStyleToShadowRoot(shadowRoot: ShadowRoot, cssPath: string): void {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = browser.runtime.getURL(cssPath);
  shadowRoot.appendChild(style);
} 