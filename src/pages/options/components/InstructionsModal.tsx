import React from 'react';

interface InstructionsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
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
          onClick={onClose}
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
  );
}; 