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
          background: #0b0f14;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
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
          border-top: 1px solid rgba(0, 180, 255, 0.2);
          display: flex;
          justify-content: space-around;
          padding: 10px 0;
          z-index: 1000;
        }

        .nav-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .nav-btn:hover {
          color: #00b4ff;
          background: rgba(0, 180, 255, 0.1);
        }

        .nav-btn.active {
          color: #00b4ff;
          background: rgba(0, 180, 255, 0.15);
          box-shadow: 0 0 20px rgba(0, 180, 255, 0.3);
        }

        .nav-btn svg {
          width: 24px;
          height: 24px;
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