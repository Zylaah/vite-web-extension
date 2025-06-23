/**
 * Iframe Injector utilities for Hana extension
 * Compatibility layer during architectural transition
 */

export interface InjectionConfig {
  iframeUrl?: string;
  containerId: string;
  settings: any;
  position?: string;
  existingConversation?: any;
}

export interface IframeInstance {
  iframe?: HTMLElement;
  cleanup: () => void;
  remove: () => void;
  sendMessage: (message: any) => void;
}

export class IframeInjector {
  private static instances = new Map<string, IframeInstance>();
  
  static async inject(config: InjectionConfig): Promise<IframeInstance> {
    // For now, this is a compatibility shim
    // The actual overlay creation is handled in OverlayController
    const instance: IframeInstance = {
      cleanup: () => {},
      remove: () => {},
      sendMessage: (message: any) => {
        console.log('IframeInjector message:', message);
      }
    };
    
    return instance;
  }
  
  private static removeInstance(containerId: string): void {
    const instance = this.instances.get(containerId);
    if (instance) {
      instance.cleanup();
      this.instances.delete(containerId);
    }
  }
} 