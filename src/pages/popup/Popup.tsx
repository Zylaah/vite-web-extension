import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { StorageService, type SettingsData } from '../../lib/services/storageService';
import type { AIProvider } from '../../lib/types';
import { 
  HanaLogo, 
  ChevronDownIcon, 
  SettingsIcon, 
  RobotIcon, 
  CogIcon, 
  LightningIcon, 
  TargetIcon,
  KeyboardIcon,
  SpinnerIcon,
  CheckIcon,
  ProviderIcon
} from '../../components/Icons';

const Popup: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    selectedProvider: 'mistral',
    qualityPreference: 'fast',
    responseLanguage: 'english',
    darkMode: false,
    mistralApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    deepseekApiKey: ''
  });
  
  // Use dark mode from settings instead of system preference
  const [darkMode, setDarkMode] = useState(false);
  
  // Listen for dark mode changes from storage
  useEffect(() => {
    const handleStorageChange = (changes: any, area: string) => {
      if (area === 'local' && changes.darkMode) {
        setDarkMode(changes.darkMode.newValue);
      }
    };
    
    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Load settings on mount
    const loadSettings = async () => {
      try {
        const userSettings = await StorageService.getSettings();
        setSettings(userSettings);
        setDarkMode(userSettings.darkMode || false);
        setLoading(false);
      } catch (error) {
        console.error('Error loading settings:', error);
        showToastMessage('Error loading settings');
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Toast message function
  const showToastMessage = (msg: string) => {
    setMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setTimeout(() => setMessage(''), 300); // Clear message after fade out
    }, 2000);
  };
  
  // Handle provider change
  const handleProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AIProvider;
    setSettings(prev => ({ ...prev, selectedProvider: newProvider }));
    
    try {
      await StorageService.saveSettings({ selectedProvider: newProvider });
      showToastMessage('Provider updated successfully');
    } catch (error) {
      console.error('Error updating provider:', error);
      showToastMessage('Error updating provider');
    }
  };
  
  // Handle quality preference change
  const handleQualityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuality = e.target.value;
    setSettings(prev => ({ ...prev, qualityPreference: newQuality }));
    
    try {
      await StorageService.saveSettings({ qualityPreference: newQuality });
      showToastMessage('Quality preference updated');
    } catch (error) {
      console.error('Error updating quality preference:', error);
      showToastMessage('Error updating quality preference');
    }
  };
  
  // Open options page
  const openOptions = () => {
    browser.runtime.openOptionsPage();
  };

  // Provider info with provider-specific icons
  const accentColorClass = darkMode ? 'text-purple-400' : 'text-pink-500';
  
  const providerInfo = {
    mistral: { 
      name: 'Mistral AI', 
      icon: <ProviderIcon provider="mistral" darkMode={darkMode} size="sm" />
    },
    openai: { 
      name: 'OpenAI', 
      icon: <ProviderIcon provider="openai" darkMode={darkMode} size="sm" />
    },
    anthropic: { 
      name: 'Anthropic', 
      icon: <ProviderIcon provider="anthropic" darkMode={darkMode} size="sm" />
    },
    deepseek: { 
      name: 'DeepSeek', 
      icon: <ProviderIcon provider="deepseek" darkMode={darkMode} size="sm" />
    }
  };

  const qualityInfo: Record<string, { name: string; icon: React.ReactElement; description: string }> = {
    fast: { 
      name: 'Fast', 
      icon: <LightningIcon className={accentColorClass} />, 
      description: 'Optimized for speed' 
    },
    accurate: { 
      name: 'Accurate', 
      icon: <TargetIcon className={accentColorClass} />, 
      description: 'Optimized for quality' 
    }
  };

  if (loading) {
    return (
      <div className={`w-80 h-96 flex items-center justify-center ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <SpinnerIcon className={`${darkMode ? 'text-purple-400' : 'text-pink-500'}`} size="xl" />
          <span className="text-sm font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 h-96 flex flex-col ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' 
        : 'bg-gradient-to-br from-white via-gray-50 to-white text-gray-900'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
      } backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <HanaLogo size="lg" />
          <div>
            <h1 className="text-lg font-bold">Hana</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Your intelligent assistant
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* AI Provider Section */}
        <div>
          <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
            <RobotIcon />
            AI Provider
          </label>
          <div className={`relative rounded-lg border ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          } shadow-sm`}>
            <select 
              value={settings.selectedProvider} 
              onChange={handleProviderChange}
              className={`w-full p-3 pr-10 rounded-lg appearance-none cursor-pointer font-medium text-sm ${
                darkMode 
                  ? 'bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-500' 
                  : 'bg-white text-gray-900 focus:ring-2 focus:ring-pink-500'
              } focus:outline-none transition-all`}
            >
              {Object.entries(providerInfo).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
          </div>
          {/* Provider indicator - compact */}
          <div className={`mt-2 p-2 rounded-lg ${
            darkMode ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-pink-50 border border-pink-200'
          }`}>
            <div className="flex items-center gap-2 text-xs">
              {providerInfo[settings.selectedProvider].icon}
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                Connected to {providerInfo[settings.selectedProvider].name}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ml-auto ${
                darkMode ? 'bg-purple-400' : 'bg-pink-500'
              }`}></div>
            </div>
          </div>
        </div>

        {/* Quality Preference Section */}
        <div>
          <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
            <CogIcon />
            Response Quality
          </label>
          <div className={`relative rounded-lg border ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          } shadow-sm`}>
            <select 
              value={settings.qualityPreference} 
              onChange={handleQualityChange}
              className={`w-full p-3 pr-10 rounded-lg appearance-none cursor-pointer font-medium text-sm ${
                darkMode 
                  ? 'bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-500' 
                  : 'bg-white text-gray-900 focus:ring-2 focus:ring-pink-500'
              } focus:outline-none transition-all`}
            >
              {Object.entries(qualityInfo).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
          </div>
          {/* Quality indicator - compact */}
          <div className={`mt-2 p-2 rounded-lg ${
            darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 text-xs">
              {qualityInfo[settings.qualityPreference].icon}
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                {qualityInfo[settings.qualityPreference].description}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions - compact */}
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <KeyboardIcon />
            Quick Actions
          </label>
          <div className={`p-3 rounded-lg ${
            darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Toggle Chat</span>
                <kbd className={`px-1.5 py-0.5 text-xs rounded ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600 shadow-sm'
                } font-mono`}>Alt + F</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Quick Summary</span>
                <kbd className={`px-1.5 py-0.5 text-xs rounded ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600 shadow-sm'
                } font-mono`}>Ctrl + Alt + F</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className={`px-4 py-3 border-t ${
        darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
      } backdrop-blur-sm`}>
        <div className="flex items-center justify-between">
          <button 
            onClick={openOptions}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              darkMode 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/25' 
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-pink-500/25'
            } hover:scale-105`}
          >
            <SettingsIcon size="sm" />
            Options
          </button>
          
          <div className={`text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-xs font-medium">Version 2.7.0</div>
            <div className="text-xs opacity-75">Ready to assist</div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {message && (
        <div className={`fixed bottom-4 left-4 right-4 z-50 transition-all duration-300 transform ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}>
          <div className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border text-sm font-medium ${
            darkMode 
              ? 'bg-gray-800/90 text-gray-100 border-gray-700' 
              : 'bg-white/90 text-gray-900 border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckIcon className="text-green-500" size="sm" />
              {message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Popup;
