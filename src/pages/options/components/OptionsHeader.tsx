import React from 'react';
import { HanaLogo } from '../../../components/Icons';

interface OptionsHeaderProps {
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
}

export const OptionsHeader: React.FC<OptionsHeaderProps> = ({ darkMode, onDarkModeChange }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '48px',
      padding: '0 8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          paddingTop: '12px' // Align logo with the center of the "Hana" text
        }}>
          <HanaLogo size="xl" showText={false} />
        </div>
        <div>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '700',
            margin: '0',
            color: 'var(--text-color)',
            letterSpacing: '-0.02em',
            lineHeight: '1.1'
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
        onClick={() => onDarkModeChange(!darkMode)}
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
  );
}; 