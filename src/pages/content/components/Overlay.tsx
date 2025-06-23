import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { BackgroundCommunicator } from '../../../lib/services/backgroundCommunicator';
import MessageRenderer from './MessageRenderer';

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
  getPageContent?: () => string;
  getCurrentContent?: () => Promise<string>; // New: async content getter with caching
  getContentForSummary?: () => Promise<string>; // New: optimized for summaries
  existingConversation?: any;
  onConversationUpdate?: (messages: any[], conversationId: string | null) => void;
}

const Overlay: React.FC<OverlayProps> = ({ 
  onClose, 
  pageContent,
  initialMode = 'chat',
  onModeChange,
  getPageContent,
  getCurrentContent,
  getContentForSummary,
  existingConversation,
  onConversationUpdate
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<OverlayMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<OverlaySettings>({
    selectedProvider: 'mistral',
    qualityPreference: 'quality'
  });
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const streamingRootRef = useRef<any>(null);
  
  // Load settings and restore conversation
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
    
    // Schedule conversation restoration after DOM is ready (only in chat mode)
    if (mode === 'chat' && existingConversation && existingConversation.messages && existingConversation.messages.length > 0) {
      setConversationId(existingConversation.conversationId);
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (responseRef.current) {
          // Clear any existing content
          responseRef.current.innerHTML = '';
          
          // Restore messages to DOM
          existingConversation.messages.forEach((msg: any) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `hana-chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;
            
            if (msg.role === 'user') {
              // User messages remain as plain text
              messageDiv.textContent = msg.content;
            } else {
              // AI messages should be rendered as markdown
              const markdownContainer = document.createElement('div');
              markdownContainer.className = 'hana-markdown-content';
              
              // Create a React root and render the markdown
              const root = createRoot(markdownContainer);
              root.render(React.createElement(MessageRenderer, { content: msg.content }));
              
              messageDiv.appendChild(markdownContainer);
            }
            
            responseRef.current!.appendChild(messageDiv);
          });
          
          // Show container and scroll to bottom
          responseRef.current.style.display = 'block';
          responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
      }, 100);
    }
    
    loadSettings();
  }, [existingConversation]);

  // Additional effect to restore conversation when responseRef becomes available (only in chat mode)
  useEffect(() => {
    if (mode === 'chat' && responseRef.current && existingConversation && existingConversation.messages && 
        existingConversation.messages.length > 0 && responseRef.current.children.length === 0) {
      
      // Restore messages to DOM
      existingConversation.messages.forEach((msg: any) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `hana-chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;
        
        if (msg.role === 'user') {
          // User messages remain as plain text
          messageDiv.textContent = msg.content;
        } else {
          // AI messages should be rendered as markdown
          const markdownContainer = document.createElement('div');
          markdownContainer.className = 'hana-markdown-content';
          
          // Create a React root and render the markdown
          const root = createRoot(markdownContainer);
          root.render(React.createElement(MessageRenderer, { content: msg.content }));
          
          messageDiv.appendChild(markdownContainer);
        }
        
        responseRef.current!.appendChild(messageDiv);
      });
      
      // Show container and scroll to bottom
      responseRef.current.style.display = 'block';
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [mode, responseRef.current, existingConversation]);
  
  // Handle mode changes
  useEffect(() => {
    if (onModeChange) {
      onModeChange(mode);
    }
    
    // Clear content when switching modes first - but only when actually switching modes
    if (responseRef.current) {
      // Only clear if we're switching to summary mode, not when just initializing chat mode
      if (mode === 'summary') {
        responseRef.current.innerHTML = '';
      }
    }
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
    
    // Auto-trigger summary when switching to summary mode (delay to ensure DOM is ready)
    if (mode === 'summary' && settings.selectedProvider) {
      setTimeout(() => {
        handleRequest('Please provide a comprehensive summary of this page.');
      }, 100);
    }
    
    // Auto-focus input when switching to chat mode and restore conversation
    if (mode === 'chat') {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // Restore conversation in chat mode after a short delay
      if (existingConversation && existingConversation.messages && existingConversation.messages.length > 0) {
        setTimeout(() => {
          if (responseRef.current && responseRef.current.children.length === 0) {
            // Restore messages to DOM
            existingConversation.messages.forEach((msg: any) => {
              const messageDiv = document.createElement('div');
              messageDiv.className = `hana-chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;
              
              if (msg.role === 'user') {
                // User messages remain as plain text
                messageDiv.textContent = msg.content;
              } else {
                // AI messages should be rendered as markdown
                const markdownContainer = document.createElement('div');
                markdownContainer.className = 'hana-markdown-content';
                
                // Create a React root and render the markdown
                const root = createRoot(markdownContainer);
                root.render(React.createElement(MessageRenderer, { content: msg.content }));
                
                messageDiv.appendChild(markdownContainer);
              }
              
              responseRef.current!.appendChild(messageDiv);
            });
            
            // Show container and scroll to bottom
            responseRef.current.style.display = 'block';
            responseRef.current.scrollTop = responseRef.current.scrollHeight;
          }
        }, 150);
      }
    }
  }, [mode, settings.selectedProvider, settings.qualityPreference, pageContent, onModeChange, existingConversation]);

  // Event handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only handle left clicks
      
      // Only dismiss on click outside in summary mode
      if (mode === 'summary' && overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
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
  }, [onClose, mode]);

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
      if (message.action === 'streaming-chunk' && message.chunk && responseRef.current) {
        // For streaming chunks, check if we're currently streaming
        if (isStreaming) {
          // Find the last streaming response based on mode
          let lastStreamingElement: Element | null = null;
          
          if (mode === 'chat') {
            lastStreamingElement = responseRef.current.querySelector('.hana-chat-message.ai-message:last-child .hana-streaming-response');
          } else {
            lastStreamingElement = responseRef.current.querySelector('.hana-streaming-response:last-child');
          }
          
          if (!lastStreamingElement) {
            // Create new streaming element with React component
            const messageId = `streaming-${Date.now()}`;
            setStreamingMessageId(messageId);
            setStreamingContent(message.chunk.text);
            
            if (mode === 'chat') {
              const aiMessageDiv = document.createElement('div');
              aiMessageDiv.className = 'hana-chat-message ai-message';
              aiMessageDiv.id = messageId;
              
                          // Create a React container for the streaming content
            const reactContainer = document.createElement('div');
            reactContainer.className = 'hana-streaming-response has-markdown';
            aiMessageDiv.appendChild(reactContainer);
            
            // Create and store the React root
            const root = createRoot(reactContainer);
            streamingRootRef.current = root;
            root.render(React.createElement(MessageRenderer, { 
              content: message.chunk.text
            }));
              
              responseRef.current.appendChild(aiMessageDiv);
              lastStreamingElement = reactContainer;
            } else {
                          // In summary mode, create direct streaming response
            const streamingDiv = document.createElement('div');
            streamingDiv.className = 'hana-streaming-response has-markdown';
            streamingDiv.id = messageId;
            
            // Create and store the React root
            const root = createRoot(streamingDiv);
            streamingRootRef.current = root;
            root.render(React.createElement(MessageRenderer, { 
              content: message.chunk.text
            }));
              
              responseRef.current.appendChild(streamingDiv);
              lastStreamingElement = streamingDiv;
            }
            setIsLoading(false);
          } else {
            // Update existing streaming message by re-rendering the React component
            setStreamingContent(message.chunk.text);
            
            // Reuse the existing React root for better performance
            if (streamingRootRef.current) {
              streamingRootRef.current.render(React.createElement(MessageRenderer, { 
                content: message.chunk.text
              }));
            }
          }
          
          // Check if this is the final chunk and mark as done to remove cursor
          if (message.chunk.isDone && lastStreamingElement) {
            lastStreamingElement.classList.add('done');
            
            // Final render - cursor will be hidden by CSS
            if (streamingRootRef.current) {
              streamingRootRef.current.render(React.createElement(MessageRenderer, { 
                content: message.chunk.text
              }));
            }
            
            // Clean up streaming state
            setIsStreaming(false);
            setStreamingContent('');
            setStreamingMessageId(null);
            streamingRootRef.current = null;
            saveConversationState();
          }
          
          // Scroll to bottom
          responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
      }
      
      if (message.action === 'streaming-complete') {
        setIsLoading(false);
        setIsStreaming(false);
        
        if (responseRef.current) {
          // Mark the last streaming response as done (removes cursor)
          const lastStreamingResponse = responseRef.current.querySelector('.hana-streaming-response:last-child');
          if (lastStreamingResponse) {
            lastStreamingResponse.classList.add('done');
            
            // Final render is already handled in the chunk processing
            // Just clean up streaming state
            setStreamingContent('');
            setStreamingMessageId(null);
            streamingRootRef.current = null;
          }
          
          // Save conversation state when streaming completes
          saveConversationState();
        }
        
        if (message.response && message.response.error) {
          setError(message.response.text);
        }
      }
      
      if (message.action === 'streaming-error') {
        setError(message.error || 'An error occurred during streaming');
        setIsLoading(false);
        setIsStreaming(false);
      }
    };
    
    browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [isStreaming, mode]);

  const getChatContext = () => {
    if (!responseRef.current || mode !== 'chat') return '';
    
    const messages = responseRef.current.querySelectorAll('.hana-chat-message');
    if (messages.length === 0) return '';
    
    let context = 'PREVIOUS CONVERSATION:\n';
    messages.forEach(msg => {
      if (msg.classList.contains('user-message')) {
        context += `User: ${msg.textContent}\n`;
      } else if (msg.classList.contains('ai-message')) {
        context += `Assistant: ${msg.textContent}\n`;
      }
    });
    context += '\nNEW QUESTION:\n';
    return context;
  };

  const saveConversationState = () => {
    if (!responseRef.current || !onConversationUpdate) return;
    
    const messages = responseRef.current.querySelectorAll('.hana-chat-message');
    const conversationMessages = Array.from(messages).map(msg => ({
      role: msg.classList.contains('user-message') ? 'user' : 'assistant',
      content: msg.textContent || '',
      timestamp: Date.now()
    }));
    
    // Generate conversation ID if we don't have one
    const currentConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!conversationId) {
      setConversationId(currentConversationId);
    }
    
    onConversationUpdate(conversationMessages, currentConversationId);
  };

  const handleRequest = async (prompt: string) => {
    console.log('🚀 Hana: Starting handleRequest at', Date.now());
    const startTime = Date.now();
    
    if (!responseRef.current) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Add user message to chat in chat mode
    if (mode === 'chat') {
      const userMessageDiv = document.createElement('div');
      userMessageDiv.className = 'hana-chat-message user-message';
      userMessageDiv.textContent = prompt;
      responseRef.current.appendChild(userMessageDiv);
      
      // Scroll to bottom
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
      
      // Save conversation state after adding user message
      saveConversationState();
    }
    
    try {
      setIsStreaming(true);
      
      // Build the final prompt with chat context for follow-up questions
      const chatContext = getChatContext();
      let finalPrompt = chatContext ? `${chatContext}${prompt}` : prompt;
      
      console.log('⏱️ Hana: About to get content at', Date.now() - startTime, 'ms');
      
      // Get current page content with caching optimization
      let currentPageContent: string;
      
      if (mode === 'summary') {
        // For summaries, prefer cached content for speed and use optimized prompt
        if (getContentForSummary) {
          console.log('📄 Hana: Getting content for summary...');
          currentPageContent = await getContentForSummary();
          console.log('✅ Hana: Got content for summary at', Date.now() - startTime, 'ms, length:', currentPageContent.length);
        } else if (getPageContent) {
          console.log('📄 Hana: Fallback to sync getPageContent...');
          currentPageContent = getPageContent();
          console.log('✅ Hana: Got sync content at', Date.now() - startTime, 'ms, length:', currentPageContent.length);
        } else {
          console.log('📄 Hana: Using provided pageContent...');
          currentPageContent = pageContent;
        }
        
        // Use optimized summary prompt
        if (prompt.toLowerCase().includes('summary') || prompt.toLowerCase().includes('summarize')) {
          finalPrompt = 'Summarize this page content in a SHORT and CONCISE way. Focus ONLY on the 2-3 most important points. Use bullet points (•) for each key point. Maximum 3 bullet points. Each bullet point should be 1-2 sentences maximum. No introductory text, start directly with bullet points. No line breaks within bullet points - keep each point on a single line. Be factual and objective.';
        }
      } else {
        // For chat, use regular content getter which may use cache or fresh content
        if (getCurrentContent) {
          console.log('📄 Hana: Getting current content...');
          currentPageContent = await getCurrentContent();
          console.log('✅ Hana: Got current content at', Date.now() - startTime, 'ms, length:', currentPageContent.length);
        } else if (getPageContent) {
          console.log('📄 Hana: Fallback to sync getPageContent...');
          currentPageContent = getPageContent();
          console.log('✅ Hana: Got sync content at', Date.now() - startTime, 'ms, length:', currentPageContent.length);
        } else {
          console.log('📄 Hana: Using provided pageContent...');
          currentPageContent = pageContent;
        }
      }
      
      console.log('🔌 Hana: About to call API at', Date.now() - startTime, 'ms');
      
      const result = await BackgroundCommunicator.queryAIStreaming({
        prompt: finalPrompt,
        provider: settings.selectedProvider,
        model: settings.qualityPreference,
        pageContent: currentPageContent
      });
      
      console.log('📡 Hana: API call returned at', Date.now() - startTime, 'ms, received:', result.received);
      
      if (!result.received) {
        setError('Failed to start streaming request');
        setIsLoading(false);
        setIsStreaming(false);
      }
    } catch (e: any) {
      console.error('❌ Hana: Error at', Date.now() - startTime, 'ms:', e);
      setError(e.message || 'An error occurred while processing your request');
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const prompt = formData.get('query') as string;
    
    if (!prompt?.trim()) return;
    
    await handleRequest(prompt);
    
    // Clear input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const hasMessages = responseRef.current?.children.length ? responseRef.current.children.length > 0 : false;
  const inputPlaceholder = mode === 'chat' && hasMessages ? 'Ask a follow-up...' : 'Ask about this page...';
  
  // In summary mode, always show container when there's content, loading, or error
  // In chat mode, show container when there are messages, loading, or error
  const shouldShowContainer = mode === 'summary' ? (hasMessages || isLoading || error || isStreaming) : (hasMessages || isLoading || error);
  


  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10000000000 }}>
      <div 
        ref={overlayRef}
        className={`hana-overlay ${mode === 'summary' ? 'summary-mode' : 'chat-mode'} ${hasMessages ? 'has-messages' : ''}`}
      >
        {/* Summary topbar - only shown in summary mode, no close button */}
        {mode === 'summary' && (
          <div className="hana-summary-topbar">
            <h3 className="hana-summary-title">
              AI Response
            </h3>
          </div>
        )}

                 {/* Single response container - handles both chat history and summary */}
         <div 
           ref={responseRef}
           className="hana-response-container"
           style={{ 
             display: shouldShowContainer ? 'block' : 'none',
             maxHeight: mode === 'chat' ? '305px' : 'auto',
             overflowY: mode === 'chat' ? 'auto' : 'visible'
           }}
                  >
           {error && (
            <div className="hana-error">
              {error}
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
              placeholder={inputPlaceholder}
              className="hana-input-field"
              disabled={isLoading}
            />
            
            <div className="hana-button-group">
              <button
                type="submit"
                disabled={isLoading}
                className="hana-submit-button"
              >
                <span>Ask</span>
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="hana-close-button-chat"
                title="Close chat"
              >
                <svg style={{ width: '18px', height: '18px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Overlay; 