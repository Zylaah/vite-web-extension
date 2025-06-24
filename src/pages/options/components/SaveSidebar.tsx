import React from 'react';

interface SaveSidebarProps {
  isSaving: boolean;
  saveMessage: string;
  privacyAccepted: boolean;
  onSave: () => void;
}

export const SaveSidebar: React.FC<SaveSidebarProps> = ({
  isSaving,
  saveMessage,
  privacyAccepted,
  onSave
}) => {
  return (
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
          onClick={onSave}
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
  );
}; 