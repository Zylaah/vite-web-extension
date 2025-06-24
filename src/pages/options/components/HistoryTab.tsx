import React, { useState, useEffect } from 'react';
import { StorageService, ConversationHistory } from '../../../lib/services/storageService';
import { ExpandIcon, CollapseIcon, CopyIcon, TrashIcon } from '../../../components/Icons';

interface HistoryTabProps {
  // No props needed for now
}

export const HistoryTab: React.FC<HistoryTabProps> = () => {
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const history = await StorageService.getConversationHistory();
      setConversations(history);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await StorageService.deleteConversationHistory(id);
      await loadConversations(); // Reload the list
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleDeleteAllConversations = async () => {
    if (!confirm('Are you sure you want to delete ALL conversation history? This action cannot be undone.')) {
      return;
    }

    try {
      await StorageService.deleteAllConversationHistory();
      await loadConversations(); // Reload the list
    } catch (error) {
      console.error('Failed to delete all conversations:', error);
      alert('Failed to delete conversations. Please try again.');
    }
  };

  const handleCopyConversation = (conversation: ConversationHistory) => {
    const conversationText = formatConversationForCopy(conversation);
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(conversationText).then(() => {
        alert('Conversation copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        fallbackCopyToClipboard(conversationText);
      });
    } else {
      // Fallback for older browsers
      fallbackCopyToClipboard(conversationText);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      alert('Conversation copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy conversation:', err);
      alert('Failed to copy conversation. Please try manually selecting and copying the text.');
    }
    
    document.body.removeChild(textArea);
  };

  const formatConversationForCopy = (conversation: ConversationHistory): string => {
    const formattedDate = new Date(conversation.date).toLocaleString();
    let result = `=== ${conversation.title} ===\n`;
    result += `Date: ${formattedDate}\n`;
    result += `URL: ${conversation.url}\n\n`;
    
    conversation.messages.forEach((message, index) => {
      const messageDate = new Date(message.timestamp).toLocaleTimeString();
      const role = message.type === 'user' ? 'You' : 'AI';
      result += `[${messageDate}] ${role}:\n${message.content}\n\n`;
    });
    
    return result;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpanded = (conversationId: string) => {
    setExpandedConversation(prev => prev === conversationId ? null : conversationId);
  };

  const formatMessageContent = (content: string): string => {
    // Truncate very long messages for preview
    if (content.length > 200) {
      return content.substring(0, 200) + '...';
    }
    return content;
  };

  if (loading) {
    return (
      <div className="history-tab">
        <div className="loading">Loading conversation history...</div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--container-bg)',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: 'var(--card-shadow)',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          margin: '0 0 12px 0',
          color: 'var(--text-color)'
        }}>
          Conversation History
        </h2>
        <p style={{
          fontSize: '16px',
          color: 'var(--secondary-text)',
          margin: '0',
          lineHeight: '1.6'
        }}>
          Your conversation history is automatically saved when you close the chat overlay. 
          Here you can view, copy, or delete your past conversations.
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '16px',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-color)',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button
          onClick={handleDeleteAllConversations}
          disabled={conversations.length === 0}
          style={{
            padding: '12px 20px',
            backgroundColor: conversations.length === 0 ? 'var(--border-color)' : 'var(--error-color)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: conversations.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          Delete All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredConversations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--secondary-text)',
            fontSize: '16px',
            backgroundColor: 'var(--subtle-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            {searchTerm ? 'No conversations match your search.' : 'No conversation history yet. Start chatting to see your conversations here!'}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div key={conversation.id} style={{
              backgroundColor: 'var(--subtle-bg)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px',
                gap: '16px'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    color: 'var(--text-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {conversation.title}
                  </h4>
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '14px',
                    color: 'var(--secondary-text)',
                    flexWrap: 'wrap'
                  }}>
                    <span>
                      {new Date(conversation.date).toLocaleDateString()} {new Date(conversation.date).toLocaleTimeString()}
                    </span>
                    <span>{new URL(conversation.url).hostname}</span>
                    <span>{conversation.messages.length} messages</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => toggleExpanded(conversation.id)}
                    title="View conversation"
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      color: '#666666',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                      e.currentTarget.style.color = '#e44b79';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#666666';
                    }}
                  >
                    {expandedConversation === conversation.id ? (
                      <CollapseIcon size="sm" />
                    ) : (
                      <ExpandIcon size="sm" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopyConversation(conversation)}
                    title="Copy conversation"
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      color: '#666666',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                      e.currentTarget.style.color = '#34a853';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#666666';
                    }}
                  >
                    <CopyIcon size="sm" />
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(conversation.id)}
                    title="Delete conversation"
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      color: '#666666',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee';
                      e.currentTarget.style.color = '#d93025';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#666666';
                    }}
                  >
                    <TrashIcon size="sm" />
                  </button>
                </div>
              </div>
              
              {expandedConversation === conversation.id && (
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-color)'
                }}>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {conversation.messages.map((message, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: message.type === 'user' ? 'var(--accent-bg)' : 'var(--container-bg)',
                        border: `1px solid ${message.type === 'user' ? 'var(--accent-border)' : 'var(--border-color)'}`
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: message.type === 'user' ? 'var(--button-primary)' : 'var(--button-secondary)'
                          }}>
                            {message.type === 'user' ? 'You' : 'AI'}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            color: 'var(--secondary-text)'
                          }}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'var(--text-color)',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 