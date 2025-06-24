import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import './Options.css';
import { StorageService } from '../../lib/services/storageService';
import { BackgroundCommunicator } from '../../lib/services/backgroundCommunicator';
import { PrivacyManager } from '../../lib/services/privacyManager';
import type { AIProvider } from '../../lib/types';
import type { SettingsData } from '../../lib/services/storageService';

import { HistoryTab } from './components/HistoryTab';

const Options: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    selectedProvider: 'mistral',
    qualityPreference: 'balanced',
    responseLanguage: 'english',
    darkMode: false,
    mistralApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    deepseekApiKey: ''
  });
  
  const [darkMode, setDarkMode] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'providers' | 'settings' | 'info' | 'history'>('providers');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customShortcut, setCustomShortcut] = useState('Alt+F');
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load settings (includes API keys now)
        const storedSettings = await StorageService.getSettings();
        setSettings(storedSettings);
        
        // Sync dark mode state with settings
        setDarkMode(storedSettings.darkMode || false);
        
        // Load custom shortcut
        const result = await browser.storage.sync.get(['customShortcut']);
        if (result.customShortcut && typeof result.customShortcut === 'string') {
          setCustomShortcut(result.customShortcut);
        }
        
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
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);
  
  // Handle settings changes
  const handleProviderChange = (provider: AIProvider) => {
    setSettings(prev => ({ ...prev, selectedProvider: provider }));
  };
  
  const handleQualityChange = (quality: string) => {
    setSettings(prev => ({ ...prev, qualityPreference: quality }));
  };

  const handleLanguageChange = (language: 'english' | 'french') => {
    setSettings(prev => ({ ...prev, responseLanguage: language }));
  };
  
  const handleDarkModeChange = async (newDarkMode: boolean) => {
    setDarkMode(newDarkMode);
    setSettings(prev => ({ ...prev, darkMode: newDarkMode }));
    
    // Save dark mode preference to storage immediately
    try {
      await StorageService.saveSettings({ darkMode: newDarkMode });
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  };
  

  
  // Handle API key changes
  const handleApiKeyChange = (provider: AIProvider, value: string) => {
    const keyName = `${provider}ApiKey` as keyof SettingsData;
    setSettings(prev => ({ ...prev, [keyName]: value }));
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
      // Save all settings including API keys
      await StorageService.saveSettings(settings);
      
      // Save custom shortcut
      await browser.storage.sync.set({ customShortcut });
      
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
  
  const startRecordingShortcut = () => {
    setIsRecordingShortcut(true);
    setRecordedKeys([]);
  };

  const handleShortcutKeyDown = (event: KeyboardEvent) => {
    if (!isRecordingShortcut) return;

    event.preventDefault();
    event.stopPropagation();

    // Handle Escape to apply or cancel the recorded shortcut
    if (event.key === 'Escape') {
      if (recordedKeys.length >= 2) {
        const newShortcut = recordedKeys.join('+');
        setCustomShortcut(newShortcut);
      }
      // Always stop recording on Escape, whether we apply or cancel
      setIsRecordingShortcut(false);
      setRecordedKeys([]);
      return;
    }

    // Capture modifier keys and regular keys
    const modifierKeys = ['Control', 'Alt', 'Shift', 'Meta'];
    const keys: string[] = [];

    // Add modifier keys
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    if (event.metaKey) keys.push('Meta');

    // Add the main key (if it's not a modifier itself)
    if (!modifierKeys.includes(event.key)) {
      keys.push(event.key.toUpperCase());
    }

    // Only update if we have at least one modifier + one key
    if (keys.length >= 2) {
      setRecordedKeys(keys);
    }
  };

  // Add event listener for shortcut recording
  useEffect(() => {
    if (isRecordingShortcut) {
      const handleClickOutside = (event: MouseEvent) => {
        // Cancel recording if clicking outside the shortcut area
        const target = event.target as HTMLElement;
        if (!target.closest('[data-shortcut-recorder]')) {
          setIsRecordingShortcut(false);
          setRecordedKeys([]);
        }
      };

      document.addEventListener('keydown', handleShortcutKeyDown, true);
      document.addEventListener('click', handleClickOutside, true);
      
      return () => {
        document.removeEventListener('keydown', handleShortcutKeyDown, true);
        document.removeEventListener('click', handleClickOutside, true);
      };
    }
  }, [isRecordingShortcut, recordedKeys]);



  return (
    <div 
      className="hana-options"
      style={{
        width: '100%',
        minHeight: '100vh',
        padding: '0',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        lineHeight: '1.6',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        transition: 'background-color 0.3s, color 0.3s',
        '--bg-color': darkMode ? '#0f0f0f' : '#fafafa',
        '--text-color': darkMode ? '#f5f5f7' : '#1d1d1f',
        '--secondary-text': darkMode ? '#a1a1a6' : '#6e6e73',
        '--container-bg': darkMode ? '#1c1c1e' : '#ffffff',
        '--border-color': darkMode ? '#2c2c2e' : '#e5e5e7',
        '--button-primary': darkMode ? '#aa69c4' : '#e44b79',
        '--button-primary-hover': darkMode ? '#9e4dbe' : 'rgb(235, 103, 143)',
        '--button-secondary': darkMode ? '#42c268' : '#34a853',
        '--button-secondary-hover': darkMode ? '#35a855' : '#2d9249',
        '--button-text': 'white',
        '--success-color': darkMode ? '#30d158' : '#137333',
        '--success-bg': darkMode ? '#0e2818' : '#e6f4ea',
        '--error-color': darkMode ? '#ff453a' : '#d93025',
        '--error-bg': darkMode ? '#2d1b1b' : '#fce8e6',
        '--card-shadow': darkMode 
          ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
          : '0 8px 32px rgba(0, 0, 0, 0.08)',
        '--hover-shadow': darkMode 
          ? '0 12px 40px rgba(0, 0, 0, 0.5)' 
          : '0 12px 40px rgba(0, 0, 0, 0.12)',
        '--subtle-bg': darkMode ? '#2c2c2e' : '#f2f2f7',
        '--accent-bg': darkMode ? 'rgba(170, 105, 196, 0.1)' : 'rgba(228, 75, 121, 0.05)',
        '--accent-border': darkMode ? 'rgba(170, 105, 196, 0.3)' : 'rgba(228, 75, 121, 0.2)'
      } as React.CSSProperties}
    >
    
    {/* Full-Screen Privacy Notice */}
    {!privacyAccepted && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-color)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: 'var(--container-bg)',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: 'var(--hover-shadow)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          {/* Welcome Header */}
          <div style={{
            marginBottom: '32px'
          }}>
            <h1 style={{
              fontSize: '42px',
              fontWeight: '700',
              margin: '0 0 12px 0',
              color: 'var(--text-color)',
              letterSpacing: '-0.02em'
            }}>
              Welcome to Hana
            </h1>
            <p style={{
              fontSize: '20px',
              color: 'var(--secondary-text)',
              margin: '0',
              fontWeight: '400'
            }}>
              Your AI-powered web assistant
            </p>
          </div>

          {/* Privacy Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            backgroundColor: 'var(--button-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px auto',
            fontSize: '36px'
          }}>
            🛡️
          </div>

          {/* Privacy Notice */}
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            margin: '0 0 16px 0',
            color: 'var(--text-color)'
          }}>
            Privacy & Data Usage
          </h2>
          
          <p style={{
            fontSize: '18px',
            color: 'var(--secondary-text)',
            margin: '0 0 32px 0',
            lineHeight: '1.6'
          }}>
            Hana sends page content to AI providers (OpenAI, Anthropic, Mistral, or DeepSeek) to provide intelligent responses. 
            Your data is processed according to each provider's privacy policy.
          </p>

          <div style={{
            backgroundColor: 'var(--accent-bg)',
            borderRadius: '16px',
            padding: '24px',
            margin: '0 0 32px 0',
            border: '1px solid var(--accent-border)'
          }}>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-color)',
              margin: '0',
              lineHeight: '1.6'
            }}>
              <strong>By accepting, you agree to:</strong><br/>
              • Send webpage content to your chosen AI provider<br/>
              • Follow the selected provider's terms of service<br/>
              • Allow Hana to store your preferences locally
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handlePrivacyAcceptance}
              style={{
                padding: '16px 32px',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                backgroundColor: 'var(--button-primary)',
                color: 'white',
                transition: 'all 0.3s ease',
                minWidth: '160px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Accept & Continue
            </button>
            
            <button
              onClick={openPrivacyPolicy}
              style={{
                padding: '16px 32px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                minWidth: '160px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--container-bg)';
                e.currentTarget.style.borderColor = 'var(--button-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Read Privacy Policy
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Main Content - only shown when privacy is accepted */}
    {privacyAccepted && (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px',
        minHeight: 'calc(100vh - 48px)',
        boxSizing: 'border-box'
      }}>
        {/* Modern Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '48px',
          padding: '0 8px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: '700',
              margin: '0',
              color: 'var(--text-color)',
              letterSpacing: '-0.02em'
            }}>
              Hana
            </h1>
            <p style={{
              fontSize: '20px',
              margin: '8px 0 0 0',
              color: 'var(--secondary-text)',
              fontWeight: '400'
            }}>
              AI Assistant Settings
            </p>
          </div>
          
          {/* Modern Theme Toggle */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              backgroundColor: 'var(--container-bg)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--card-shadow)'
            }}
            title="Toggle dark mode"
            onClick={() => handleDarkModeChange(!darkMode)}
          >
            <span style={{
              fontSize: '16px',
              color: 'var(--secondary-text)',
              fontWeight: '500'
            }}>
              {darkMode ? 'Dark' : 'Light'}
            </span>
            <div style={{
              width: '48px',
              height: '26px',
              backgroundColor: darkMode ? 'var(--button-primary)' : '#e5e5e7',
              borderRadius: '13px',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                position: 'absolute',
                top: '2px',
                left: darkMode ? '24px' : '2px',
                width: '22px',
                height: '22px',
                backgroundColor: 'white',
                borderRadius: '11px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
              }} />
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '40px',
          backgroundColor: 'var(--container-bg)',
          padding: '8px',
          borderRadius: '20px',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid var(--border-color)',
          width: 'fit-content',
          margin: '0 auto 40px auto'
        }}>
          {(['providers', 'settings', 'info', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 28px',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === tab ? 'var(--button-primary)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--text-color)',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === tab ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                textTransform: 'capitalize'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.backgroundColor = 'var(--subtle-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {tab === 'providers' ? 'AI Providers' : tab === 'history' ? 'History' : tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'providers' ? '1fr 400px' : '1fr',
          gap: '32px',
          alignItems: 'start'
        }}>
          {/* Main Content */}
          <div>
            {/* Providers Tab */}
            {activeTab === 'providers' && (
              <div style={{
                display: 'grid',
                gap: '32px',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                {/* Provider and Quality Selection Card */}
                <div style={{
                  backgroundColor: 'var(--container-bg)',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: 'var(--card-shadow)',
                  border: '1px solid var(--border-color)'
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 24px 0',
                    color: 'var(--text-color)'
                  }}>
                    AI Configuration
                  </h2>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px',
                    marginBottom: '0'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '12px',
                        fontWeight: '600',
                        color: 'var(--text-color)',
                        fontSize: '18px'
                      }}>
                        AI Provider
                      </label>
                      <select
                        value={settings.selectedProvider}
                        onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          fontSize: '16px',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <option value="mistral">Mistral AI</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="deepseek">DeepSeek</option>
                      </select>
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '12px',
                        fontWeight: '600',
                        color: 'var(--text-color)',
                        fontSize: '18px'
                      }}>
                        Model Quality
                      </label>
                      <select
                        value={settings.qualityPreference}
                        onChange={(e) => handleQualityChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          fontSize: '16px',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <option value="fast">Fast (Optimized for speed)</option>
                        <option value="accurate">Accurate (Optimized for quality)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '12px',
                        fontWeight: '600',
                        color: 'var(--text-color)',
                        fontSize: '18px'
                      }}>
                        Response Language
                      </label>
                      <select
                        value={settings.responseLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value as 'english' | 'french')}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          fontSize: '16px',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <option value="english">🇺🇸 English</option>
                        <option value="french">🇫🇷 Français</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* API Key Card */}
                <div style={{
                  backgroundColor: 'var(--container-bg)',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: 'var(--card-shadow)',
                  border: '1px solid var(--border-color)'
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 12px 0',
                    color: 'var(--text-color)'
                  }}>
                    API Configuration
                  </h2>
                  <p style={{
                    fontSize: '16px',
                    color: 'var(--secondary-text)',
                    margin: '0 0 24px 0',
                    lineHeight: '1.6'
                  }}>
                    Enter your API key for {settings.selectedProvider.charAt(0).toUpperCase() + settings.selectedProvider.slice(1)}
                  </p>
                  
                  {(['mistral', 'openai', 'anthropic', 'deepseek'] as AIProvider[]).map(provider => (
                    <div 
                      key={provider}
                      style={{
                        display: settings.selectedProvider === provider ? 'block' : 'none'
                      }}
                    >
                      <label style={{
                        display: 'block',
                        marginBottom: '12px',
                        fontWeight: '600',
                        color: 'var(--text-color)',
                        fontSize: '18px'
                      }}>
                        {provider.charAt(0).toUpperCase() + provider.slice(1)} API Key
                      </label>
                      <input
                        type="password"
                        value={(settings[`${provider}ApiKey` as keyof SettingsData] as string) || ''}
                        onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                        placeholder={`Enter your ${provider} API key`}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          fontSize: '16px',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                          boxSizing: 'border-box',
                          fontFamily: 'monospace',
                          transition: 'all 0.2s ease'
                        }}
                      />
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '12px',
                        padding: '12px 16px',
                        backgroundColor: 'var(--accent-bg)',
                        borderRadius: '12px',
                        border: '1px solid var(--accent-border)'
                      }}>
                        <span style={{ fontSize: '16px' }}>💡</span>
                        <small style={{
                          fontSize: '14px',
                          color: 'var(--secondary-text)',
                          lineHeight: '1.5'
                        }}>
                          Required for {provider} provider.
                          {provider === 'anthropic' && " API keys start with 'sk-ant-'."}
                          {(provider === 'deepseek' || provider === 'openai') && " API keys start with 'sk-'."}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div style={{
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                <div style={{
                  backgroundColor: 'var(--container-bg)',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: 'var(--card-shadow)',
                  border: '1px solid var(--border-color)'
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 24px 0',
                    color: 'var(--text-color)'
                  }}>
                    Keyboard Shortcuts
                  </h2>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    {/* Editable Alt+F Shortcut */}
                    <div data-shortcut-recorder style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      padding: '20px',
                      backgroundColor: isRecordingShortcut ? 'var(--error-bg)' : 'var(--accent-bg)',
                      borderRadius: '16px',
                      border: `1px solid ${isRecordingShortcut ? 'var(--error-color)' : 'var(--accent-border)'}`,
                      transition: 'all 0.3s ease'
                    }}>
                      <button
                        onClick={startRecordingShortcut}
                        disabled={isRecordingShortcut}
                        style={{
                          backgroundColor: isRecordingShortcut ? 'var(--error-color)' : 'var(--button-primary)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          fontFamily: 'monospace',
                          width: '140px',
                          textAlign: 'center',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease',
                          cursor: isRecordingShortcut ? 'not-allowed' : 'pointer',
                          position: 'relative',
                          boxSizing: 'border-box'
                        }}
                      >
                        {isRecordingShortcut ? (
                          recordedKeys.length > 0 ? recordedKeys.join('+') : 'Press keys...'
                        ) : customShortcut}
                        {isRecordingShortcut && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '16px',
                            height: '16px',
                            backgroundColor: 'var(--error-color)',
                            borderRadius: '50%',
                            animation: 'pulse 1.5s infinite'
                          }} />
                        )}
                      </button>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          margin: '0 0 4px 0',
                          color: 'var(--text-color)'
                        }}>
                          Toggle AI overlay
                        </h4>
                        <p style={{
                          fontSize: '14px',
                          color: 'var(--secondary-text)',
                          margin: '0 0 8px 0',
                          lineHeight: '1.4'
                        }}>
                          {isRecordingShortcut 
                            ? 'Press a modifier key (Ctrl/Alt/Shift) + another key, then Escape to apply'
                            : 'Click to record a new shortcut combination'
                          }
                        </p>
                        <div style={{
                          fontSize: '12px',
                          color: isRecordingShortcut 
                            ? (recordedKeys.length >= 2 ? 'var(--success-color)' : 'var(--error-color)')
                            : 'var(--success-color)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>
                            {isRecordingShortcut 
                              ? (recordedKeys.length >= 2 ? '✅' : '⏳') 
                              : '✅'
                            }
                          </span>
                          {isRecordingShortcut 
                            ? (recordedKeys.length >= 2 
                                ? 'Press Escape to apply this shortcut' 
                                : 'Need modifier + key combination')
                            : 'Current shortcut is active'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Fixed shortcuts */}
                    {[
                      { 
                        shortcut: 'Ctrl+Alt+F', 
                        description: 'Instant page summary',
                        note: 'Automatically summarizes the current page content (fixed shortcut)'
                      },
                      { 
                        shortcut: 'Enter', 
                        description: 'Send message',
                        note: 'Submit your question when typing in the chat'
                      },
                      { 
                        shortcut: 'Escape', 
                        description: 'Close overlay',
                        note: 'Close the chat interface (chat mode only)'
                      }
                    ].map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        padding: '20px',
                        backgroundColor: 'var(--subtle-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{
                          backgroundColor: 'var(--button-primary)',
                          color: 'white',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          fontFamily: 'monospace',
                          width: '140px',
                          textAlign: 'center',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          boxSizing: 'border-box'
                        }}>
                          {item.shortcut}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            margin: '0 0 4px 0',
                            color: 'var(--text-color)'
                          }}>
                            {item.description}
                          </h4>
                          <p style={{
                            fontSize: '14px',
                            color: 'var(--secondary-text)',
                            margin: '0',
                            lineHeight: '1.4'
                          }}>
                            {item.note}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div style={{
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                <HistoryTab />
              </div>
            )}

            {/* Info Tab */}
            {activeTab === 'info' && (
              <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
              }}>
                {/* How to Use Card */}
                <div style={{
                  backgroundColor: 'var(--container-bg)',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: 'var(--card-shadow)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--button-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      📖
                    </div>
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      margin: '0',
                      color: 'var(--text-color)'
                    }}>
                      How to Use Hana
                    </h2>
                  </div>

                  <p style={{
                    fontSize: '16px',
                    color: 'var(--secondary-text)',
                    margin: '0 0 24px 0',
                    lineHeight: '1.6'
                  }}>
                    Hana is your AI-powered web assistant that helps you understand and interact with webpage content.
                  </p>

                  <button
                    onClick={() => setShowInstructions(true)}
                    style={{
                      backgroundColor: 'var(--button-primary)',
                      border: 'none',
                      color: 'white',
                      padding: '16px 32px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    View Detailed Instructions
                  </button>
                </div>

                {/* About Card */}
                <div style={{
                  backgroundColor: 'var(--container-bg)',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: 'var(--card-shadow)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--button-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      ℹ️
                    </div>
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      margin: '0',
                      color: 'var(--text-color)'
                    }}>
                      About Hana
                    </h2>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      padding: '20px',
                      backgroundColor: 'var(--subtle-bg)',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: 'var(--button-primary)',
                        marginBottom: '8px'
                      }}>
                        v2.7.0
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--secondary-text)'
                      }}>
                        Current Version
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '20px',
                      backgroundColor: 'var(--subtle-bg)',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: 'var(--button-secondary)',
                        marginBottom: '8px'
                      }}>
                        4+
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--secondary-text)'
                      }}>
                        AI Providers
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <button
                      onClick={openPrivacyPolicy}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-color)',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--subtle-bg)';
                        e.currentTarget.style.borderColor = 'var(--button-primary)';
                        e.currentTarget.style.color = 'var(--button-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.color = 'var(--text-color)';
                      }}
                    >
                      Privacy Policy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar for Save Button and Status (only on providers tab) */}
          {activeTab === 'providers' && (
            <div style={{
              position: 'sticky',
              top: '40px'
            }}>
              {/* Save Settings Card */}
              <div style={{
                backgroundColor: 'var(--container-bg)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: 'var(--card-shadow)',
                border: '1px solid var(--border-color)',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: 'var(--text-color)'
                }}>
                  Save Configuration
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--secondary-text)',
                  margin: '0 0 24px 0',
                  lineHeight: '1.5'
                }}>
                  Save your AI provider and API key settings to start using Hana.
                </p>
                
                <button
                  onClick={saveSettings}
                  disabled={isSaving || !privacyAccepted}
                  style={{
                    width: '100%',
                    backgroundColor: privacyAccepted ? 'var(--button-primary)' : 'var(--border-color)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    cursor: privacyAccepted ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: privacyAccepted ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (privacyAccepted && !isSaving) {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (privacyAccepted && !isSaving) {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  {isSaving ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Saving...
                    </div>
                  ) : 'Save Settings'}
                </button>

                {/* Status Message */}
                {saveMessage && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    textAlign: 'center',
                    backgroundColor: saveMessage.includes('Failed') ? 'var(--error-bg)' : 'var(--success-bg)',
                    color: saveMessage.includes('Failed') ? 'var(--error-color)' : 'var(--success-color)',
                    border: `1px solid ${saveMessage.includes('Failed') ? 'var(--error-color)' : 'var(--success-color)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <span>{saveMessage.includes('Failed') ? '❌' : '✅'}</span>
                    {saveMessage}
                  </div>
                )}
              </div>

              {/* Quick Info Card */}
              <div style={{
                backgroundColor: 'var(--accent-bg)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--accent-border)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '20px' }}>💡</span>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0',
                    color: 'var(--text-color)'
                  }}>
                    Quick Start
                  </h4>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--secondary-text)',
                  margin: '0',
                  lineHeight: '1.5'
                }}>
                  Press <strong>Alt+F</strong> on any webpage to ask questions about the content, or <strong>Ctrl+Alt+F</strong> for instant summaries.
                </p>
              </div>
            </div>
          )}
        </div>



        {/* Instructions Modal */}
        {showInstructions && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              backgroundColor: 'var(--container-bg)',
              padding: '40px',
              borderRadius: '24px',
              boxShadow: 'var(--hover-shadow)',
              position: 'relative',
              maxWidth: '500px',
              width: '100%',
              margin: '0 auto',
              color: 'var(--text-color)',
              border: '1px solid var(--border-color)'
            }}>
              <button
                onClick={() => setShowInstructions(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'var(--secondary-text)',
                  backgroundColor: 'var(--subtle-bg)',
                  border: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--subtle-bg)';
                  e.currentTarget.style.color = 'var(--secondary-text)';
                }}
              >
                ×
              </button>
              
              <h2 style={{
                marginTop: '0',
                marginBottom: '24px',
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-color)'
              }}>
                How to Use Hana
              </h2>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {[
                  { shortcut: 'Alt+F', description: 'Toggle the AI query interface on any webpage' },
                  { shortcut: 'Ctrl+Alt+F', description: 'Instantly summarize the current page' },
                  { shortcut: 'Enter', description: 'Send your question after typing it' },
                  { shortcut: 'Escape', description: 'Close the overlay in chat mode' }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: 'var(--subtle-bg)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      backgroundColor: 'var(--button-primary)',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: 'monospace',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}>
                      {item.shortcut}
                    </div>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      color: 'var(--text-color)',
                      lineHeight: '1.4'
                    }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add animations */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            @keyframes pulse {
              0%, 100% { 
                opacity: 1; 
                transform: scale(1); 
              }
              50% { 
                opacity: 0.7; 
                transform: scale(1.1); 
              }
            }
          `}
        </style>
      </div>
    )}
    </div>
  );
};

export default Options;
