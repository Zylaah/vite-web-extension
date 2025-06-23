import React, { useState, useEffect, useRef } from 'react';
import browser from 'webextension-polyfill';
import { BackgroundCommunicator } from '../../../lib/services/backgroundCommunicator';

// Types for better type safety
type OverlayMode = 'chat' | 'summary';

interface OverlaySettings {
  selectedProvider: string;
  qualityPreference: string;
}

interface OverlayProps {
  onClose: () => void;
  pageContent: string;
  initialMode?: OverlayMode;
  onModeChange?: (mode: OverlayMode) => void;
}

// Custom hook for overlay state management
const useOverlayState = (initialMode: OverlayMode = 'chat') => {
  const [mode, setMode] = useState<OverlayMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const switchMode = (newMode: OverlayMode) => {
    // Clear state when switching modes
    setResponse('');
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
    setMode(newMode);
  };
  
  const resetState = () => {
    setResponse('');
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
  };
  
  return {
    mode,
    isLoading,
    isStreaming,
    response,
    error,
    setIsLoading,
    setIsStreaming,
    setResponse,
    setError,
    switchMode,
    resetState
  };
};

// Custom hook for AI requests
const useAIRequest = (
  setIsLoading: (loading: boolean) => void,
  setIsStreaming: (streaming: boolean) => void,
  setResponse: (response: string) => void,
  setError: (error: string | null) => void
) => {
  const makeRequest = async (prompt: string, pageContent: string, settings: OverlaySettings) => {
    setIsLoading(true);
    setError(null);
    setResponse('');
    
    try {
      setIsStreaming(true);
      const result = await BackgroundCommunicator.queryAIStreaming({
        prompt,
        provider: settings.selectedProvider,
        model: settings.qualityPreference,
        pageContent
      });
      
      if (!result.received) {
        setError('Failed to start streaming request');
        setIsLoading(false);
        setIsStreaming(false);
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred while processing your request');
      setIsLoading(false);
      setIsStreaming(false);
    }
  };
  
  return { makeRequest };
};

const Overlay: React.FC<OverlayProps> = ({ 
  onClose, 
  pageContent,
  initialMode = 'chat',
  onModeChange
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<OverlaySettings>({
    selectedProvider: 'mistral',
    qualityPreference: 'quality'
  });
  
  const {
    mode,
    isLoading,
    isStreaming,
    response,
    error,
    setIsLoading,
    setIsStreaming,
    setResponse,
    setError,
    switchMode,
    resetState
  } = useOverlayState(initialMode);
  
  const { makeRequest } = useAIRequest(setIsLoading, setIsStreaming, setResponse, setError);
  
  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const result = await browser.storage.sync.get([
        'selectedProvider',
        'qualityPreference'
      ]);
      
             setSettings({
         selectedProvider: (result.selectedProvider as string) || 'mistral',
         qualityPreference: (result.qualityPreference as string) || 'quality'
       });
    };
    
    loadSettings();
  }, []);
  
  // Handle mode changes
  useEffect(() => {
    if (onModeChange) {
      onModeChange(mode);
    }
    
    // Auto-trigger summary when switching to summary mode
    if (mode === 'summary' && settings.selectedProvider) {
      makeRequest('Please provide a comprehensive summary of this page.', pageContent, settings);
    }
    
    // Auto-focus input when switching to chat mode
    if (mode === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, settings, pageContent, onModeChange]);

  // Event handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only handle left clicks
      
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleOverlayClick = (event: MouseEvent) => {
      event.stopPropagation();
    };

    const preventBubbling = (event: Event) => {
      event.stopPropagation();
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    if (overlayRef.current) {
      overlayRef.current.addEventListener('mousedown', handleOverlayClick);
      overlayRef.current.addEventListener('keydown', preventBubbling);
      overlayRef.current.addEventListener('keyup', preventBubbling);
      overlayRef.current.addEventListener('keypress', preventBubbling);
      overlayRef.current.addEventListener('input', preventBubbling);
      overlayRef.current.addEventListener('focus', preventBubbling);
      overlayRef.current.addEventListener('blur', preventBubbling);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (overlayRef.current) {
        overlayRef.current.removeEventListener('mousedown', handleOverlayClick);
        overlayRef.current.removeEventListener('keydown', preventBubbling);
        overlayRef.current.removeEventListener('keyup', preventBubbling);
        overlayRef.current.removeEventListener('keypress', preventBubbling);
        overlayRef.current.removeEventListener('input', preventBubbling);
        overlayRef.current.removeEventListener('focus', preventBubbling);
        overlayRef.current.removeEventListener('blur', preventBubbling);
      }
    };
  }, [onClose]);

  // Handle escape key to close (only in chat mode, summary mode needs close button)
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mode === 'chat') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose, mode]);
  
  // Handle streaming messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.action === 'streaming-chunk' && message.chunk) {
        setResponse(message.chunk.text);
      }
      
      if (message.action === 'streaming-complete') {
        setIsLoading(false);
        setIsStreaming(false);
        
        if (message.response) {
          if (message.response.error) {
            setError(message.response.text);
            setResponse('');
          } else {
            setResponse(message.response.text);
          }
        }
      }
      
      if (message.action === 'streaming-error') {
        setError(message.error || 'An error occurred during streaming');
        setIsLoading(false);
        setIsStreaming(false);
        setResponse('');
      }
    };
    
    browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const prompt = formData.get('query') as string;
    
    if (!prompt?.trim()) return;
    
    await makeRequest(prompt, pageContent, settings);
    
    // Clear input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };



  const isShowingResponse = response || isLoading || error;
  const hasMessages = mode === 'chat' && isShowingResponse;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10000000000 }}>
      <div 
        ref={overlayRef}
        className={`hana-overlay ${mode === 'summary' ? 'summary-mode' : 'chat-mode'} ${hasMessages ? 'has-messages' : ''}`}
      >
        {/* Summary topbar - only shown in summary mode */}
        {mode === 'summary' && (
          <div className="hana-summary-topbar">
            <h3 className="hana-summary-title">
              AI Response
            </h3>
            <button
              onClick={onClose}
              className="hana-close-button"
            >
              <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Response container - shown when there's a response, loading, or error */}
        <div 
          className="hana-response-container"
          style={{ display: isShowingResponse ? 'block' : 'none' }}
        >
          {isLoading && (
            <div className="hana-loading">
              <div className="hana-loading-dots">
                {isStreaming ? 'Streaming response...' : 'Thinking...'}
              </div>
            </div>
          )}
          
          {error && (
            <div className="hana-error">
              {error}
            </div>
          )}
          
          {response && (
            <div className={`hana-streaming-response ${!isStreaming ? 'done' : ''}`}>
              {response}
            </div>
          )}
        </div>

        {/* Input container - hidden in summary mode when showing response */}
        {mode === 'chat' && (
          <form onSubmit={handleSubmit} className="hana-input-container">
            <input
              ref={inputRef}
              name="query"
              type="text"
              placeholder="Ask about this page..."
              className="hana-input-field"
              disabled={isLoading}
            />
            
            <button
              type="submit"
              disabled={isLoading}
              className="hana-submit-button"
            >
              <span>Ask</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Overlay; 