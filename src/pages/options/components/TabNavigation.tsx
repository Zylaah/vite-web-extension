import React from 'react';

type TabType = 'providers' | 'settings' | 'info' | 'history';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'providers', label: 'AI Providers' },
    { id: 'settings', label: 'Settings' },
    { id: 'info', label: 'Info' },
    { id: 'history', label: 'History' }
  ];

  return (
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
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '14px 28px',
            cursor: 'pointer',
            border: 'none',
            backgroundColor: activeTab === tab.id ? 'var(--button-primary)' : 'transparent',
            color: activeTab === tab.id ? 'white' : 'var(--text-color)',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = 'var(--subtle-bg)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}; 