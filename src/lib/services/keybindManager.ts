/**
 * Keybind Manager for Hana extension
 * Simple utility for managing keyboard shortcuts
 */

interface KeybindConfig {
  keybind: string;
  isEnabled: () => boolean;
  isVisible: () => boolean;
  show: () => void;
  hide: () => void;
  log: (message: string) => void;
}

export function attachToggleKeybind(config: KeybindConfig): () => void {
  const { keybind, isEnabled, isVisible, show, hide, log } = config;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isEnabled()) return;
    
    // Parse keybind string (e.g., "Ctrl+F", "Alt+F")
    const parts = keybind.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const needsCtrl = parts.includes('ctrl');
    const needsAlt = parts.includes('alt');
    const needsShift = parts.includes('shift');
    
    const matches = e.key.toLowerCase() === key &&
                   e.ctrlKey === needsCtrl &&
                   e.altKey === needsAlt &&
                   e.shiftKey === needsShift;
    
    if (matches) {
      e.preventDefault();
      e.stopPropagation();
      
      if (isVisible()) {
        log('Hiding overlay via keybind');
        hide();
      } else {
        log('Showing overlay via keybind');
        show();
      }
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
} 