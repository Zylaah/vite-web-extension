/**
 * Message Bus for Hana extension
 * Based on SolBrowse's MessageBus pattern
 */

type MessageHandler = (data?: any) => void;

export class MessageBus {
  private static handlers = new Map<string, Set<MessageHandler>>();

  static addHandler(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    this.handlers.get(type)!.add(handler);
    
    // Return cleanup function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  static emit(type: string, data?: any): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Hana MessageBus: Error in handler for ${type}:`, error);
        }
      });
    }
  }

  static cleanup(): void {
    this.handlers.clear();
  }

  static getHandlerCount(type?: string): number {
    if (type) {
      return this.handlers.get(type)?.size || 0;
    }
    
    let total = 0;
    this.handlers.forEach(handlerSet => {
      total += handlerSet.size;
    });
    return total;
  }
}

// Global message listener for window messages
window.addEventListener('message', (event) => {
  if (event.data && typeof event.data === 'object' && 'type' in event.data) {
    // Only handle messages that start with 'hana-'
    if (event.data.type && event.data.type.startsWith('hana-')) {
      MessageBus.emit(event.data.type, event.data);
    }
  }
}); 