import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserProfile, db, dbHelpers, WorkoutLog, WorkoutPlan, MealLog } from '../db/db';
import { EvaluationModel } from '../logic/evaluation';

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
      {/* Welcome Section */}
      <motion.div 
        className="welcome-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Mission Control</h1>
        <p>Your daily protocol status and objectives</p>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div 
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Current Goal</h3>
            <p>{user.fitnessAim.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Daily Calories</h3>
            <p>{personalizedPlan.nutritionPlan.totalCalories}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💪</div>
          <div className="stat-content">
            <h3>Training Days</h3>
            <p>{personalizedPlan.workoutProgram.frequency}/week</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Current Weight</h3>
            <p>{user.weight} kg</p>
          </div>
        </div>
      </motion.div>

      {/* Today's Workout Section */}
      <motion.div 
        className="section-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="section-header">
          <h2>Today's Mission</h2>
          <div className={`status-indicator ${hasCompletedWorkout ? 'completed' : 'pending'}`}>
            {hasCompletedWorkout ? 'COMPLETED' : 'PENDING'}
          </div>
        </div>

        {hasCompletedWorkout ? (
          <div className="completed-workout">
            <div className="completion-icon">✅</div>
            <div className="completion-text">
              <h3>Mission Accomplished</h3>
              <p>Today's workout has been completed. Great work!</p>
            </div>
          </div>
        ) : (
          <div className="workout-preview">
            <h3>{personalizedPlan.workoutProgram.name}</h3>
            <div className="exercise-list">
              {personalizedPlan.workoutProgram.workouts[0]?.exercises.slice(0, 4).map((exercise, index) => (
                <div key={index} className="exercise-item">
                  <span className="exercise-name">{exercise.name}</span>
                  <span className="exercise-details">{exercise.sets} × {exercise.reps}</span>
                </div>
              ))}
              {personalizedPlan.workoutProgram.workouts[0]?.exercises.length > 4 && (
                <div className="exercise-item more">
                  <span>+{personalizedPlan.workoutProgram.workouts[0].exercises.length - 4} more exercises</span>
                </div>
              )}
            </div>
            
            <button className="complete-btn" onClick={markWorkoutComplete}>
              <span>Mark as Complete</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            </button>
          </div>
        )}
      </motion.div>

      {/* Nutrition Section */}
      <motion.div 
        className="section-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="section-header">
          <h2>Nutrition Protocol</h2>
          <div className="status-indicator pending">TARGET</div>
        </div>

        <div className="nutrition-targets">
          <div className="macro-item">
            <div className="macro-label">Protein</div>
            <div className="macro-value">{personalizedPlan.nutritionPlan.protein}g</div>
            <div className="macro-percent">{personalizedPlan.nutritionPlan.proteinPercent}%</div>
          </div>
          
          <div className="macro-item">
            <div className="macro-label">Carbs</div>
            <div className="macro-value">{personalizedPlan.nutritionPlan.carbs}g</div>
            <div className="macro-percent">{personalizedPlan.nutritionPlan.carbsPercent}%</div>
          </div>
          
          <div className="macro-item">
            <div className="macro-label">Fat</div>
            <div className="macro-value">{personalizedPlan.nutritionPlan.fat}g</div>
            <div className="macro-percent">{personalizedPlan.nutritionPlan.fatPercent}%</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="quick-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <button className="action-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Log Workout
        </button>
        
        <button className="action-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 5z"/>
          </svg>
          Log Meal
        </button>
        
        <button className="action-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
          </svg>
          View Progress
        </button>
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
          color: rgba(255, 255, 255, 0.7);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 180, 255, 0.3);
          border-top: 3px solid #00b4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .welcome-section {
          text-align: center;
          margin-bottom: 32px;
        }

        .welcome-section h1 {
          font-family: 'Orbitron', monospace;
          font-size: 36px;
          color: #00b4ff;
          margin: 0 0 8px 0;
          text-shadow: 0 0 20px rgba(0, 180, 255, 0.5);
        }

        .welcome-section p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: rgba(15, 23, 32, 0.8);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: #00b4ff;
          box-shadow: 0 0 20px rgba(0, 180, 255, 0.2);
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 32px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 180, 255, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(0, 180, 255, 0.3);
        }

        .stat-content h3 {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin: 0 0 4px 0;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-content p {
          color: #ffffff;
          font-size: 20px;
          font-weight: 700;
          margin: 0;
        }

        .section-card {
          background: rgba(15, 23, 32, 0.8);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          backdrop-filter: blur(10px);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-family: 'Orbitron', monospace;
          color: #00b4ff;
          font-size: 24px;
          margin: 0;
        }

        .status-indicator {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .status-indicator.completed {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid #22c55e;
        }

        .status-indicator.pending {
          background: rgba(255, 138, 0, 0.2);
          color: #ff8a00;
          border: 1px solid #ff8a00;
        }

        .completed-workout {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid #22c55e;
          border-radius: 12px;
        }

        .completion-icon {
          font-size: 48px;
        }

        .completion-text h3 {
          color: #22c55e;
          margin: 0 0 8px 0;
          font-size: 20px;
        }

        .completion-text p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        .workout-preview h3 {
          color: #ffffff;
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .exercise-list {
          margin-bottom: 20px;
        }

        .exercise-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .exercise-item:last-child {
          border-bottom: none;
        }

        .exercise-item.more {
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }

        .exercise-name {
          color: #ffffff;
          font-weight: 500;
        }

        .exercise-details {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .complete-btn {
          background: linear-gradient(135deg, #00b4ff, #0099cc);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          width: 100%;
          justify-content: center;
        }

        .complete-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 180, 255, 0.4);
        }

        .nutrition-targets {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .macro-item {
          text-align: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(0, 180, 255, 0.2);
        }

        .macro-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .macro-value {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .macro-percent {
          color: #00b4ff;
          font-size: 12px;
          font-weight: 600;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 12px;
          padding: 16px 20px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          border-color: #00b4ff;
          background: rgba(0, 180, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 180, 255, 0.2);
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
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .nutrition-targets {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }

          .welcome-section h1 {
            font-size: 28px;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .completed-workout {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;