import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Status Indicator */}
      <div className="offline-status-indicator">
        <motion.div 
          className={`status-dot ${isOnline ? 'online' : 'offline'}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <span className="status-text">
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {/* Status Change Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            className="status-notification"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`notification-content ${isOnline ? 'online' : 'offline'}`}>
              <div className="notification-icon">
                {isOnline ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                )}
              </div>
              <div className="notification-text">
                <div className="notification-title">
                  {isOnline ? 'Back Online' : 'Offline Mode'}
                </div>
                <div className="notification-message">
                  {isOnline 
                    ? 'Syncing data with server...' 
                    : 'Working offline. Data will sync when connected.'
                  }
                </div>
              </div>
            </div>
            
            {/* Progress bar for online notification */}
            {isOnline && (
              <motion.div 
                className="sync-progress"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5 }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .offline-status-indicator {
          position: fixed;
          top: 80px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 23, 32, 0.9);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 20px;
          padding: 8px 12px;
          backdrop-filter: blur(10px);
          z-index: 1500;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.online {
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
        }

        .status-dot.offline {
          background: #ef4444;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }

        .status-text {
          color: rgba(255, 255, 255, 0.9);
        }

        .status-notification {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          max-width: 400px;
          width: calc(100% - 40px);
          background: rgba(15, 23, 32, 0.95);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 12px;
          padding: 16px;
          backdrop-filter: blur(20px);
          z-index: 2000;
          overflow: hidden;
        }

        .notification-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .notification-content.online {
          color: #22c55e;
        }

        .notification-content.offline {
          color: #ef4444;
        }

        .notification-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
        }

        .notification-text {
          flex: 1;
        }

        .notification-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
          color: #ffffff;
        }

        .notification-message {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }

        .sync-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, #00b4ff, #22c55e);
          border-radius: 0 0 12px 12px;
        }

        @media (max-width: 768px) {
          .offline-status-indicator {
            top: 70px;
            right: 15px;
            padding: 6px 10px;
            font-size: 11px;
          }

          .status-dot {
            width: 6px;
            height: 6px;
          }

          .status-notification {
            bottom: 90px;
            left: 20px;
            right: 20px;
            transform: none;
            width: auto;
            max-width: none;
          }

          .notification-content {
            gap: 10px;
          }

          .notification-icon {
            width: 32px;
            height: 32px;
          }

          .notification-title {
            font-size: 14px;
          }

          .notification-message {
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
};

export default OfflineStatusIndicator;