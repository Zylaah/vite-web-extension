/**
 * Service for highlighting important text on the page
 */
import { ImportantTextPart } from '../types';

/**
 * Service for highlighting important text on the page
 */
export const HighlightService = {
  /**
   * Highlights important text on the page
   * @param importantParts - Array of important text parts
   * @param shadowRoot - The shadow root to add the highlights to
   */
  highlightImportantText(importantParts: ImportantTextPart[], shadowRoot: ShadowRoot): void {
    if (!importantParts || importantParts.length === 0) {
      console.log('No important parts to highlight');
      return;
    }
    
    console.log(`Highlighting ${importantParts.length} important parts`);
    
    try {
      // Create highlight container if it doesn't exist
      let highlightContainer = shadowRoot.getElementById('hana-highlights');
      if (!highlightContainer) {
        highlightContainer = document.createElement('div');
        highlightContainer.id = 'hana-highlights';
        highlightContainer.style.position = 'absolute';
        highlightContainer.style.top = '0';
        highlightContainer.style.left = '0';
        highlightContainer.style.pointerEvents = 'none';
        highlightContainer.style.zIndex = '2147483646'; // Just below the overlay
        shadowRoot.appendChild(highlightContainer);
      } else {
        // Clear existing highlights
        highlightContainer.innerHTML = '';
      }
      
      // Create highlights for each important part
      importantParts.forEach(part => {
        this.createHighlightForText(part.text, part.importance, highlightContainer!);
      });
    } catch (error) {
      console.error('Error highlighting important text:', error);
    }
  },
  
  /**
   * Creates a highlight for a specific text
   * @param text - The text to highlight
   * @param importance - The importance level (1 or 2)
   * @param container - The container to add the highlight to
   */
  createHighlightForText(text: string, importance: number, container: HTMLElement): void {
    // Find all instances of the text in the document
    const instances = this.findTextInstances(text);
    
    // Create highlight for each instance
    instances.forEach(instance => {
      const { node, startOffset, endOffset } = instance;
      
      // Get the node's position
      const range = document.createRange();
      range.setStart(node, startOffset);
      range.setEnd(node, endOffset);
      
      const rect = range.getBoundingClientRect();
      
      // Create highlight element
      const highlight = document.createElement('div');
      highlight.className = `hana-highlight importance-${importance}`;
      highlight.style.position = 'absolute';
      highlight.style.left = `${rect.left + window.scrollX}px`;
      highlight.style.top = `${rect.top + window.scrollY}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
      highlight.style.backgroundColor = importance === 2 ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 0, 0.2)';
      highlight.style.pointerEvents = 'none';
      highlight.style.zIndex = '2147483646';
      
      // Add to container
      container.appendChild(highlight);
    });
  },
  
  /**
   * Finds all instances of a text in the document
   * @param searchText - The text to find
   * @returns Array of text instances with node and offset information
   */
  findTextInstances(searchText: string): Array<{
    node: Text,
    startOffset: number,
    endOffset: number
  }> {
    const results: Array<{
      node: Text,
      startOffset: number,
      endOffset: number
    }> = [];
    
    // Skip if text is too short
    if (searchText.length < 5) {
      return results;
    }
    
    // Function to search text nodes
    const searchNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const content = textNode.textContent || '';
        let index = content.indexOf(searchText);
        
        // Find all occurrences in this text node
        while (index !== -1) {
          results.push({
            node: textNode,
            startOffset: index,
            endOffset: index + searchText.length
          });
          
          index = content.indexOf(searchText, index + 1);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip hidden elements and our own elements
        const element = node as HTMLElement;
        if (
          element.style.display === 'none' ||
          element.style.visibility === 'hidden' ||
          element.id === 'hana-extension-container' ||
          element.tagName === 'SCRIPT' ||
          element.tagName === 'STYLE'
        ) {
          return;
        }
        
        // Search child nodes
        for (let i = 0; i < node.childNodes.length; i++) {
          searchNode(node.childNodes[i]);
        }
      }
    };
    
    // Start search from body
    searchNode(document.body);
    
    return results;
  },
  
  /**
   * Removes all highlights
   * @param shadowRoot - The shadow root containing the highlights
   */
  removeHighlights(shadowRoot: ShadowRoot): void {
    const highlightContainer = shadowRoot.getElementById('hana-highlights');
    if (highlightContainer) {
      highlightContainer.innerHTML = '';
    }
  }
}; 