/**
 * Content Cache Manager with versioning and compression
 * Inspired by SolBrowse TabSnapshotManager
 */

export interface ContentSnapshot {
  tabId: number;
  url: string;
  title: string;
  content: string;
  timestamp: number;
  version: number;
  contentHash: string;
  lastAccessed: number;
  isCompressed: boolean;
  changeType: 'init' | 'mutation' | 'navigation' | 'manual';
  metadata: {
    domain: string;
    contentLength: number;
    originalLength: number;
    compressionRatio: number;
  };
}

export interface CacheOptions {
  maxSnapshotsPerTab: number;
  maxContentLength: number;
  compressionThreshold: number; // Compress content larger than this size
  maxCacheAge: number; // Maximum age in milliseconds
}

export class ContentCacheManager {
  private static instance: ContentCacheManager;
  private snapshots = new Map<number, ContentSnapshot[]>();
  private options: CacheOptions;
  private debug = false;

  private constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      maxSnapshotsPerTab: 5,
      maxContentLength: 500_000, // 500KB
      compressionThreshold: 50_000, // 50KB - increase threshold to avoid compressing smaller content
      maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
      ...options
    };
  }

  static getInstance(options?: Partial<CacheOptions>): ContentCacheManager {
    if (!this.instance) {
      this.instance = new ContentCacheManager(options);
    }
    return this.instance;
  }

  setDebug(enabled: boolean): void {
    this.debug = enabled;
    console.log(`Hana ContentCache: Debug mode ${enabled ? 'ENABLED' : 'disabled'}`);
  }

  /**
   * Add a new content snapshot for a tab
   */
  async addSnapshot(snapshot: Omit<ContentSnapshot, 'timestamp' | 'version' | 'contentHash' | 'lastAccessed' | 'isCompressed' | 'metadata'>): Promise<void> {
    const tabId = snapshot.tabId;
    const originalLength = snapshot.content.length;
    
    // Temporarily disable compression to isolate the issue
    const shouldCompress = false; // originalLength > this.options.compressionThreshold;
    let processedContent = snapshot.content;
    let isCompressed = false;

    if (shouldCompress) {
      try {
        processedContent = await this.compressContent(snapshot.content);
        isCompressed = true;
        if (this.debug) {
          console.log(`Hana ContentCache: Compressed content from ${originalLength} to ${processedContent.length} bytes`);
        }
      } catch (error) {
        console.warn('Hana ContentCache: Compression failed, storing uncompressed:', error);
      }
    }

    if (this.debug) {
      console.log(`Hana ContentCache: Storing content uncompressed, length: ${processedContent.length}`);
    }

    // Truncate if still too large
    if (processedContent.length > this.options.maxContentLength) {
      console.warn(`Hana ContentCache: Content for tab ${tabId} exceeds max length, truncating`);
      processedContent = processedContent.substring(0, this.options.maxContentLength) + '\n\n[Content truncated...]';
    }

    const fullSnapshot: ContentSnapshot = {
      ...snapshot,
      content: processedContent,
      timestamp: Date.now(),
      version: 1,
      contentHash: this.generateContentHash(snapshot.content),
      lastAccessed: Date.now(),
      isCompressed,
      metadata: {
        domain: this.extractDomain(snapshot.url),
        contentLength: processedContent.length,
        originalLength,
        compressionRatio: originalLength > 0 ? processedContent.length / originalLength : 1
      }
    };

    if (this.debug) {
      console.log('Hana ContentCache: Adding snapshot', {
        tabId,
        changeType: snapshot.changeType,
        url: snapshot.url,
        originalLength,
        finalLength: processedContent.length,
        compressed: isCompressed
      });
    }

    if (!this.snapshots.has(tabId)) {
      this.snapshots.set(tabId, []);
    }

    const tabSnapshots = this.snapshots.get(tabId)!;

    // Handle navigation - clear previous snapshots if URL changed
    const lastSnapshot = tabSnapshots[tabSnapshots.length - 1];
    if (lastSnapshot && lastSnapshot.url !== fullSnapshot.url && fullSnapshot.changeType === 'navigation') {
      console.log(`Hana ContentCache: Navigation detected for tab ${tabId}, clearing previous snapshots`);
      tabSnapshots.length = 0;
      fullSnapshot.version = 1;
    } else if (lastSnapshot) {
      // Check if content has actually changed
      if (lastSnapshot.contentHash === fullSnapshot.contentHash) {
        if (this.debug) {
          console.log(`Hana ContentCache: Content unchanged for tab ${tabId}, updating access time only`);
        }
        lastSnapshot.lastAccessed = Date.now();
        return;
      }
      // Increment version for same URL with different content
      fullSnapshot.version = lastSnapshot.version + 1;
    }

    // Add new snapshot
    tabSnapshots.push(fullSnapshot);

    // Maintain size limit
    if (tabSnapshots.length > this.options.maxSnapshotsPerTab) {
      const removed = tabSnapshots.splice(0, tabSnapshots.length - this.options.maxSnapshotsPerTab);
      console.log(`Hana ContentCache: Removed ${removed.length} old snapshots for tab ${tabId}`);
    }

    console.log(`Hana ContentCache: Added snapshot v${fullSnapshot.version} for tab ${tabId} (${tabSnapshots.length}/${this.options.maxSnapshotsPerTab})`);
  }

  /**
   * Get the latest cached content for a tab
   */
  async getLatestContent(tabId: number): Promise<string | null> {
    const snapshot = this.getLatestSnapshot(tabId);
    if (!snapshot) {
      console.log(`Hana ContentCache: No snapshot found for tab ${tabId}`);
      return null;
    }

    console.log(`Hana ContentCache: Retrieved snapshot for tab ${tabId}, compressed: ${snapshot.isCompressed}, length: ${snapshot.content.length}`);

    // Decompress if needed
    if (snapshot.isCompressed) {
      try {
        const decompressed = await this.decompressContent(snapshot.content);
        console.log(`Hana ContentCache: Decompressed content from ${snapshot.content.length} to ${decompressed.length} chars`);
        return decompressed;
      } catch (error) {
        console.error('Hana ContentCache: Failed to decompress content:', error);
        // Fallback: return compressed content (might be readable if simple compression)
        return snapshot.content;
      }
    }

    return snapshot.content;
  }

  /**
   * Get the latest snapshot for a tab
   */
  getLatestSnapshot(tabId: number): ContentSnapshot | null {
    const tabSnapshots = this.snapshots.get(tabId);
    if (!tabSnapshots || tabSnapshots.length === 0) {
      if (this.debug) {
        console.warn(`Hana ContentCache: No snapshot found for tab ${tabId}`);
      }
      return null;
    }

    const latest = tabSnapshots[tabSnapshots.length - 1];
    latest.lastAccessed = Date.now();
    return latest;
  }

  /**
   * Check if cached content exists and is recent enough
   */
  hasRecentContent(tabId: number, maxAge: number = 5 * 60 * 1000): boolean {
    const snapshot = this.getLatestSnapshot(tabId);
    if (!snapshot) {
      return false;
    }

    const age = Date.now() - snapshot.timestamp;
    return age < maxAge;
  }

  /**
   * Clear all snapshots for a tab
   */
  clearTab(tabId: number): void {
    const removed = this.snapshots.delete(tabId);
    if (removed) {
      console.log(`Hana ContentCache: Cleared all snapshots for tab ${tabId}`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalTabs: number;
    totalSnapshots: number;
    totalContentSize: number;
    totalOriginalSize: number;
    avgCompressionRatio: number;
    compressedSnapshots: number;
  } {
    let totalSnapshots = 0;
    let totalContentSize = 0;
    let totalOriginalSize = 0;
    let compressedSnapshots = 0;
    let totalCompressionRatio = 0;

    this.snapshots.forEach(tabSnapshots => {
      totalSnapshots += tabSnapshots.length;
      tabSnapshots.forEach(snapshot => {
        totalContentSize += snapshot.metadata.contentLength;
        totalOriginalSize += snapshot.metadata.originalLength;
        if (snapshot.isCompressed) {
          compressedSnapshots++;
          totalCompressionRatio += snapshot.metadata.compressionRatio;
        }
      });
    });

    return {
      totalTabs: this.snapshots.size,
      totalSnapshots,
      totalContentSize,
      totalOriginalSize,
      avgCompressionRatio: compressedSnapshots > 0 ? totalCompressionRatio / compressedSnapshots : 1,
      compressedSnapshots
    };
  }

  /**
   * Clean up old snapshots
   */
  cleanup(): void {
    const cutoff = Date.now() - this.options.maxCacheAge;
    let totalRemoved = 0;

    this.snapshots.forEach((tabSnapshots, tabId) => {
      const originalLength = tabSnapshots.length;
      
      // Keep at least the latest snapshot, even if it's old
      if (tabSnapshots.length <= 1) return;

      // Remove old snapshots, but keep the latest one
      const filtered = tabSnapshots.filter((snapshot, index) => 
        index === tabSnapshots.length - 1 || snapshot.lastAccessed > cutoff
      );

      if (filtered.length !== originalLength) {
        this.snapshots.set(tabId, filtered);
        totalRemoved += originalLength - filtered.length;
      }
    });

    if (totalRemoved > 0) {
      console.log(`Hana ContentCache: Cleanup removed ${totalRemoved} old snapshots`);
    }
  }

  /**
   * Compress content using LZ-style compression
   */
  private async compressContent(content: string): Promise<string> {
    // Use the Compression Streams API if available
    if ('CompressionStream' in window) {
      try {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        // Convert string to Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(content);

        // Write data and close stream
        writer.write(data);
        writer.close();

        // Read compressed data
        const chunks: Uint8Array[] = [];
        let result;
        while (!(result = await reader.read()).done) {
          chunks.push(result.value);
        }

        // Combine chunks and convert to base64
        const compressedData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressedData.set(chunk, offset);
          offset += chunk.length;
        }

        // Convert to base64 for storage
        return this.arrayBufferToBase64(compressedData);
      } catch (error) {
        console.warn('Hana ContentCache: Native compression failed, using fallback:', error);
      }
    }

    // Fallback to simple compression
    return this.simpleCompress(content);
  }

  /**
   * Decompress content
   */
  private async decompressContent(compressedContent: string): Promise<string> {
    // Try native decompression first
    if ('DecompressionStream' in window) {
      try {
        // Convert base64 to Uint8Array
        const compressedData = this.base64ToArrayBuffer(compressedContent);
        
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        // Write compressed data
        writer.write(compressedData);
        writer.close();

        // Read decompressed data
        const chunks: Uint8Array[] = [];
        let result;
        while (!(result = await reader.read()).done) {
          chunks.push(result.value);
        }

        // Combine chunks and convert to string
        const decompressedData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressedData.set(chunk, offset);
          offset += chunk.length;
        }

        const decoder = new TextDecoder();
        return decoder.decode(decompressedData);
      } catch (error) {
        console.warn('Hana ContentCache: Native decompression failed, using fallback:', error);
      }
    }

    // Fallback to simple decompression
    return this.simpleDecompress(compressedContent);
  }

  /**
   * Simple compression using LZ-like algorithm
   */
  private simpleCompress(str: string): string {
    const dict: Record<string, number> = {};
    const result: (string | number)[] = [];
    let w = '';
    let dictSize = 256;

    for (let i = 0; i < str.length; i++) {
      const c = str.charAt(i);
      const wc = w + c;
      
      if (dict[wc]) {
        w = wc;
      } else {
        result.push(dict[w] !== undefined ? dict[w] : w);
        dict[wc] = dictSize++;
        w = c;
      }
    }
    
    if (w !== '') {
      result.push(dict[w] !== undefined ? dict[w] : w);
    }
    
    return JSON.stringify(result);
  }

  /**
   * Simple decompression
   */
  private simpleDecompress(compressed: string): string {
    try {
      const data = JSON.parse(compressed) as (string | number)[];
      const dict: Record<number, string> = {};
      let w = String(data[0]);
      let result = w;
      let dictSize = 256;

      for (let i = 1; i < data.length; i++) {
        const k = data[i];
        let entry: string;
        
        if (typeof k === 'string') {
          entry = k;
        } else if (dict[k]) {
          entry = dict[k];
        } else if (k === dictSize) {
          entry = w + w.charAt(0);
        } else {
          throw new Error('Invalid compressed data');
        }
        
        result += entry;
        dict[dictSize++] = w + entry.charAt(0);
        w = entry;
      }
      
      return result;
    } catch (error) {
      console.error('Hana ContentCache: Decompression failed:', error);
      return compressed; // Return as-is if decompression fails
    }
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Generate content hash
   */
  private generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }
} 