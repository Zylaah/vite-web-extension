import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import './Options.css';
import { StorageService } from '../../lib/services/storageService';
import { BackgroundCommunicator } from '../../lib/services/backgroundCommunicator';
import { PrivacyManager } from '../../lib/services/privacyManager';
import type { AIProvider } from '../../lib/types';
import type { SettingsData } from '../../lib/services/storageService';
import { ContentCacheManager } from '../../lib/services/contentCacheManager';

const Options: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    selectedProvider: 'mistral',
    qualityPreference: 'balanced',
    mistralApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    deepseekApiKey: ''
  });
  
  const [darkMode, setDarkMode] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'providers' | 'settings' | 'info' | 'developer'>('providers');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [testingCompression, setTestingCompression] = useState(false);
  const [compressionResults, setCompressionResults] = useState<any>(null);
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load settings (includes API keys now)
        const storedSettings = await StorageService.getSettings();
        setSettings(storedSettings);
        
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
  
  const handleDarkModeChange = async (newDarkMode: boolean) => {
    setDarkMode(newDarkMode);
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
  
  const testCompression = async () => {
    setTestingCompression(true);
    setCompressionResults(null);
    
    try {
      const cacheManager = ContentCacheManager.getInstance();
      const results = await cacheManager.testCompression();
      setCompressionResults(results);
      
      if (results.success) {
        setMessage({ text: 'Compression test completed successfully!', type: 'success' });
      } else {
        setMessage({ text: `Compression test failed: ${results.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Compression test error:', error);
      setMessage({ text: 'Compression test failed with error', type: 'error' });
    } finally {
      setTestingCompression(false);
    }
  };

  return (
    <div 
      className="hana-options"
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        lineHeight: '1.6',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        transition: 'background-color 0.3s, color 0.3s',
        minHeight: '100vh',
        '--bg-color': darkMode ? '#1a1a1a' : '#f5f5f7',
        '--text-color': darkMode ? '#f5f5f7' : '#1d1d1f',
        '--secondary-text': darkMode ? '#a1a1a6' : '#6e6e73',
        '--container-bg': darkMode ? '#2d2d2d' : '#ffffff',
        '--border-color': darkMode ? '#424242' : '#d2d2d7',
        '--button-primary': darkMode ? '#aa69c4' : '#e44b79',
        '--button-primary-hover': darkMode ? '#9e4dbe' : 'rgb(235, 103, 143)',
        '--button-secondary': darkMode ? '#42c268' : '#34a853',
        '--button-secondary-hover': darkMode ? '#35a855' : '#2d9249',
        '--button-text': 'white',
        '--success-color': darkMode ? '#30d158' : '#137333',
        '--success-bg': darkMode ? '#0e5624' : '#e6f4ea',
        '--error-color': darkMode ? '#ff453a' : '#d93025',
        '--error-bg': darkMode ? '#551111' : '#fce8e6',
        '--card-shadow': darkMode 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        '--hover-shadow': darkMode 
          ? '0 8px 30px rgba(0, 0, 0, 0.4)' 
          : '0 8px 30px rgba(0, 0, 0, 0.12)'
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
            backgroundColor: darkMode ? 'rgba(170, 105, 196, 0.1)' : 'rgba(228, 75, 121, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            margin: '0 0 32px 0',
            border: `1px solid ${darkMode ? 'rgba(170, 105, 196, 0.3)' : 'rgba(228, 75, 121, 0.3)'}`
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
      <>
      {/* Modern Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '60px',
        padding: '0 4px'
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
            padding: '12px 16px',
            backgroundColor: 'var(--container-bg)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
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
            width: '44px',
            height: '24px',
            backgroundColor: darkMode ? 'var(--button-primary)' : '#e5e5e7',
            borderRadius: '12px',
            position: 'relative',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              position: 'absolute',
              top: '2px',
              left: darkMode ? '22px' : '2px',
              width: '20px',
              height: '20px',
              backgroundColor: 'white',
              borderRadius: '10px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }} />
          </div>
        </div>
      </div>


      
      {/* Modern Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '40px',
        backgroundColor: 'var(--container-bg)',
        padding: '6px',
        borderRadius: '16px',
        boxShadow: 'var(--card-shadow)',
        border: '1px solid var(--border-color)',
        width: 'fit-content',
        margin: '0 auto 40px auto'
      }}>
        {(['providers', 'settings', 'info', 'developer'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === tab ? 'var(--button-primary)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-color)',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === tab ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'
            }}
          >
            {tab === 'providers' ? 'AI Providers' : 
             tab === 'settings' ? 'Preferences' : 
             tab === 'info' ? 'Information' :
             'Developer'}
          </button>
        ))}
      </div>

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
                  value={settings[`${provider}ApiKey` as keyof SettingsData] || ''}
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
                  backgroundColor: darkMode ? 'rgba(170, 105, 196, 0.1)' : 'rgba(228, 75, 121, 0.1)',
                  borderRadius: '12px',
                  border: `1px solid ${darkMode ? 'rgba(170, 105, 196, 0.3)' : 'rgba(228, 75, 121, 0.3)'}`
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
        <div>


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

      {/* Developer Tab */}
      {activeTab === 'developer' && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: 'var(--container-bg)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: 'var(--card-shadow)',
            border: '1px solid var(--border-color)',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 24px 0',
              color: 'var(--text-color)'
            }}>
              Compression Testing
            </h2>
            
            <p style={{
              color: 'var(--secondary-text)',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              Test the content compression and decompression functionality used for caching page content.
            </p>
            
            <button 
              onClick={testCompression}
              disabled={testingCompression}
              style={{
                padding: '12px 24px',
                backgroundColor: testingCompression ? 'var(--border-color)' : 'var(--button-secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: testingCompression ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!testingCompression) {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!testingCompression) {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary)';
                }
              }}
            >
              {testingCompression ? 'Testing...' : 'Test Compression'}
            </button>
            
            {compressionResults && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                backgroundColor: compressionResults.success ? 'var(--success-bg)' : 'var(--error-bg)',
                borderRadius: '12px',
                border: `1px solid ${compressionResults.success ? 'var(--success-color)' : 'var(--error-color)'}`
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: compressionResults.success ? 'var(--success-color)' : 'var(--error-color)'
                }}>
                  Test Results
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  fontSize: '14px',
                  color: 'var(--text-color)'
                }}>
                  <div>
                    <strong>Success:</strong> {compressionResults.success ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Native Support:</strong> {compressionResults.nativeCompressionAvailable ? 'Yes' : 'No'}
                  </div>
                  {compressionResults.success && (
                    <>
                      <div>
                        <strong>Compression Ratio:</strong> {(compressionResults.results.compressionRatio * 100).toFixed(1)}%
                      </div>
                      <div>
                        <strong>Round Trip:</strong> {compressionResults.results.roundTripSuccess ? 'Success' : 'Failed'}
                      </div>
                    </>
                  )}
                </div>
                
                {compressionResults.error && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--error-color)'
                  }}>
                    <strong>Error:</strong> {compressionResults.error}
                  </div>
                )}
              </div>
            )}
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

      {/* Compression Test Message */}
      {message && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          textAlign: 'center',
          backgroundColor: message.type === 'error' ? 'var(--error-bg)' : 'var(--success-bg)',
          color: message.type === 'error' ? 'var(--error-color)' : 'var(--success-color)'
        }}>
          {message.text}
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
      </>
    )}
    </div>
  );
};

export default Options;
