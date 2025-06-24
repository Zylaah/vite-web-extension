import React from 'react';

interface IconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  xs: { width: '12px', height: '12px' },
  sm: { width: '16px', height: '16px' }, 
  md: { width: '20px', height: '20px' },
  lg: { width: '24px', height: '24px' },
  xl: { width: '32px', height: '32px' }
};

// Hana Logo Component
export const HanaLogo: React.FC<IconProps & { showText?: boolean }> = ({ 
  className = '', 
  size = 'md',
  showText = false 
}) => {
  const sizeStyle = sizeStyles[size];
  
  // Choose appropriate PNG based on size
  const getPngPath = () => {
    switch (size) {
      case 'xs':
      case 'sm':
        return '/icons/AI_16x16.png';
      case 'md':
      case 'lg':
        return '/icons/AI_48x48.png';
      case 'xl':
        return '/icons/AI_128x128.png';
      default:
        return '/icons/AI_48x48.png';
    }
  };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className={className}>
      <img 
        src={getPngPath()}
        alt="Hana Logo"
        style={{ ...sizeStyle, objectFit: 'contain' }}
      />
      {showText && <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Hana</span>}
    </div>
  );
};

// Modern SVG Icons
export const ChevronDownIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const RobotIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

export const LightningIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const CogIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
  </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const KeyboardIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="currentColor" viewBox="0 0 16 16">
    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="currentColor" viewBox="0 0 16 16">
    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
  </svg>
);

export const ExpandIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
  </svg>
);

export const CollapseIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export const SpinnerIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={{ ...sizeStyles[size], animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// AI Provider Icons with distinct styles
export const MistralIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

export const OpenAIIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142-.0852 4.783-2.7582a.7712.7712 0 0 0 .7806 0l5.8428 3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464z"/>
  </svg>
);

export const AnthropicIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
    <path d="M8 7h2l4 10h-2l-.8-2H9.2L8.4 17H6.4L8 7zm1.6 6h1.8l-.9-2.25L9.6 13z"/>
  </svg>
);

export const DeepSeekIcon: React.FC<IconProps> = ({ className = '', size = 'md' }) => (
  <svg className={className} style={sizeStyles[size]} fill="currentColor" viewBox="0 0 24 24">
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
); 