import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// Base HUD Card Component
interface EnclaveCardProps extends HTMLMotionProps<"div"> {
  variant?: 'primary' | 'secondary' | 'warning';
  glowing?: boolean;
  children: React.ReactNode;
}

export const EnclaveCard: React.FC<EnclaveCardProps> = ({ 
  variant = 'primary', 
  glowing = false, 
  children, 
  className = '',
  ...props 
}) => {
  const getCardStyles = () => {
    const baseStyles = {
      background: 'var(--enclave-bg-secondary)',
      border: '1px solid var(--enclave-border)',
      borderRadius: '8px',
      padding: '20px',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    };

    if (variant === 'warning') {
      return {
        ...baseStyles,
        borderColor: 'var(--enclave-accent)',
        boxShadow: glowing ? '0 0 20px var(--enclave-accent-glow)' : 'var(--enclave-shadow-subtle)',
      };
    }

    return {
      ...baseStyles,
      boxShadow: glowing ? 'var(--enclave-shadow-glow)' : 'var(--enclave-shadow-subtle)',
    };
  };

  return (
    <motion.div
      className={`enclave-card ${className}`}
      style={getCardStyles()}
      whileHover={glowing ? { 
        boxShadow: variant === 'warning' ? '0 0 30px var(--enclave-accent-glow)' : 'var(--enclave-shadow-strong)',
        scale: 1.02 
      } : {}}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {/* Corner decorations */}
      <div className="enclave-corners">
        <div className="corner corner-tl"></div>
        <div className="corner corner-tr"></div>
        <div className="corner corner-bl"></div>
        <div className="corner corner-br"></div>
      </div>
      
      {children}
      
      <style jsx>{`
        .enclave-corners {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .corner {
          position: absolute;
          width: 12px;
          height: 12px;
          border: 2px solid var(--enclave-primary);
        }
        
        .corner-tl {
          top: -1px;
          left: -1px;
          border-right: none;
          border-bottom: none;
        }
        
        .corner-tr {
          top: -1px;
          right: -1px;
          border-left: none;
          border-bottom: none;
        }
        
        .corner-bl {
          bottom: -1px;
          left: -1px;
          border-right: none;
          border-top: none;
        }
        
        .corner-br {
          bottom: -1px;
          right: -1px;
          border-left: none;
          border-top: none;
        }
      `}</style>
    </motion.div>
  );
};

// HUD Button Component
interface EnclaveButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  plasma?: boolean;
  children: React.ReactNode;
}

export const EnclaveButton: React.FC<EnclaveButtonProps> = ({
  variant = 'primary',
  size = 'md',
  plasma = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getButtonStyles = () => {
    const sizeStyles = {
      sm: { padding: '8px 16px', fontSize: '14px' },
      md: { padding: '12px 24px', fontSize: '16px' },
      lg: { padding: '16px 32px', fontSize: '18px' }
    };

    const variantStyles = {
      primary: {
        background: 'linear-gradient(135deg, var(--enclave-primary) 0%, rgba(0, 180, 255, 0.8) 100%)',
        color: 'var(--enclave-bg-primary)',
        border: '1px solid var(--enclave-primary)',
      },
      secondary: {
        background: 'transparent',
        color: 'var(--enclave-primary)',
        border: '1px solid var(--enclave-primary)',
      },
      danger: {
        background: 'linear-gradient(135deg, var(--enclave-accent) 0%, rgba(255, 138, 0, 0.8) 100%)',
        color: 'var(--enclave-bg-primary)',
        border: '1px solid var(--enclave-accent)',
      },
      success: {
        background: 'linear-gradient(135deg, var(--enclave-text-success) 0%, rgba(0, 255, 136, 0.8) 100%)',
        color: 'var(--enclave-bg-primary)',
        border: '1px solid var(--enclave-text-success)',
      }
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
      borderRadius: '6px',
      fontFamily: 'var(--font-heading)',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      transition: 'var(--enclave-transition)',
    };
  };

  return (
    <motion.button
      className={`enclave-button ${className}`}
      style={getButtonStyles()}
      disabled={disabled}
      whileHover={disabled ? {} : {
        scale: 1.05,
        boxShadow: variant === 'danger' ? 'var(--enclave-accent-glow)' : 'var(--enclave-shadow-glow)',
      }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {plasma && (
        <motion.div
          className="plasma-effect"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </motion.button>
  );
};

// Progress Bar with Glow Effect
interface EnclaveProgressProps {
  value: number;
  max: number;
  label?: string;
  variant?: 'primary' | 'warning' | 'success';
  showPercentage?: boolean;
  glowWhenComplete?: boolean;
}

export const EnclaveProgress: React.FC<EnclaveProgressProps> = ({
  value,
  max,
  label,
  variant = 'primary',
  showPercentage = true,
  glowWhenComplete = true
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const isComplete = percentage >= 100;

  const getBarColor = () => {
    switch (variant) {
      case 'warning': return 'var(--enclave-accent)';
      case 'success': return 'var(--enclave-text-success)';
      default: return 'var(--enclave-primary)';
    }
  };

  return (
    <div className="enclave-progress">
      {label && (
        <div className="progress-header">
          <span className="progress-label">{label}</span>
          {showPercentage && (
            <span className="progress-value">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            backgroundColor: getBarColor(),
            boxShadow: isComplete && glowWhenComplete 
              ? `0 0 15px ${getBarColor()}` 
              : 'none',
          }}
        />
      </div>

      <style jsx>{`
        .enclave-progress {
          width: 100%;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .progress-label {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--enclave-text-secondary);
          font-weight: 500;
        }
        
        .progress-value {
          font-family: var(--font-heading);
          font-size: 14px;
          color: var(--enclave-primary);
          font-weight: 600;
        }
        
        .progress-track {
          width: 100%;
          height: 8px;
          background: var(--enclave-bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--enclave-border);
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: box-shadow 0.3s ease;
        }
      `}</style>
    </div>
  );
};

// Toggle Switch (Military Dial Style)
interface EnclaveToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const EnclaveToggle: React.FC<EnclaveToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false
}) => {
  return (
    <div className="enclave-toggle-container">
      {label && (
        <span className="toggle-label">{label}</span>
      )}
      
      <motion.button
        className="enclave-toggle"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
      >
        <motion.div
          className="toggle-track"
          animate={{
            backgroundColor: checked ? 'var(--enclave-primary)' : 'var(--enclave-bg-tertiary)',
            boxShadow: checked ? 'var(--enclave-shadow-glow)' : 'none',
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="toggle-thumb"
            animate={{
              x: checked ? 24 : 0,
              backgroundColor: checked ? 'var(--enclave-bg-primary)' : 'var(--enclave-text-dim)',
            }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
          />
        </motion.div>
      </motion.button>

      <style jsx>{`
        .enclave-toggle-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .toggle-label {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--enclave-text-secondary);
          font-weight: 500;
        }
        
        .enclave-toggle {
          background: none;
          border: none;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          opacity: ${disabled ? 0.5 : 1};
        }
        
        .toggle-track {
          width: 48px;
          height: 24px;
          border-radius: 12px;
          border: 1px solid var(--enclave-border);
          position: relative;
          display: flex;
          align-items: center;
          padding: 2px;
        }
        
        .toggle-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1px solid var(--enclave-border);
        }
      `}</style>
    </div>
  );
};