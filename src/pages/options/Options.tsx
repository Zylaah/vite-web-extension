import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import './Options.css';
import { StorageService } from '../../lib/services/storageService';
import { BackgroundCommunicator } from '../../lib/services/backgroundCommunicator';
import { PrivacyManager } from '../../lib/services/privacyManager';
import type { UserSettings, AIProvider, ModelQuality } from '../../lib/types';

const Options: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    selectedProvider: 'mistral',
    qualityPreference: 'accurate',
    darkMode: false,
    highlightImportant: true
  });
  
  const [apiKeys, setApiKeys] = useState({
    mistral: '',
    openai: '',
    anthropic: '',
    deepseek: ''
  });
  
  const [activeTab, setActiveTab] = useState<'providers' | 'settings' | 'info'>('providers');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load settings
        const storedSettings = await StorageService.getSettings();
        setSettings(storedSettings);
        
        // Load API keys
        const mistralKey = await StorageService.getApiKey('mistral');
        const openaiKey = await StorageService.getApiKey('openai');
        const anthropicKey = await StorageService.getApiKey('anthropic');
        const deepseekKey = await StorageService.getApiKey('deepseek');
        
        setApiKeys({
          mistral: mistralKey || '',
          openai: openaiKey || '',
          anthropic: anthropicKey || '',
          deepseek: deepseekKey || ''
        });
        
        // Check privacy status
        const privacyStatus = await PrivacyManager.getStatus();
        setPrivacyAccepted(privacyStatus.accepted);
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    };
    
    loadSettings();
  }, []);

  // Apply dark mode to body
  useEffect(() => {
    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [settings.darkMode]);
  
  // Handle settings changes
  const handleProviderChange = (provider: AIProvider) => {
    setSettings(prev => ({ ...prev, selectedProvider: provider }));
  };
  
  const handleQualityChange = (quality: ModelQuality) => {
    setSettings(prev => ({ ...prev, qualityPreference: quality }));
  };
  
  const handleDarkModeChange = (darkMode: boolean) => {
    setSettings(prev => ({ ...prev, darkMode }));
  };
  
  const handleHighlightChange = (highlightImportant: boolean) => {
    setSettings(prev => ({ ...prev, highlightImportant }));
  };
  
  // Handle API key changes
  const handleApiKeyChange = (provider: AIProvider, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };
  
  // Handle privacy policy acceptance
  const handlePrivacyAcceptance = async () => {
    try {
      await BackgroundCommunicator.acceptPrivacyPolicy();
      setPrivacyAccepted(true);
    } catch (e) {
      console.error('Failed to accept privacy policy:', e);
    }
  };
  
  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Save settings
      await StorageService.updateSettings(settings);
      
      // Save API keys
      if (apiKeys.mistral) {
        await StorageService.setApiKey('mistral', apiKeys.mistral);
      }
      
      if (apiKeys.openai) {
        await StorageService.setApiKey('openai', apiKeys.openai);
      }
      
      if (apiKeys.anthropic) {
        await StorageService.setApiKey('anthropic', apiKeys.anthropic);
      }
      
      if (apiKeys.deepseek) {
        await StorageService.setApiKey('deepseek', apiKeys.deepseek);
      }
      
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const openPrivacyPolicy = () => {
    browser.tabs.create({ url: browser.runtime.getURL('src/privacy/privacy-policy.html') });
  };
  
  return (
    <div 
      className="hana-options"
      style={{
        width: '300px',
        padding: '15px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '14px',
        lineHeight: '1.4',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        transition: 'background-color 0.3s, color 0.3s',
        minHeight: '100vh',
        '--bg-color': settings.darkMode ? '#2a2a2a' : '#ffffff',
        '--text-color': settings.darkMode ? '#e0e0e0' : '#333333',
        '--container-bg': settings.darkMode ? '#3a3a3a' : '#f8f9fa',
        '--border-color': settings.darkMode ? '#555' : '#ddd',
        '--button-primary': settings.darkMode ? '#aa69c4' : '#e44b79',
        '--button-primary-hover': settings.darkMode ? '#9e4dbe' : 'rgb(235, 103, 143)',
        '--button-secondary': settings.darkMode ? '#42c268' : '#34a853',
        '--button-secondary-hover': settings.darkMode ? '#35a855' : '#2d9249',
        '--button-text': 'white',
        '--success-color': settings.darkMode ? '#8eff9a' : '#137333',
        '--success-bg': settings.darkMode ? '#0e5624' : '#e6f4ea',
        '--error-color': settings.darkMode ? '#ff5c5c' : '#d93025',
        '--error-bg': settings.darkMode ? '#551111' : '#fce8e6'
      } as React.CSSProperties}
    >
      {/* Header with title and theme toggle */}
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '18px', 
          marginTop: '0', 
          marginBottom: '0',
          color: 'var(--text-color)' 
        }}>
          Hana
        </h1>
        
                 {/* Theme toggle */}
         <div 
           style={{
             position: 'absolute',
             top: '0',
             right: '0',
             fontSize: '17px',
             display: 'inline-block',
             width: '3.5em',
             height: '2em',
             cursor: 'pointer'
           }}
           title="Toggle dark mode"
           onClick={() => handleDarkModeChange(!settings.darkMode)}
         >
           <div
             style={{
               position: 'absolute',
               cursor: 'pointer',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               backgroundColor: settings.darkMode ? 'rgb(247, 247, 247)' : 'rgb(36, 36, 36)',
               transition: '0.5s',
               borderRadius: '30px'
             }}
           >
             <div
               style={{
                 position: 'absolute',
                 height: '1.4em',
                 width: '1.4em',
                 borderRadius: '50%',
                 left: settings.darkMode ? 'calc(100% - 1.4em - 0.17em)' : '0.17em',
                 bottom: '0.15em',
                 boxShadow: settings.darkMode 
                   ? 'inset 15px -4px 0px 15px #e66a8f' 
                   : 'inset 8px -4px 0px 0px #aa69c4',
                 background: settings.darkMode ? 'rgb(247, 247, 247)' : 'rgb(36, 36, 36)',
                 transition: '0.5s'
               }}
             />
           </div>
         </div>
      </div>

      {/* Privacy Policy Warning */}
      {!privacyAccepted && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: 'var(--error-bg)',
          borderRadius: '5px',
          borderLeft: '3px solid var(--error-color)'
        }}>
          <h3 style={{ 
            marginTop: '0', 
            marginBottom: '10px', 
            color: 'var(--error-color)',
            fontSize: '16px' 
          }}>
            Privacy Policy Required
          </h3>
          <p style={{ 
            margin: '5px 0 10px', 
            lineHeight: '1.4',
            color: 'var(--text-color)'
          }}>
            To use Hana AI Assistant, you must accept our privacy policy. This extension sends page content to AI providers for processing.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button
              onClick={handlePrivacyAcceptance}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '120px',
                backgroundColor: 'var(--button-primary)',
                color: 'white'
              }}
            >
              Accept
            </button>
            <button
              onClick={openPrivacyPolicy}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '120px'
              }}
            >
              View Policy
            </button>
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {(['providers', 'settings', 'info'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 15px',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === tab ? 'var(--button-primary)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-color)',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div>
          {/* Provider and Quality Selection Row */}
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            marginBottom: '15px'
          }}>
            <div style={{ flex: '1' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                color: 'var(--text-color)'
              }}>
                AI Provider:
              </label>
              <select
                value={settings.selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              >
                <option value="mistral">Mistral AI</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>
            
            <div style={{ flex: '1' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                color: 'var(--text-color)'
              }}>
                Quality:
              </label>
              <select
                value={settings.qualityPreference}
                onChange={(e) => handleQualityChange(e.target.value as ModelQuality)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              >
                <option value="fast">Fast</option>
                <option value="accurate">Accurate</option>
              </select>
            </div>
          </div>

          {/* API Keys */}
          {(['mistral', 'openai', 'anthropic', 'deepseek'] as AIProvider[]).map(provider => (
            <div 
              key={provider}
              style={{
                marginBottom: '15px',
                display: settings.selectedProvider === provider ? 'block' : 'none'
              }}
            >
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                color: 'var(--text-color)'
              }}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)} API Key:
              </label>
              <input
                type="password"
                value={apiKeys[provider]}
                onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                placeholder={`Enter your ${provider} API key`}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  boxSizing: 'border-box'
                }}
              />
              <small style={{
                display: 'block',
                marginTop: '5px',
                fontSize: '12px',
                color: 'var(--text-color)',
                opacity: '0.8'
              }}>
                Required if {provider} is selected as provider.
                {provider === 'anthropic' && " Starts with 'sk-ant-'."}
                {(provider === 'deepseek' || provider === 'openai') && " Starts with 'sk-'."}
              </small>
            </div>
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: 'var(--text-color)'
            }}>
              <input
                type="checkbox"
                checked={settings.highlightImportant}
                onChange={(e) => handleHighlightChange(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Highlight Important Parts
            </label>
            <small style={{
              display: 'block',
              marginTop: '5px',
              fontSize: '12px',
              color: 'var(--text-color)',
              opacity: '0.8'
            }}>
              Automatically highlight key information in responses.
            </small>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: 'var(--text-color)'
            }}>
              Keyboard Shortcut:
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <input
                type="text"
                value="Alt+F"
                readOnly
                style={{
                  flex: '1',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--container-bg)',
                  color: 'var(--text-color)',
                  fontFamily: '"Courier New", monospace',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              />
            </div>
            <small style={{
              display: 'block',
              marginTop: '5px',
              fontSize: '12px',
              color: 'var(--text-color)',
              opacity: '0.8'
            }}>
              Custom shortcut to toggle overlay. Ctrl+Alt+F always summarizes.
            </small>
          </div>
        </div>
      )}

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div>
          <button
            onClick={() => setShowInstructions(true)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              width: '100%',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '15px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--container-bg)';
              e.currentTarget.style.borderColor = 'var(--button-primary)';
              e.currentTarget.style.color = 'var(--button-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-color)';
            }}
          >
            How to Use
          </button>
          
          <div style={{
            marginTop: '15px',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '10px',
            textAlign: 'center',
            fontSize: '12px'
          }}>
            <button
              onClick={openPrivacyPolicy}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--button-primary)',
                textDecoration: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                marginBottom: '5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Privacy Policy
            </button>
            <div style={{ color: 'var(--text-color)', opacity: '0.8' }}>
              Version 2.7.0
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={saveSettings}
        disabled={isSaving || !privacyAccepted}
        style={{
          width: '100%',
          backgroundColor: privacyAccepted ? 'var(--button-primary)' : 'var(--border-color)',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '5px',
          cursor: privacyAccepted ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: '500',
          marginTop: '20px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          if (privacyAccepted) {
            e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (privacyAccepted) {
            e.currentTarget.style.backgroundColor = 'var(--button-primary)';
          }
        }}
      >
        {isSaving ? 'Saving...' : 'Save All Settings'}
      </button>

      {/* Status Message */}
      {saveMessage && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          textAlign: 'center',
          backgroundColor: saveMessage.includes('Failed') ? 'var(--error-bg)' : 'var(--success-bg)',
          color: saveMessage.includes('Failed') ? 'var(--error-color)' : 'var(--success-color)'
        }}>
          {saveMessage}
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '15px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-color)',
            padding: '20px',
            borderRadius: '5px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            maxWidth: '280px',
            margin: '0 auto',
            color: 'var(--text-color)'
          }}>
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'var(--text-color)',
                background: 'none',
                border: 'none'
              }}
            >
              ×
            </button>
            
            <h2 style={{
              marginTop: '0',
              marginBottom: '15px',
              fontSize: '16px'
            }}>
              How to Use
            </h2>
            
            <ul style={{
              marginBottom: '0',
              paddingLeft: '20px',
              lineHeight: '1.5'
            }}>
              <li style={{ marginBottom: '8px' }}>
                Press <strong>Alt+F</strong> (or your custom shortcut) to toggle the AI query interface
              </li>
              <li style={{ marginBottom: '8px' }}>
                Press <strong>Ctrl+Alt+F</strong> to instantly summarize the current page
              </li>
              <li style={{ marginBottom: '8px' }}>
                Type your question about the page content and click <strong>Ask</strong> or press Enter
              </li>
              <li>
                Configure settings and theme in this popup
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Options;
