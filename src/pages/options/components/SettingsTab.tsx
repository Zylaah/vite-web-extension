import React, { useEffect } from 'react';

interface SettingsTabProps {
  customShortcut: string;
  setCustomShortcut: (shortcut: string) => void;
  isRecordingShortcut: boolean;
  setIsRecordingShortcut: (recording: boolean) => void;
  recordedKeys: string[];
  setRecordedKeys: (keys: string[]) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  customShortcut,
  setCustomShortcut,
  isRecordingShortcut,
  setIsRecordingShortcut,
  recordedKeys,
  setRecordedKeys
}) => {
  const startRecordingShortcut = () => {
    setIsRecordingShortcut(true);
    setRecordedKeys([]);
  };

  const handleShortcutKeyDown = (event: KeyboardEvent) => {
    if (!isRecordingShortcut) return;

    event.preventDefault();
    event.stopPropagation();

    // Handle Escape to apply or cancel the recorded shortcut
    if (event.key === 'Escape') {
      if (recordedKeys.length >= 2) {
        const newShortcut = recordedKeys.join('+');
        setCustomShortcut(newShortcut);
      }
      // Always stop recording on Escape, whether we apply or cancel
      setIsRecordingShortcut(false);
      setRecordedKeys([]);
      return;
    }

    // Capture modifier keys and regular keys
    const modifierKeys = ['Control', 'Alt', 'Shift', 'Meta'];
    const keys: string[] = [];

    // Add modifier keys
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    if (event.metaKey) keys.push('Meta');

    // Add the main key (if it's not a modifier itself)
    if (!modifierKeys.includes(event.key)) {
      keys.push(event.key.toUpperCase());
    }

    // Only update if we have at least one modifier + one key
    if (keys.length >= 2) {
      setRecordedKeys(keys);
    }
  };

  // Add event listener for shortcut recording
  useEffect(() => {
    if (isRecordingShortcut) {
      const handleClickOutside = (event: MouseEvent) => {
        // Cancel recording if clicking outside the shortcut area
        const target = event.target as HTMLElement;
        if (!target.closest('[data-shortcut-recorder]')) {
          setIsRecordingShortcut(false);
          setRecordedKeys([]);
        }
      };

      document.addEventListener('keydown', handleShortcutKeyDown, true);
      document.addEventListener('click', handleClickOutside, true);
      
      return () => {
        document.removeEventListener('keydown', handleShortcutKeyDown, true);
        document.removeEventListener('click', handleClickOutside, true);
      };
    }
  }, [isRecordingShortcut, recordedKeys]);

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto'
    }}>
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
          Keyboard Shortcuts
        </h2>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Editable Alt+F Shortcut */}
          <div data-shortcut-recorder style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '20px',
            backgroundColor: isRecordingShortcut ? 'var(--error-bg)' : 'var(--accent-bg)',
            borderRadius: '16px',
            border: `1px solid ${isRecordingShortcut ? 'var(--error-color)' : 'var(--accent-border)'}`,
            transition: 'all 0.3s ease'
          }}>
            <button
              onClick={startRecordingShortcut}
              disabled={isRecordingShortcut}
              style={{
                backgroundColor: isRecordingShortcut ? 'var(--error-color)' : 'var(--button-primary)',
                color: 'white',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'monospace',
                width: '140px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                cursor: isRecordingShortcut ? 'not-allowed' : 'pointer',
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >
              {isRecordingShortcut ? (
                recordedKeys.length > 0 ? recordedKeys.join('+') : 'Press keys...'
              ) : customShortcut}
              {isRecordingShortcut && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '16px',
                  height: '16px',
                  backgroundColor: 'var(--error-color)',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s infinite'
                }} />
              )}
            </button>
            <div style={{ flex: 1 }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0 0 4px 0',
                color: 'var(--text-color)'
              }}>
                Toggle AI overlay
              </h4>
              <p style={{
                fontSize: '14px',
                color: 'var(--secondary-text)',
                margin: '0 0 8px 0',
                lineHeight: '1.4'
              }}>
                {isRecordingShortcut 
                  ? 'Press a modifier key (Ctrl/Alt/Shift) + another key, then Escape to apply'
                  : 'Click to record a new shortcut combination'
                }
              </p>
              <div style={{
                fontSize: '12px',
                color: isRecordingShortcut 
                  ? (recordedKeys.length >= 2 ? 'var(--success-color)' : 'var(--error-color)')
                  : 'var(--success-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>
                  {isRecordingShortcut 
                    ? (recordedKeys.length >= 2 ? '✅' : '⏳') 
                    : '✅'
                  }
                </span>
                {isRecordingShortcut 
                  ? (recordedKeys.length >= 2 
                      ? 'Press Escape to apply this shortcut' 
                      : 'Need modifier + key combination')
                  : 'Current shortcut is active'
                }
              </div>
            </div>
          </div>

          {/* Fixed shortcuts */}
          {[
            { 
              shortcut: 'Ctrl+Alt+F', 
              description: 'Instant page summary',
              note: 'Automatically summarizes the current page content (fixed shortcut)'
            },
            { 
              shortcut: 'Enter', 
              description: 'Send message',
              note: 'Submit your question when typing in the chat'
            },
            { 
              shortcut: 'Escape', 
              description: 'Close overlay',
              note: 'Close the chat interface (chat mode only)'
            }
          ].map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '20px',
              backgroundColor: 'var(--subtle-bg)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                backgroundColor: 'var(--button-primary)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'monospace',
                width: '140px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                boxSizing: 'border-box'
              }}>
                {item.shortcut}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 4px 0',
                  color: 'var(--text-color)'
                }}>
                  {item.description}
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--secondary-text)',
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  {item.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 