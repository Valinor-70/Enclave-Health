import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, dbHelpers, UserProfile } from './db/db';

// Components
import Header from './components/Header';
import OnboardingWizard from './components/OnboardingWizard';
import Dashboard from './components/Dashboard';
import WorkoutPlanner from './components/WorkoutPlanner';
import MealPlanner from './components/MealPlanner';
import Graphs from './components/Graphs';
import OfflineStatusIndicator from './components/OfflineStatusIndicator';

// Types
type Tab = 'dashboard' | 'workouts' | 'meals' | 'graphs';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  // Hide loading screen when app is ready
  useEffect(() => {
    if (!isLoading) {
      const hideLoadingScreen = () => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.style.opacity = '0';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
          }, 300);
        }
      };
      // Small delay to ensure smooth transition
      setTimeout(hideLoadingScreen, 50);
    }
  }, [isLoading]);

  const initializeApp = async () => {
    try {
      // Initialize database
      await db.open();
      
      // Check for existing user
      const user = await dbHelpers.getCurrentUser();
      
      if (user) {
        setCurrentUser(user);
      } else {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setCurrentUser(profile);
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div style={{ 
        background: '#0b0f14', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ color: '#00b4ff', fontSize: '18px' }}>Initializing EnclaveFit...</div>
      </div>
    );
  }

  if (showOnboarding || !currentUser) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={currentUser} />;
      case 'workouts':
        return <WorkoutPlanner user={currentUser} />;
      case 'meals':
        return <MealPlanner user={currentUser} />;
      case 'graphs':
        return <Graphs user={currentUser} />;
      default:
        return <Dashboard user={currentUser} />;
    }
  };

  return (
    <div className="app">
      <Header user={currentUser} />
      
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="bottom-nav">
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Dashboard</span>
        </button>
        
        <button 
          className={`nav-btn ${activeTab === 'workouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('workouts')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
          </svg>
          <span>Workouts</span>
        </button>
        
        <button 
          className={`nav-btn ${activeTab === 'meals' ? 'active' : ''}`}
          onClick={() => setActiveTab('meals')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.20-1.10-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
          </svg>
          <span>Meals</span>
        </button>
        
        <button 
          className={`nav-btn ${activeTab === 'graphs' ? 'active' : ''}`}
          onClick={() => setActiveTab('graphs')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
          </svg>
          <span>Graphs</span>
        </button>
      </nav>

      <OfflineStatusIndicator />

      <style>{`
        .app {
          min-height: 100vh;
          background: var(--enclave-bg-primary);
          color: var(--enclave-text-primary);
          font-family: var(--font-body);
          position: relative;
          padding-bottom: 80px;
        }

        .main-content {
          padding: 20px;
          padding-top: 100px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(15, 23, 32, 0.95);
          backdrop-filter: blur(20px);
          border-top: 2px solid var(--enclave-border);
          display: flex;
          justify-content: space-around;
          padding: 12px 8px;
          z-index: 1000;
          position: relative;
        }

        .bottom-nav::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(0, 180, 255, 0.05) 50%, transparent 100%);
          pointer-events: none;
        }

        .bottom-nav::after {
          content: '';
          position: absolute;
          top: -2px;
          left: 20px;
          right: 20px;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, var(--enclave-primary) 50%, transparent 100%);
          animation: navScan 3s ease-in-out infinite;
        }

        @keyframes navScan {
          0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
          50% { opacity: 1; transform: scaleX(1); }
        }

        .nav-btn {
          background: none;
          border: 1px solid transparent;
          color: var(--enclave-text-dim);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 8px;
          transition: var(--enclave-transition);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-heading);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          z-index: 1;
        }

        .nav-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 0%, var(--enclave-primary-dim) 50%, transparent 100%);
          border-radius: 8px;
          opacity: 0;
          transition: var(--enclave-transition);
        }

        .nav-btn:hover {
          color: var(--enclave-primary);
          border-color: var(--enclave-border);
          transform: translateY(-2px);
        }

        .nav-btn:hover::before {
          opacity: 1;
        }

        .nav-btn.active {
          color: var(--enclave-primary);
          border-color: var(--enclave-primary);
          background: var(--enclave-primary-dim);
          box-shadow: var(--enclave-shadow-glow);
          text-shadow: 0 0 8px var(--enclave-primary-glow);
        }

        .nav-btn.active::before {
          opacity: 1;
        }

        .nav-btn svg {
          width: 24px;
          height: 24px;
          filter: drop-shadow(0 0 4px currentColor);
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 15px;
            padding-top: 80px;
          }
          
          .nav-btn {
            padding: 6px 8px;
            font-size: 11px;
          }
          
          .nav-btn svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;