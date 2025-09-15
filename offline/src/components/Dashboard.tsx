import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserProfile, db, dbHelpers, WorkoutLog, WorkoutPlan, MealLog } from '../db/db';
import { EvaluationModel } from '../logic/evaluation';
import { EnclaveCard, EnclaveButton, EnclaveProgress } from './EnclaveUI';

interface DashboardProps {
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [todayData, setTodayData] = useState<{
    workoutLogs: WorkoutLog[];
    mealLogs: MealLog[];
    progressEntries: any[];
  } | null>(null);
  const [currentWorkoutPlan, setCurrentWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Get today's data
      const data = await dbHelpers.getTodayData(user.id!);
      setTodayData(data);

      // Get current plans
      const [workoutPlans] = await Promise.all([
        db.workoutPlans.where('userId').equals(user.id!).toArray()
      ]);

      if (workoutPlans.length > 0) {
        setCurrentWorkoutPlan(workoutPlans[0]);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markWorkoutComplete = async () => {
    if (!currentWorkoutPlan) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const workoutLog: WorkoutLog = {
        userId: user.id!,
        workoutPlanId: currentWorkoutPlan.id!,
        date: today,
        exercises: currentWorkoutPlan.exercises.map(exercise => ({
          exerciseId: exercise.id || 0,
          sets: [{ reps: 0, weight: 0, completed: true }],
        })),
        completed: true,
        createdAt: new Date()
      };

      await db.workoutLogs.add(workoutLog);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to mark workout complete:', error);
    }
  };

  const generatePersonalizedPlan = () => {
    return EvaluationModel.createPersonalizedPlan(user);
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const personalizedPlan = generatePersonalizedPlan();
  const hasCompletedWorkout = todayData?.workoutLogs.some(log => log.completed === true);

  return (
    <div className="dashboard">
      {/* Welcome Section with enhanced HUD styling */}
      <motion.div 
        className="mission-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <h1>Mission Control</h1>
          <p>Your daily protocol status and objectives</p>
          {/* Add Enclave flag icon */}
          <div className="enclave-flag">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              <path d="M4 6h24v20l-8-4-8 4V6z" stroke="currentColor" strokeWidth="2" fill="var(--enclave-primary)" opacity="0.3"/>
              <circle cx="16" cy="12" r="3" fill="var(--enclave-primary)"/>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Grid with HUD Cards */}
      <motion.div 
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <EnclaveCard variant="primary" glowing={true}>
          <div className="hud-stat-card">
            <div className="stat-icon target">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="16" cy="16" r="2" fill="currentColor"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Current Goal</div>
              <div className="stat-value">{user.fitnessAim.replace('_', ' ').toUpperCase()}</div>
            </div>
          </div>
        </EnclaveCard>

        <EnclaveCard variant="primary" glowing={true}>
          <div className="hud-stat-card">
            <div className="stat-icon energy">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                <path d="M13 2L3 14h6l-2 16 10-12h-6l4-16z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Daily Calories</div>
              <div className="stat-value">{personalizedPlan.nutritionPlan.totalCalories}</div>
            </div>
          </div>
        </EnclaveCard>

        <EnclaveCard variant="primary" glowing={true}>
          <div className="hud-stat-card">
            <div className="stat-icon muscle">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                <path d="M8 14c0-2 1-4 3-4s3 2 3 4v4c0 2 1 4 3 4s3-2 3-4v-4c0-2 1-4 3-4s3 2 3 4v10c0 3-2 5-5 5h-8c-3 0-5-2-5-5V14z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Training Days</div>
              <div className="stat-value">{personalizedPlan.workoutProgram.frequency}/week</div>
            </div>
          </div>
        </EnclaveCard>

        <EnclaveCard variant="primary" glowing={true}>
          <div className="hud-stat-card">
            <div className="stat-icon weight">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                <rect x="6" y="12" width="20" height="8" rx="2"/>
                <rect x="12" y="8" width="8" height="4" rx="1"/>
                <rect x="14" y="20" width="4" height="4" rx="1"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Current Weight</div>
              <div className="stat-value">{user.weight} kg</div>
            </div>
          </div>
        </EnclaveCard>
      </motion.div>

      {/* Today's Mission with enhanced styling */}
      <motion.div 
        className="mission-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <EnclaveCard variant="primary" glowing={!hasCompletedWorkout}>
          <div className="mission-header-card">
            <h2>Today's Mission</h2>
            <div className={`mission-status ${hasCompletedWorkout ? 'completed' : 'pending'}`}>
              {hasCompletedWorkout ? (
                <>
                  <span className="status-dot completed"></span>
                  COMPLETED
                </>
              ) : (
                <>
                  <span className="status-dot pending"></span>
                  PENDING
                </>
              )}
            </div>
          </div>

          {hasCompletedWorkout ? (
            <div className="mission-completed">
              <div className="completion-badge">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor">
                  <circle cx="24" cy="24" r="20" fill="var(--enclave-text-success)" opacity="0.2"/>
                  <path d="M20 24l4 4 8-8" stroke="var(--enclave-text-success)" strokeWidth="3" fill="none"/>
                </svg>
              </div>
              <div className="completion-content">
                <h3>Mission Accomplished</h3>
                <p>Today's training protocol has been executed successfully. Outstanding work, soldier!</p>
              </div>
            </div>
          ) : (
            <div className="mission-active">
              <h3 className="program-name">{personalizedPlan.workoutProgram.name}</h3>
              <div className="exercise-protocol">
                {personalizedPlan.workoutProgram.workouts[0]?.exercises.slice(0, 4).map((exercise, index) => (
                  <motion.div 
                    key={index} 
                    className="exercise-entry"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="exercise-pip">
                      <span className="pip-indicator"></span>
                    </div>
                    <span className="exercise-name">{exercise.name}</span>
                    <span className="exercise-specs">{exercise.sets} × {exercise.reps}</span>
                  </motion.div>
                ))}
                {personalizedPlan.workoutProgram.workouts[0]?.exercises.length > 4 && (
                  <div className="exercise-entry more">
                    <div className="exercise-pip">
                      <span className="pip-indicator dim"></span>
                    </div>
                    <span className="exercise-more">+{personalizedPlan.workoutProgram.workouts[0].exercises.length - 4} more exercises</span>
                  </div>
                )}
              </div>
              
              <EnclaveButton 
                variant="success" 
                plasma={true}
                onClick={markWorkoutComplete}
                className="mission-complete-btn"
              >
                Mark Mission Complete
              </EnclaveButton>
            </div>
          )}
        </EnclaveCard>
      </motion.div>

      {/* Nutrition Protocol with macro progress bars */}
      <motion.div 
        className="nutrition-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <EnclaveCard variant="primary" glowing={true}>
          <div className="mission-header-card">
            <h2>Nutrition Protocol</h2>
            <div className="mission-status target">
              <span className="status-dot target"></span>
              TARGET
            </div>
          </div>

          <div className="macro-grid">
            <div className="macro-container">
              <EnclaveProgress
                value={0}
                max={personalizedPlan.nutritionPlan.protein}
                label="Protein"
                variant="primary"
                glowWhenComplete={true}
              />
              <div className="macro-stats">
                <span className="macro-target">{personalizedPlan.nutritionPlan.protein}g</span>
                <span className="macro-percent">({personalizedPlan.nutritionPlan.proteinPercent}%)</span>
              </div>
            </div>
            
            <div className="macro-container">
              <EnclaveProgress
                value={0}
                max={personalizedPlan.nutritionPlan.carbs}
                label="Carbohydrates"
                variant="warning"
                glowWhenComplete={true}
              />
              <div className="macro-stats">
                <span className="macro-target">{personalizedPlan.nutritionPlan.carbs}g</span>
                <span className="macro-percent">({personalizedPlan.nutritionPlan.carbsPercent}%)</span>
              </div>
            </div>
            
            <div className="macro-container">
              <EnclaveProgress
                value={0}
                max={personalizedPlan.nutritionPlan.fat}
                label="Fat"
                variant="success"
                glowWhenComplete={true}
              />
              <div className="macro-stats">
                <span className="macro-target">{personalizedPlan.nutritionPlan.fat}g</span>
                <span className="macro-percent">({personalizedPlan.nutritionPlan.fatPercent}%)</span>
              </div>
            </div>
          </div>
        </EnclaveCard>
      </motion.div>

      {/* Enhanced Quick Actions */}
      <motion.div 
        className="action-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <EnclaveButton variant="secondary" size="lg" plasma={true}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Log Workout
        </EnclaveButton>
        
        <EnclaveButton variant="secondary" size="lg" plasma={true}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 5z"/>
          </svg>
          Log Meal
        </EnclaveButton>
        
        <EnclaveButton variant="secondary" size="lg" plasma={true}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
          </svg>
          View Progress
        </EnclaveButton>
      </motion.div>

      <style>{`
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: var(--enclave-text-secondary);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--enclave-border);
          border-top: 3px solid var(--enclave-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
          box-shadow: var(--enclave-shadow-glow);
        }

        /* Mission Header with Enclave styling */
        .mission-header {
          text-align: center;
          margin-bottom: 40px;
          position: relative;
        }

        .header-content {
          position: relative;
          padding: 32px;
          background: var(--enclave-bg-secondary);
          border: 2px solid var(--enclave-border);
          border-radius: 16px;
          overflow: hidden;
        }

        .header-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 0%, var(--enclave-primary-dim) 50%, transparent 100%);
          pointer-events: none;
        }

        .header-content h1 {
          font-family: var(--font-display);
          font-size: 42px;
          color: var(--enclave-primary);
          margin: 0 0 12px 0;
          text-shadow: 0 0 30px var(--enclave-primary-glow);
          text-transform: uppercase;
          letter-spacing: 3px;
          position: relative;
          z-index: 1;
        }

        .header-content p {
          color: var(--enclave-text-secondary);
          font-size: 18px;
          margin: 0;
          font-family: var(--font-body);
          position: relative;
          z-index: 1;
        }

        .enclave-flag {
          position: absolute;
          top: 20px;
          right: 20px;
          color: var(--enclave-primary);
          opacity: 0.6;
          z-index: 1;
        }

        /* Enhanced Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .hud-stat-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 8px;
        }

        .stat-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--enclave-bg-tertiary);
          border: 2px solid var(--enclave-primary);
          border-radius: 12px;
          color: var(--enclave-primary);
          position: relative;
          overflow: hidden;
        }

        .stat-icon::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, var(--enclave-primary-dim) 50%, transparent 70%);
          animation: sweep 3s linear infinite;
        }

        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          color: var(--enclave-text-secondary);
          font-size: 14px;
          margin-bottom: 6px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--font-heading);
        }

        .stat-value {
          color: var(--enclave-text-primary);
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          font-family: var(--font-heading);
          text-shadow: 0 0 10px var(--enclave-primary-glow);
        }

        /* Mission Section */
        .mission-section,
        .nutrition-section {
          margin-bottom: 32px;
        }

        .mission-header-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--enclave-border);
        }

        .mission-header-card h2 {
          font-family: var(--font-display);
          color: var(--enclave-primary);
          font-size: 28px;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 15px var(--enclave-primary-glow);
        }

        .mission-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          font-family: var(--font-heading);
          text-transform: uppercase;
        }

        .mission-status.completed {
          background: rgba(0, 255, 136, 0.2);
          color: var(--enclave-text-success);
          border: 1px solid var(--enclave-text-success);
          box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
        }

        .mission-status.pending {
          background: var(--enclave-accent-glow);
          color: var(--enclave-accent);
          border: 1px solid var(--enclave-accent);
          box-shadow: 0 0 15px var(--enclave-accent-glow);
        }

        .mission-status.target {
          background: var(--enclave-primary-glow);
          color: var(--enclave-primary);
          border: 1px solid var(--enclave-primary);
          box-shadow: var(--enclave-shadow-glow);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .status-dot.completed {
          background: var(--enclave-text-success);
        }

        .status-dot.pending {
          background: var(--enclave-accent);
        }

        .status-dot.target {
          background: var(--enclave-primary);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Mission Completed */
        .mission-completed {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 32px;
          background: rgba(0, 255, 136, 0.1);
          border: 2px solid var(--enclave-text-success);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }

        .mission-completed::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(0, 255, 136, 0.05) 50%, transparent 100%);
        }

        .completion-badge {
          position: relative;
          z-index: 1;
        }

        .completion-content {
          position: relative;
          z-index: 1;
        }

        .completion-content h3 {
          color: var(--enclave-text-success);
          margin: 0 0 8px 0;
          font-size: 24px;
          font-family: var(--font-heading);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .completion-content p {
          color: var(--enclave-text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        /* Mission Active */
        .mission-active {
          position: relative;
        }

        .program-name {
          color: var(--enclave-text-primary);
          margin: 0 0 20px 0;
          font-size: 20px;
          font-family: var(--font-heading);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .exercise-protocol {
          margin-bottom: 24px;
        }

        .exercise-entry {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid var(--enclave-border);
          transition: var(--enclave-transition);
        }

        .exercise-entry:hover {
          background: var(--enclave-primary-dim);
        }

        .exercise-entry:last-child {
          border-bottom: none;
        }

        .exercise-pip {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pip-indicator {
          width: 12px;
          height: 12px;
          border: 2px solid var(--enclave-primary);
          border-radius: 50%;
          background: var(--enclave-bg-tertiary);
          position: relative;
        }

        .pip-indicator::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 4px;
          height: 4px;
          background: var(--enclave-primary);
          border-radius: 50%;
          animation: pip-glow 2s ease-in-out infinite;
        }

        .pip-indicator.dim {
          border-color: var(--enclave-text-dim);
          opacity: 0.5;
        }

        .pip-indicator.dim::after {
          background: var(--enclave-text-dim);
          animation: none;
        }

        @keyframes pip-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .exercise-name {
          color: var(--enclave-text-primary);
          font-weight: 500;
          flex: 1;
          font-family: var(--font-body);
        }

        .exercise-specs {
          color: var(--enclave-text-secondary);
          font-size: 14px;
          font-family: var(--font-heading);
          font-weight: 600;
        }

        .exercise-entry.more .exercise-more {
          color: var(--enclave-text-dim);
          font-style: italic;
          flex: 1;
        }

        .mission-complete-btn {
          width: 100%;
          margin-top: 8px;
        }

        /* Macro Grid */
        .macro-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .macro-container {
          padding: 20px;
          background: var(--enclave-bg-tertiary);
          border: 1px solid var(--enclave-border);
          border-radius: 12px;
          transition: var(--enclave-transition);
        }

        .macro-container:hover {
          border-color: var(--enclave-primary);
          box-shadow: var(--enclave-shadow-glow);
        }

        .macro-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }

        .macro-target {
          color: var(--enclave-text-primary);
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 18px;
        }

        .macro-percent {
          color: var(--enclave-text-secondary);
          font-size: 14px;
          font-family: var(--font-body);
        }

        /* Action Grid */
        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 0 15px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .macro-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .action-grid {
            grid-template-columns: 1fr;
          }

          .header-content h1 {
            font-size: 32px;
          }

          .mission-header-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .mission-completed {
            flex-direction: column;
            text-align: center;
          }

          .hud-stat-card {
            gap: 16px;
          }

          .stat-icon {
            width: 56px;
            height: 56px;
          }

          .enclave-flag {
            position: static;
            margin-top: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;