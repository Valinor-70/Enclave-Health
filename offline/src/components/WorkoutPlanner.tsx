import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, db, WorkoutPlan, Exercise } from '../db/db';
import { EvaluationModel } from '../logic/evaluation';

interface WorkoutPlannerProps {
  user: UserProfile;
}

const WorkoutPlanner: React.FC<WorkoutPlannerProps> = ({ user }) => {
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
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

  const deleteExercise = async (exerciseId: number) => {
    if (!selectedPlan) return;

    try {
      const updatedExercises = selectedPlan.exercises.filter(ex => ex.id !== exerciseId);
      const updatedPlan = { ...selectedPlan, exercises: updatedExercises, updatedAt: new Date() };

      await db.workoutPlans.update(selectedPlan.id!, { exercises: updatedExercises, updatedAt: new Date() });
      setSelectedPlan(updatedPlan);
      
    } catch (error) {
      console.error('Failed to delete exercise:', error);
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
                <span className="exercise-count">{selectedPlan.exercises.length} exercises</span>
              </div>
            </div>
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
              {selectedPlan.exercises.map((exercise, index) => (
                <motion.div 
                  key={exercise.id}
                  className="exercise-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="exercise-number">{index + 1}</div>
                  
                  <div className="exercise-content">
                    <div className="exercise-header">
                      <h3>{exercise.name}</h3>
                      <div className="exercise-actions">
                        <button 
                          className="action-btn edit"
                          onClick={() => setEditingExercise(exercise)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => deleteExercise(exercise.id!)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="exercise-details">
                      <div className="detail-item">
                        <span className="label">Sets:</span>
                        <span className="value">{exercise.sets}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Reps:</span>
                        <span className="value">{exercise.reps}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Weight:</span>
                        <span className="value">{exercise.weight || 'BW'} kg</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Rest:</span>
                        <span className="value">{Math.floor(exercise.restTime / 60)}:{(exercise.restTime % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    
                    {exercise.notes && (
                      <div className="exercise-notes">
                        <strong>Notes:</strong> {exercise.notes}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        <div className="no-plans">
          <p>No workout plans found</p>
          <button onClick={createDefaultPlan}>Create Default Plan</button>
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
          max-width: 1200px;
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
        }

        .header-section h1 {
          font-family: 'Orbitron', monospace;
          font-size: 36px;
          color: #00b4ff;
          margin: 0 0 8px 0;
          text-shadow: 0 0 20px rgba(0, 180, 255, 0.5);
        }

        .header-section p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 0;
        }

        .plan-header {
          background: rgba(15, 23, 32, 0.8);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          backdrop-filter: blur(10px);
        }

        .plan-info h2 {
          font-family: 'Orbitron', monospace;
          color: #00b4ff;
          font-size: 24px;
          margin: 0 0 8px 0;
        }

        .plan-info p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 12px 0;
        }

        .plan-meta {
          display: flex;
          gap: 16px;
        }

        .plan-meta span {
          background: rgba(0, 180, 255, 0.1);
          color: #00b4ff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .add-exercise-btn {
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
        }

        .add-exercise-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 180, 255, 0.4);
        }

        .exercise-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .exercise-card {
          background: rgba(15, 23, 32, 0.8);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          gap: 16px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .exercise-card:hover {
          border-color: #00b4ff;
          box-shadow: 0 0 20px rgba(0, 180, 255, 0.2);
        }

        .exercise-number {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #00b4ff, #0099cc);
          color: #ffffff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }

        .exercise-content {
          flex: 1;
        }

        .exercise-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .exercise-header h3 {
          color: #ffffff;
          font-size: 18px;
          margin: 0;
          font-weight: 600;
        }

        .exercise-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          padding: 6px 8px;
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
        }

        .action-btn.delete {
          color: #ef4444;
        }

        .action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
        }

        .exercise-details {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 12px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-item .label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .detail-item .value {
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
        }

        .exercise-notes {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 12px;
          border-radius: 6px;
          border-left: 3px solid #00b4ff;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .modal-content {
          background: rgba(15, 23, 32, 0.95);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
          backdrop-filter: blur(20px);
        }

        .no-plans {
          text-align: center;
          padding: 60px 20px;
          color: rgba(255, 255, 255, 0.7);
        }

        .no-plans button {
          background: linear-gradient(135deg, #00b4ff, #0099cc);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .workout-planner {
            padding: 0 15px;
          }

          .plan-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .exercise-details {
            grid-template-columns: repeat(2, 1fr);
          }

          .header-section h1 {
            font-size: 28px;
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