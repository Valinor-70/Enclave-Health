import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, db, WorkoutPlan, Exercise } from '../db/db';
import { EvaluationModel } from '../logic/evaluation';

interface WorkoutPlannerProps {
  user: UserProfile;
}

const WorkoutPlanner: React.FC<WorkoutPlannerProps> = ({ user }) => {
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [workoutDays, setWorkoutDays] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    loadWorkoutPlans();
  }, [user]);

  const loadWorkoutPlans = async () => {
    try {
      const plans = await db.workoutPlans.where('userId').equals(user.id!).toArray();
      
      if (plans.length === 0) {
        // Create default plan from personalized evaluation
        await createDefaultPlan();
      } else {
        setSelectedPlan(plans[0]);
        // Load the actual workout program to get day structure
        const personalizedPlan = EvaluationModel.createPersonalizedPlan(user);
        setWorkoutDays(personalizedPlan.workoutProgram.workouts);
      }
    } catch (error) {
      console.error('Failed to load workout plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultPlan = async () => {
    try {
      const personalizedPlan = EvaluationModel.createPersonalizedPlan(user);
      const workoutProgram = personalizedPlan.workoutProgram;
      setWorkoutDays(workoutProgram.workouts);

      // Convert to our database format
      const exercises: Exercise[] = workoutProgram.workouts[0]?.exercises.map((ex, index) => ({
        id: index + 1,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight || 0,
        restTime: ex.restTime,
        notes: ex.notes
      })) || [];

      const plan: WorkoutPlan = {
        userId: user.id!,
        name: workoutProgram.name,
        description: `Personalized ${workoutProgram.type} program`,
        exercises,
        frequency: workoutProgram.frequency,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const id = await db.workoutPlans.add(plan);
      plan.id = id;
      
      setSelectedPlan(plan);
    } catch (error) {
      console.error('Failed to create default plan:', error);
    }
  };

  const getCurrentDayExercises = (): any[] => {
    if (!workoutDays[selectedDay]) return [];
    return workoutDays[selectedDay].exercises;
  };

  const addExercise = async (exercise: Exercise) => {
    if (!selectedPlan) return;

    try {
      const updatedExercises = [...selectedPlan.exercises, { ...exercise, id: Date.now() }];
      const updatedPlan = { ...selectedPlan, exercises: updatedExercises, updatedAt: new Date() };

      await db.workoutPlans.update(selectedPlan.id!, { exercises: updatedExercises, updatedAt: new Date() });
      setSelectedPlan(updatedPlan);
      
    } catch (error) {
      console.error('Failed to add exercise:', error);
    }
  };

  const updateExercise = async (exerciseId: number, updates: Partial<Exercise>) => {
    if (!selectedPlan) return;

    try {
      const updatedExercises = selectedPlan.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      );
      const updatedPlan = { ...selectedPlan, exercises: updatedExercises, updatedAt: new Date() };

      await db.workoutPlans.update(selectedPlan.id!, { exercises: updatedExercises, updatedAt: new Date() });
      setSelectedPlan(updatedPlan);
      
      setEditingExercise(null);
    } catch (error) {
      console.error('Failed to update exercise:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="workout-planner-loading">
        <div className="loading-spinner"></div>
        <p>Loading workout plans...</p>
      </div>
    );
  }

  return (
    <div className="workout-planner">
      <motion.div 
        className="header-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Training Protocol</h1>
        <p>Manage your workout programs and exercises</p>
      </motion.div>

      {selectedPlan ? (
        <motion.div 
          className="plan-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Plan Header */}
          <div className="plan-header">
            <div className="plan-info">
              <h2>{selectedPlan.name}</h2>
              <p>{selectedPlan.description}</p>
              <div className="plan-meta">
                <span className="frequency">{selectedPlan.frequency} days/week</span>
                <span className="exercise-count">{getCurrentDayExercises().length} exercises per day</span>
                <span className="total-exercises">{workoutDays.reduce((total, day) => total + day.exercises.length, 0)} total exercises</span>
              </div>
            </div>
          </div>

          {/* Day Selector */}
          <div className="day-selector">
            {workoutDays.map((day, index) => (
              <motion.button
                key={index}
                className={`day-tab ${selectedDay === index ? 'active' : ''}`}
                onClick={() => setSelectedDay(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="day-number">Day {index + 1}</div>
                <div className="day-name">{day.name}</div>
                <div className="exercise-count">{day.exercises.length} exercises</div>
              </motion.button>
            ))}
          </div>

          {/* Current Day Content */}
          <motion.div 
            key={selectedDay}
            className="day-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="day-header">
              <h3>{workoutDays[selectedDay]?.name}</h3>
              <button 
                className="add-exercise-btn"
                onClick={() => setIsCreating(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add Exercise
              </button>
            </div>

            {/* Exercise List */}
            <div className="exercise-list">
              <AnimatePresence>
                {getCurrentDayExercises().map((exercise: any, index: number) => (
                  <motion.div 
                    key={`${exercise.name}-${index}`}
                    className="exercise-card enhanced"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                  >
                    <div className="exercise-number">{index + 1}</div>
                    
                    <div className="exercise-content">
                      <div className="exercise-header">
                        <h4>{exercise.name}</h4>
                        <div className="exercise-actions">
                          <button 
                            className="action-btn edit"
                            onClick={() => setEditingExercise({
                              id: index,
                              name: exercise.name,
                              sets: exercise.sets,
                              reps: exercise.reps,
                              weight: exercise.weight || 0,
                              restTime: exercise.restTime,
                              notes: exercise.notes
                            })}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="exercise-details">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <div className="detail-icon">🏋️</div>
                            <div className="detail-content">
                              <span className="label">Sets</span>
                              <span className="value">{exercise.sets}</span>
                            </div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-icon">🔄</div>
                            <div className="detail-content">
                              <span className="label">Reps</span>
                              <span className="value">{exercise.reps}</span>
                            </div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-icon">⚖️</div>
                            <div className="detail-content">
                              <span className="label">Weight</span>
                              <span className="value">{exercise.weight ? `${exercise.weight}kg` : 'BW'}</span>
                            </div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-icon">⏱️</div>
                            <div className="detail-content">
                              <span className="label">Rest</span>
                              <span className="value">{Math.floor(exercise.restTime / 60)}:{(exercise.restTime % 60).toString().padStart(2, '0')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {exercise.notes && (
                        <div className="exercise-notes">
                          <div className="notes-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                            </svg>
                            <strong>Notes:</strong>
                          </div>
                          <p>{exercise.notes}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <div className="no-plans">
          <div className="no-plans-icon">🏋️‍♂️</div>
          <h3>No workout plans found</h3>
          <p>Let's create your personalized training protocol</p>
          <button onClick={createDefaultPlan} className="create-plan-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Create Training Plan
          </button>
        </div>
      )}

      {/* Add/Edit Exercise Modal */}
      <AnimatePresence>
        {(isCreating || editingExercise) && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsCreating(false);
              setEditingExercise(null);
            }}
          >
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ExerciseForm 
                exercise={editingExercise}
                onSave={(exercise) => {
                  if (editingExercise) {
                    updateExercise(editingExercise.id!, exercise);
                  } else {
                    addExercise(exercise);
                  }
                  setIsCreating(false);
                  setEditingExercise(null);
                }}
                onCancel={() => {
                  setIsCreating(false);
                  setEditingExercise(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .workout-planner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .workout-planner-loading {
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

        .header-section {
          text-align: center;
          margin-bottom: 32px;
          position: relative;
        }

        .header-section::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(0, 180, 255, 0.2) 0%, transparent 70%);
          border-radius: 50%;
          z-index: -1;
        }

        .header-section h1 {
          font-family: 'Orbitron', monospace;
          font-size: 42px;
          color: #00b4ff;
          margin: 0 0 8px 0;
          text-shadow: 0 0 30px rgba(0, 180, 255, 0.6);
          letter-spacing: 2px;
        }

        .header-section p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 18px;
          margin: 0;
          font-weight: 300;
        }

        .plan-header {
          background: linear-gradient(135deg, rgba(15, 23, 32, 0.9), rgba(11, 15, 20, 0.9));
          border: 2px solid rgba(0, 180, 255, 0.3);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
        }

        .plan-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00b4ff, #ff8a00, transparent);
          animation: scanline 3s linear infinite;
        }

        .plan-info h2 {
          font-family: 'Orbitron', monospace;
          color: #00b4ff;
          font-size: 28px;
          margin: 0 0 12px 0;
          text-shadow: 0 0 15px rgba(0, 180, 255, 0.4);
        }

        .plan-info p {
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 20px 0;
          font-size: 16px;
        }

        .plan-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .plan-meta span {
          background: linear-gradient(135deg, rgba(0, 180, 255, 0.2), rgba(255, 138, 0, 0.1));
          color: #00b4ff;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          border: 1px solid rgba(0, 180, 255, 0.3);
          backdrop-filter: blur(10px);
        }

        .day-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .day-tab {
          background: linear-gradient(135deg, rgba(15, 23, 32, 0.8), rgba(11, 15, 20, 0.8));
          border: 2px solid rgba(0, 180, 255, 0.2);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .day-tab::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .day-tab:hover::before {
          left: 100%;
        }

        .day-tab:hover {
          border-color: #00b4ff;
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0, 180, 255, 0.3);
        }

        .day-tab.active {
          border-color: #00b4ff;
          background: linear-gradient(135deg, rgba(0, 180, 255, 0.15), rgba(255, 138, 0, 0.05));
          box-shadow: 0 5px 25px rgba(0, 180, 255, 0.4);
        }

        .day-number {
          font-family: 'Orbitron', monospace;
          font-size: 14px;
          color: #ff8a00;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .day-name {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .day-tab .exercise-count {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          background: none;
          padding: 0;
          border-radius: 0;
          border: none;
        }

        .day-content {
          background: linear-gradient(135deg, rgba(15, 23, 32, 0.6), rgba(11, 15, 20, 0.6));
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 180, 255, 0.2);
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(0, 180, 255, 0.2);
        }

        .day-header h3 {
          font-family: 'Orbitron', monospace;
          color: #00b4ff;
          font-size: 24px;
          margin: 0;
          text-shadow: 0 0 15px rgba(0, 180, 255, 0.4);
        }

        .add-exercise-btn {
          background: linear-gradient(135deg, #00b4ff, #0099cc);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 14px 24px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .add-exercise-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.4s ease;
        }

        .add-exercise-btn:hover::before {
          left: 100%;
        }

        .add-exercise-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 180, 255, 0.5);
        }

        .exercise-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .exercise-card {
          background: linear-gradient(135deg, rgba(15, 23, 32, 0.9), rgba(11, 15, 20, 0.9));
          border: 2px solid rgba(0, 180, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          gap: 20px;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .exercise-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.6), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .exercise-card.enhanced:hover {
          border-color: #00b4ff;
          box-shadow: 0 8px 30px rgba(0, 180, 255, 0.3);
        }

        .exercise-card.enhanced:hover::before {
          opacity: 1;
        }

        .exercise-number {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #00b4ff, #0099cc);
          color: #ffffff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
          font-family: 'Orbitron', monospace;
          box-shadow: 0 4px 15px rgba(0, 180, 255, 0.3);
        }

        .exercise-content {
          flex: 1;
        }

        .exercise-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .exercise-header h4 {
          color: #ffffff;
          font-size: 20px;
          margin: 0;
          font-weight: 600;
          line-height: 1.3;
        }

        .exercise-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn.edit {
          color: #00b4ff;
        }

        .action-btn.edit:hover {
          background: rgba(0, 180, 255, 0.2);
          border-color: #00b4ff;
          transform: scale(1.1);
        }

        .action-btn.delete {
          color: #ef4444;
        }

        .action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          transform: scale(1.1);
        }

        .exercise-details {
          margin-bottom: 16px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 180, 255, 0.05);
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid rgba(0, 180, 255, 0.1);
        }

        .detail-icon {
          font-size: 18px;
          opacity: 0.8;
        }

        .detail-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-content .label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .detail-content .value {
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
        }

        .exercise-notes {
          background: linear-gradient(135deg, rgba(0, 180, 255, 0.1), rgba(255, 138, 0, 0.05));
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(0, 180, 255, 0.2);
          backdrop-filter: blur(10px);
        }

        .notes-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #00b4ff;
          font-weight: 600;
        }

        .exercise-notes p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          backdrop-filter: blur(10px);
        }

        .modal-content {
          background: linear-gradient(135deg, rgba(15, 23, 32, 0.98), rgba(11, 15, 20, 0.98));
          border: 2px solid rgba(0, 180, 255, 0.4);
          border-radius: 20px;
          padding: 32px;
          max-width: 500px;
          width: 100%;
          backdrop-filter: blur(30px);
          box-shadow: 0 20px 60px rgba(0, 180, 255, 0.3);
        }

        .no-plans {
          text-align: center;
          padding: 80px 20px;
          background: linear-gradient(135deg, rgba(15, 23, 32, 0.6), rgba(11, 15, 20, 0.6));
          border-radius: 20px;
          border: 2px dashed rgba(0, 180, 255, 0.3);
          backdrop-filter: blur(20px);
        }

        .no-plans-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.6;
        }

        .no-plans h3 {
          color: #ffffff;
          font-size: 24px;
          margin: 0 0 12px 0;
          font-weight: 600;
        }

        .no-plans p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 24px 0;
          font-size: 16px;
        }

        .create-plan-btn {
          background: linear-gradient(135deg, #00b4ff, #0099cc);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 16px 32px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s ease;
          font-size: 16px;
        }

        .create-plan-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 180, 255, 0.4);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes scanline {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @media (max-width: 768px) {
          .workout-planner {
            padding: 0 15px;
          }

          .plan-header {
            padding: 24px;
          }

          .day-selector {
            grid-template-columns: 1fr;
          }

          .day-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .detail-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .header-section h1 {
            font-size: 32px;
          }

          .modal-content {
            padding: 24px;
          }

          .exercise-card {
            padding: 20px;
            gap: 16px;
          }
        }

        @media (max-width: 480px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }

          .exercise-number {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

// Exercise Form Component
interface ExerciseFormProps {
  exercise?: Exercise | null;
  onSave: (exercise: Exercise) => void;
  onCancel: () => void;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({ exercise, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Exercise>({
    id: exercise?.id || 0,
    name: exercise?.name || '',
    sets: exercise?.sets || 3,
    reps: exercise?.reps || '8-12',
    weight: exercise?.weight || 0,
    restTime: exercise?.restTime || 120,
    notes: exercise?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="exercise-form">
      <h3>{exercise ? 'Edit Exercise' : 'Add Exercise'}</h3>
      
      <div className="form-group">
        <label>Exercise Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Bench Press"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Sets</label>
          <input
            type="number"
            value={formData.sets}
            onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 0 })}
            min="1"
            max="10"
          />
        </div>

        <div className="form-group">
          <label>Reps</label>
          <input
            type="text"
            value={formData.reps}
            onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
            placeholder="e.g., 8-12, 5, AMRAP"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Weight (kg)</label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
            min="0"
            step="2.5"
          />
        </div>

        <div className="form-group">
          <label>Rest Time (seconds)</label>
          <input
            type="number"
            value={formData.restTime}
            onChange={(e) => setFormData({ ...formData, restTime: parseInt(e.target.value) || 0 })}
            min="30"
            step="30"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Notes (optional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional instructions or notes..."
          rows={3}
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
        <button type="submit" className="btn-save">
          {exercise ? 'Update' : 'Add'} Exercise
        </button>
      </div>

      <style>{`
        .exercise-form h3 {
          color: #00b4ff;
          font-family: 'Orbitron', monospace;
          margin: 0 0 24px 0;
          text-align: center;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: block;
          color: #ffffff;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(0, 180, 255, 0.3);
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #00b4ff;
          box-shadow: 0 0 15px rgba(0, 180, 255, 0.3);
        }

        .form-group textarea {
          resize: vertical;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-cancel,
        .btn-save {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .btn-save {
          background: linear-gradient(135deg, #00b4ff, #0099cc);
          color: #ffffff;
        }

        .btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 180, 255, 0.4);
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
};

export default WorkoutPlanner;