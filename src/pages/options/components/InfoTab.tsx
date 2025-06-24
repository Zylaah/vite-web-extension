import React from 'react';

interface InfoTabProps {
  onShowInstructions: () => void;
  onOpenPrivacyPolicy: () => void;
}

export const InfoTab: React.FC<InfoTabProps> = ({ onShowInstructions, onOpenPrivacyPolicy }) => {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }}>
      {/* How to Use Card */}
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
          How to Use Hana
        </h2>

        <p style={{
          fontSize: '16px',
          color: 'var(--secondary-text)',
          margin: '0 0 24px 0',
          lineHeight: '1.6'
        }}>
          Hana is your AI-powered web assistant that helps you understand and interact with webpage content.
        </p>

        <button
          onClick={onShowInstructions}
          style={{
            backgroundColor: 'var(--button-primary)',
            border: 'none',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-primary)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
        >
          View Detailed Instructions
        </button>
      </div>

      {/* About Card */}
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
          About Hana
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: 'var(--subtle-bg)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--button-primary)',
              marginBottom: '8px'
            }}>
              v2.7.0
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--secondary-text)'
            }}>
              Current Version
            </div>
          </div>
          
          <div style={{
            padding: '20px',
            backgroundColor: 'var(--subtle-bg)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--button-secondary)',
              marginBottom: '8px'
            }}>
              4+
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--secondary-text)'
            }}>
              AI Providers
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <button
            onClick={onOpenPrivacyPolicy}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--subtle-bg)';
              e.currentTarget.style.borderColor = 'var(--button-primary)';
              e.currentTarget.style.color = 'var(--button-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-color)';
            }}
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
}; 