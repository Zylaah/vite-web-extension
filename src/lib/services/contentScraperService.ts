import TurndownService from 'turndown';

export interface ScrapedContent {
  text: string;
  markdown: string;
  title: string;
  excerpt: string;
  metadata: {
    hostname: string;
    url: string;
    title: string;
    contentLength: number;
    wordCount: number;
    readingTimeMinutes: number;
    hasContent: boolean;
    extractionMethod: string;
    isArticle: boolean;
  };
}

export class ContentScraperService {
  private static instance: ContentScraperService;
  private turndownService: TurndownService;

  private constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',           // # ## ### style headers
      hr: '---',                     // Horizontal rules
      bulletListMarker: '-',         // Use - for bullets
      codeBlockStyle: 'fenced',      // Use ``` code blocks
      emDelimiter: '*',              // Use * for emphasis
      strongDelimiter: '**',         // Use ** for bold
      linkStyle: 'inlined'           // Inline links
    });

    // Configure for LLM-friendly output
    this.turndownService.remove(['script', 'style', 'nav', 'footer', 'aside']);
    
    // Handle images better
    this.turndownService.addRule('images', {
      filter: 'img',
      replacement: (_content: any, node: any) => {
        const img = node as HTMLImageElement;
        const alt = img.alt || '';
        const src = img.src || '';
        return alt ? `![${alt}](${src})` : '';
      }
    });

    // Handle links to preserve them properly
    this.turndownService.addRule('links', {
      filter: 'a',
      replacement: (content: string, node: any) => {
        const href = (node as HTMLAnchorElement).getAttribute('href') || '';
        const title = (node as HTMLAnchorElement).getAttribute('title');
        const titlePart = title ? ` "${title}"` : '';
        return href ? `[${content}](${href}${titlePart})` : content;
      }
    });
  }

  public static getInstance(): ContentScraperService {
    if (!ContentScraperService.instance) {
      ContentScraperService.instance = new ContentScraperService();
    }
    return ContentScraperService.instance;
  }

  /**
   * Convert HTML content to markdown
   */
  public htmlToMarkdown(html: string): string {
    return this.turndownService.turndown(html);
  }

  /**
   * Calculate reading time based on word count
   */
  private calculateReadingTime(wordCount: number): number {
    return Math.max(1, Math.ceil(wordCount / 200)); // Average reading speed: 200 words per minute
  }

  /**
   * Calculate a simple readability score
   */
  private calculateReadabilityScore(text: string): number {
    if (!text || text.length < 100) return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    // Simple Flesch Reading Ease approximation
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    return Math.max(0, Math.min(100, 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgWordLength / 2)));
  }

  /**
   * Process HTML content and convert to structured markdown
   */
  public processHtmlContent(htmlContent: string, url?: string): ScrapedContent {
    // Create a temporary DOM element to work with
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'footer', 'aside', 'header',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      '.ad', '.advertisement', '.social', '.share', '.comments',
      '.sidebar', '.widget', '.popup', '.modal', '.cookies',
      '.newsletter', '.subscription', '.promo', '.banner'
    ];

    unwantedSelectors.forEach(selector => {
      tempDiv.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Extract text and convert to markdown
    const text = tempDiv.textContent || '';
    const markdown = this.htmlToMarkdown(tempDiv.innerHTML);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    return {
      text: text.trim(),
      markdown: markdown.trim(),
      title: document.title || '',
      excerpt: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
      metadata: {
        hostname: url ? new URL(url).hostname : window.location.hostname,
        url: url || window.location.href,
        title: document.title || '',
        contentLength: text.length,
        wordCount: words.length,
        readingTimeMinutes: this.calculateReadingTime(words.length),
        hasContent: text.length > 100,
        extractionMethod: 'html-to-markdown',
        isArticle: words.length > 300 && this.calculateReadabilityScore(text) > 30,
      }
    };
  }

  /**
   * Process the current page content and convert to markdown
   */
  public processCurrentPage(): ScrapedContent {
    // Clone the document to avoid mutations
    const doc = document.cloneNode(true) as Document;
    
    // Remove extension elements and unwanted content
    const unwantedSelectors = [
      'script', 'style', 'nav', 'footer', 'aside',
      '[data-hana-extension]', '[id*="hana-"]', '[class*="hana-"]',
      '.ad', '.advertisement', '.social', '.share', '.comments'
    ];

    unwantedSelectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Focus on main content areas
    const contentSelectors = ['main', 'article', '.content', '.post', '[role="main"]'];
    let contentElement = doc.body;

    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent && element.textContent.length > 200) {
        contentElement = element as HTMLElement;
        break;
      }
    }

    const text = contentElement.textContent || '';
    const markdown = this.htmlToMarkdown(contentElement.innerHTML || '');
    const words = text.split(/\s+/).filter(w => w.length > 0);

    return {
      text: text.trim(),
      markdown: markdown.trim(),
      title: document.title || '',
      excerpt: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
      metadata: {
        hostname: window.location.hostname,
        url: window.location.href,
        title: document.title || '',
        contentLength: text.length,
        wordCount: words.length,
        readingTimeMinutes: this.calculateReadingTime(words.length),
        hasContent: text.length > 100,
        extractionMethod: 'current-page-markdown',
        isArticle: words.length > 300 && this.calculateReadabilityScore(text) > 30,
      }
    };
  }
}

export default ContentScraperService; 