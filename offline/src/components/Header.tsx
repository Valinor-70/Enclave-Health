import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../db/db';

interface HeaderProps {
  user: UserProfile;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="header">
      <div className="header-content">
        <motion.div 
          className="logo-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img 
            src="/icons/enclave-flag-192.png" 
            alt="EnclaveFit" 
            className="logo-icon"
          />
          <div className="logo-text">
            <h1 className="app-title">EnclaveFit</h1>
            <div className="tagline">Elite Training Protocol</div>
          </div>
        </motion.div>

        <motion.div 
          className="user-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="user-info">
            <div className="welcome-text">Welcome back,</div>
            <div className="user-name">{user.name}</div>
          </div>
          <div className="user-avatar">
            <div className="avatar-icon">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </motion.div>
      </div>

      {/* HUD Line Effect */}
      <div className="hud-line">
        <motion.div 
          className="hud-pulse"
          animate={{ 
            x: ['0%', '100%'],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(15, 23, 32, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 180, 255, 0.3);
          z-index: 1000;
          overflow: hidden;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 2px solid #00b4ff;
          box-shadow: 0 0 15px rgba(0, 180, 255, 0.4);
          background: rgba(0, 180, 255, 0.1);
          padding: 2px;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .app-title {
          font-family: 'Orbitron', monospace;
          font-size: 24px;
          font-weight: 900;
          color: #00b4ff;
          text-shadow: 0 0 10px rgba(0, 180, 255, 0.5);
          margin: 0;
          line-height: 1;
        }

        .tagline {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-info {
          text-align: right;
          display: flex;
          flex-direction: column;
        }

        .welcome-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 400;
        }

        .user-name {
          font-size: 16px;
          color: #ffffff;
          font-weight: 600;
        }

        .user-avatar {
          position: relative;
        }

        .avatar-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00b4ff, #ff8a00);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
          color: #ffffff;
          box-shadow: 0 0 15px rgba(0, 180, 255, 0.3);
          border: 2px solid rgba(0, 180, 255, 0.5);
        }

        .hud-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(0, 180, 255, 0.3), 
            rgba(0, 180, 255, 0.6), 
            rgba(0, 180, 255, 0.3), 
            transparent
          );
          overflow: hidden;
        }

        .hud-pulse {
          position: absolute;
          top: 0;
          left: 0;
          width: 100px;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent, 
            #00b4ff, 
            transparent
          );
          filter: blur(1px);
        }

        @media (max-width: 768px) {
          .header-content {
            padding: 12px 15px;
          }

          .logo-icon {
            width: 32px;
            height: 32px;
          }

          .app-title {
            font-size: 20px;
          }

          .tagline {
            font-size: 10px;
          }

          .user-info {
            display: none;
          }

          .avatar-icon {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .logo-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;