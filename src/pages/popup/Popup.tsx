import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { StorageService, type SettingsData } from '../../lib/services/storageService';
import type { AIProvider } from '../../lib/types';

const Popup: React.FC = () => {
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
        setMessage('Error loading settings');
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // Handle provider change
  const handleProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AIProvider;
    setSettings(prev => ({ ...prev, selectedProvider: newProvider }));
    
    try {
      await StorageService.saveSettings({ selectedProvider: newProvider });
      setMessage('Provider updated');
    } catch (error) {
      console.error('Error updating provider:', error);
      setMessage('Error updating provider');
    }
  };
  
  // Handle quality preference change
  const handleQualityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuality = e.target.value;
    setSettings(prev => ({ ...prev, qualityPreference: newQuality }));
    
    try {
      await StorageService.saveSettings({ qualityPreference: newQuality });
      setMessage('Quality preference updated');
    } catch (error) {
      console.error('Error updating quality preference:', error);
      setMessage('Error updating quality preference');
    }
  };
  
  // Open options page
  const openOptions = () => {
    browser.runtime.openOptionsPage();
  };

  if (loading) {
    return <div className="p-4 text-center">Loading settings...</div>;
  }

  return (
    <div className={`p-4 min-w-[300px] ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Hana AI Assistant</h1>
      </div>
      
      {message && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded text-sm">
          {message}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">AI Provider</label>
        <select 
          value={settings.selectedProvider} 
          onChange={handleProviderChange}
          className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          <option value="mistral">Mistral AI</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="deepseek">DeepSeek</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Quality Preference</label>
        <select 
          value={settings.qualityPreference} 
          onChange={handleQualityChange}
          className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          <option value="balanced">Balanced</option>
          <option value="fast">Fast</option>
          <option value="accurate">Accurate</option>
        </select>
      </div>
      

      
      <div className="border-t pt-4 mt-4 flex justify-between">
        <button 
          onClick={openOptions}
          className={`px-4 py-2 rounded ${
            darkMode 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-pink-600 hover:bg-pink-700 text-white'
          }`}
        >
          Open Settings
        </button>
        
        <div className="text-xs opacity-75 text-right">
          <div>Version 2.7.0</div>
          <div className="mt-1">Press Alt+F to activate</div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
