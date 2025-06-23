import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { StorageService } from '../../lib/services/storageService';
import type { AIProvider, UserSettings } from '../../lib/types';

const Popup: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    selectedProvider: 'mistral',
    qualityPreference: 'accurate',
    darkMode: false,
    highlightImportant: true
  });
  
  // Detect system dark mode for UI styling only
  const [systemDarkMode, setSystemDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load settings on mount
    const loadSettings = async () => {
      try {
        const userSettings = await StorageService.getSettings();
        setSettings(userSettings);
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
      await StorageService.updateSettings({ selectedProvider: newProvider });
      setMessage('Provider updated');
    } catch (error) {
      console.error('Error updating provider:', error);
      setMessage('Error updating provider');
    }
  };
  
  // Handle quality preference change
  const handleQualityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuality = e.target.value as 'fast' | 'accurate';
    setSettings(prev => ({ ...prev, qualityPreference: newQuality }));
    
    try {
      await StorageService.updateSettings({ qualityPreference: newQuality });
      setMessage('Quality preference updated');
    } catch (error) {
      console.error('Error updating quality preference:', error);
      setMessage('Error updating quality preference');
    }
  };
  

  
  // Handle highlight toggle
  const handleHighlightToggle = async () => {
    const newHighlight = !settings.highlightImportant;
    setSettings(prev => ({ ...prev, highlightImportant: newHighlight }));
    
    try {
      await StorageService.updateSettings({ highlightImportant: newHighlight });
      setMessage(`Highlighting ${newHighlight ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating highlight setting:', error);
      setMessage('Error updating highlight setting');
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
    <div className={`p-4 min-w-[300px] ${systemDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
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
          className={`w-full p-2 rounded border ${systemDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
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
          className={`w-full p-2 rounded border ${systemDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          <option value="fast">Fast (smaller model)</option>
          <option value="accurate">Accurate (larger model)</option>
        </select>
      </div>
      
      <div className="mb-4 flex items-center">
        <input 
          type="checkbox" 
          id="highlight" 
          checked={settings.highlightImportant}
          onChange={handleHighlightToggle}
          className="mr-2"
        />
        <label htmlFor="highlight" className="text-sm">Highlight important information</label>
      </div>
      
      <div className="border-t pt-4 mt-4 flex justify-between">
        <button 
          onClick={openOptions}
          className={`px-4 py-2 rounded ${
            systemDarkMode 
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
