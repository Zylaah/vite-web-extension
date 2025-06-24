import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import './Options.css';
import { StorageService } from '../../lib/services/storageService';
import { BackgroundCommunicator } from '../../lib/services/backgroundCommunicator';
import { PrivacyManager } from '../../lib/services/privacyManager';
import type { AIProvider } from '../../lib/types';
import type { SettingsData } from '../../lib/services/storageService';

// Import new components
import { HistoryTab } from './components/HistoryTab';
import { PrivacyNotice } from './components/PrivacyNotice';
import { OptionsHeader } from './components/OptionsHeader';
import { TabNavigation } from './components/TabNavigation';
import { ProvidersTab } from './components/ProvidersTab';
import { SettingsTab } from './components/SettingsTab';
import { InfoTab } from './components/InfoTab';
import { SaveSidebar } from './components/SaveSidebar';
import { InstructionsModal } from './components/InstructionsModal';

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
  const [customShortcut, setCustomShortcut] = useState('Alt+F');
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await StorageService.getSettings();
        setSettings(storedSettings);
        setDarkMode(storedSettings.darkMode || false);
        
        const result = await browser.storage.sync.get(['customShortcut']);
        if (result.customShortcut && typeof result.customShortcut === 'string') {
          setCustomShortcut(result.customShortcut);
        }
        
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
    
    try {
      await StorageService.saveSettings({ darkMode: newDarkMode });
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  };
  
  const handleApiKeyChange = (provider: AIProvider, value: string) => {
    const keyName = `${provider}ApiKey` as keyof SettingsData;
    setSettings(prev => ({ ...prev, [keyName]: value }));
  };
  
  const handlePrivacyAcceptance = async () => {
    try {
      await BackgroundCommunicator.acceptPrivacyPolicy();
      setPrivacyAccepted(true);
    } catch (e) {
      console.error('Failed to accept privacy policy:', e);
    }
  };
  
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await StorageService.saveSettings(settings);
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
    
    {/* Privacy Notice */}
    {!privacyAccepted && (
      <PrivacyNotice
        onAccept={handlePrivacyAcceptance}
        onOpenPrivacyPolicy={openPrivacyPolicy}
      />
    )}

    {/* Main Content */}
    {privacyAccepted && (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px',
        minHeight: 'calc(100vh - 48px)',
        boxSizing: 'border-box'
      }}>
        <OptionsHeader 
          darkMode={darkMode}
          onDarkModeChange={handleDarkModeChange}
        />

        <TabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Content Area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'providers' ? '1fr 400px' : '1fr',
          gap: '32px',
          alignItems: 'start'
        }}>
          {/* Main Content */}
          <div>
            {activeTab === 'providers' && (
              <ProvidersTab
                settings={settings}
                onProviderChange={handleProviderChange}
                onQualityChange={handleQualityChange}
                onLanguageChange={handleLanguageChange}
                onApiKeyChange={handleApiKeyChange}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                customShortcut={customShortcut}
                setCustomShortcut={setCustomShortcut}
                isRecordingShortcut={isRecordingShortcut}
                setIsRecordingShortcut={setIsRecordingShortcut}
                recordedKeys={recordedKeys}
                setRecordedKeys={setRecordedKeys}
              />
            )}

            {activeTab === 'history' && (
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <HistoryTab />
              </div>
            )}

            {activeTab === 'info' && (
              <InfoTab
                onShowInstructions={() => setShowInstructions(true)}
                onOpenPrivacyPolicy={openPrivacyPolicy}
              />
            )}
          </div>

          {/* Sidebar for Save Button (only on providers tab) */}
          {activeTab === 'providers' && (
            <SaveSidebar
              isSaving={isSaving}
              saveMessage={saveMessage}
              privacyAccepted={privacyAccepted}
              onSave={saveSettings}
            />
          )}
        </div>

        {/* Instructions Modal */}
        <InstructionsModal
          isVisible={showInstructions}
          onClose={() => setShowInstructions(false)}
        />

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
