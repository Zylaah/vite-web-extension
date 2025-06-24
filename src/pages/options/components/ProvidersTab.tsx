import React from 'react';
import type { AIProvider } from '../../../lib/types';
import type { SettingsData } from '../../../lib/services/storageService';

interface ProvidersTabProps {
  settings: SettingsData;
  onProviderChange: (provider: AIProvider) => void;
  onQualityChange: (quality: string) => void;
  onLanguageChange: (language: 'english' | 'french') => void;
  onApiKeyChange: (provider: AIProvider, value: string) => void;
}

export const ProvidersTab: React.FC<ProvidersTabProps> = ({
  settings,
  onProviderChange,
  onQualityChange,
  onLanguageChange,
  onApiKeyChange
}) => {
  return (
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
              onChange={(e) => onProviderChange(e.target.value as AIProvider)}
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
              onChange={(e) => onQualityChange(e.target.value)}
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
              onChange={(e) => onLanguageChange(e.target.value as 'english' | 'french')}
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
              onChange={(e) => onApiKeyChange(provider, e.target.value)}
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
  );
}; 