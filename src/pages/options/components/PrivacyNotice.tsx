import React from 'react';
import browser from 'webextension-polyfill';
import { HanaLogo } from '../../../components/Icons';

interface PrivacyNoticeProps {
  onAccept: () => void;
  onOpenPrivacyPolicy: () => void;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ onAccept, onOpenPrivacyPolicy }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--bg-color)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: 'var(--container-bg)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: 'var(--hover-shadow)',
        border: '1px solid var(--border-color)',
        textAlign: 'center',
        margin: 'auto 0'
      }}>
        {/* Welcome Header with Logo */}
        <div style={{
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <HanaLogo size="xl" showText={false} />
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            margin: '0 0 12px 0',
            color: 'var(--text-color)',
            letterSpacing: '-0.02em'
          }}>
            Welcome to Hana
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'var(--secondary-text)',
            margin: '0',
            fontWeight: '400'
          }}>
            Your AI-powered web assistant
          </p>
        </div>

        {/* Privacy Icon */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          backgroundColor: 'var(--button-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          fontSize: '28px'
        }}>
          🛡️
        </div>

        {/* Privacy Notice */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          margin: '0 0 16px 0',
          color: 'var(--text-color)'
        }}>
          Privacy & Data Usage
        </h2>
        
        <p style={{
          fontSize: '16px',
          color: 'var(--secondary-text)',
          margin: '0 0 24px 0',
          lineHeight: '1.6'
        }}>
          Hana sends page content to AI providers (OpenAI, Anthropic, Mistral, or DeepSeek) to provide intelligent responses. 
          Your data is processed according to each provider's privacy policy.
        </p>

        <div style={{
          backgroundColor: 'var(--accent-bg)',
          borderRadius: '16px',
          padding: '24px',
          margin: '0 0 32px 0',
          border: '1px solid var(--accent-border)'
        }}>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-color)',
            margin: '0',
            lineHeight: '1.6'
          }}>
            <strong>By accepting, you agree to:</strong><br/>
            • Send webpage content to your chosen AI provider<br/>
            • Follow the selected provider's terms of service<br/>
            • Allow Hana to store your preferences locally
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={onAccept}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: 'var(--button-primary)',
              color: 'white',
              transition: 'all 0.3s ease',
              minWidth: '160px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-primary)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Accept & Continue
          </button>
          
          <button
            onClick={onOpenPrivacyPolicy}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              minWidth: '160px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--container-bg)';
              e.currentTarget.style.borderColor = 'var(--button-primary)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Read Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
}; 