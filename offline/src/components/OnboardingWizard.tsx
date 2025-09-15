import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, UserProfile } from '../db/db';
import { EvaluationModel } from '../logic/evaluation';

interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void;
}

interface FormData {
  name: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  fitnessAim: 'lose_fat' | 'gain_muscle' | 'maintain';
  benchPress: number;
  squat: number;
  deadlift: number;
  overheadPress: number;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    weight: 70,
    height: 170,
    age: 25,
    gender: 'male',
    fitnessAim: 'maintain',
    benchPress: 0,
    squat: 0,
    deadlift: 0,
    overheadPress: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    'Personal Info',
    'Physical Stats',
    'Fitness Goals',
    'Strength Levels',
    'Review'
  ];

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const profile: UserProfile = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.userProfiles.add(profile);
      
      setTimeout(() => {
        onComplete(profile);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <h2>Welcome to EnclaveFit</h2>
            <p>Let's set up your personalized training protocol</p>
            
            <div className="form-group">
              <label>What's your name?</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <div className="radio-group">
                {(['male', 'female', 'other'] as const).map(option => (
                  <label key={option} className="radio-label">
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={formData.gender === option}
                      onChange={(e) => handleInputChange('gender', e.target.value as any)}
                    />
                    <span className="radio-custom"></span>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="step-content">
            <h2>Physical Statistics</h2>
            <p>Help us understand your current physical state</p>
            
            <div className="form-row">
              <div className="form-group">
                <label>Age (years)</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  className="form-input"
                  min="13"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  className="form-input"
                  min="30"
                  max="300"
                  step="0.1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 0)}
                className="form-input"
                min="100"
                max="250"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>Fitness Objectives</h2>
            <p>What's your primary goal?</p>
            
            <div className="goal-options">
              {[
                { value: 'lose_fat', title: 'Lose Fat', desc: 'Reduce body fat while maintaining muscle' },
                { value: 'gain_muscle', title: 'Gain Muscle', desc: 'Build lean muscle mass and strength' },
                { value: 'maintain', title: 'Maintain', desc: 'Stay fit and maintain current physique' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`goal-option ${formData.fitnessAim === option.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('fitnessAim', option.value as any)}
                >
                  <h3>{option.title}</h3>
                  <p>{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>Strength Assessment</h2>
            <p>Enter your current max lifts (leave 0 if unknown)</p>
            
            <div className="form-row">
              <div className="form-group">
                <label>Bench Press (kg)</label>
                <input
                  type="number"
                  value={formData.benchPress}
                  onChange={(e) => handleInputChange('benchPress', parseFloat(e.target.value) || 0)}
                  className="form-input"
                  min="0"
                  step="2.5"
                />
              </div>

              <div className="form-group">
                <label>Squat (kg)</label>
                <input
                  type="number"
                  value={formData.squat}
                  onChange={(e) => handleInputChange('squat', parseFloat(e.target.value) || 0)}
                  className="form-input"
                  min="0"
                  step="2.5"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Deadlift (kg)</label>
                <input
                  type="number"
                  value={formData.deadlift}
                  onChange={(e) => handleInputChange('deadlift', parseFloat(e.target.value) || 0)}
                  className="form-input"
                  min="0"
                  step="2.5"
                />
              </div>

              <div className="form-group">
                <label>Overhead Press (kg)</label>
                <input
                  type="number"
                  value={formData.overheadPress}
                  onChange={(e) => handleInputChange('overheadPress', parseFloat(e.target.value) || 0)}
                  className="form-input"
                  min="0"
                  step="2.5"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        const tempProfile = { ...formData, createdAt: new Date(), updatedAt: new Date() };
        const plan = EvaluationModel.createPersonalizedPlan(tempProfile);
        
        return (
          <div className="step-content">
            <h2>Protocol Ready</h2>
            <p>Your personalized training protocol has been generated</p>
            
            <div className="review-card">
              <h3>Training Program</h3>
              <div className="review-item">
                <span>{plan.workoutProgram.name}</span>
                <span>{plan.workoutProgram.frequency} days/week</span>
              </div>
            </div>

            <div className="review-card">
              <h3>Nutrition Plan</h3>
              <div className="review-item">
                <span>Daily Calories</span>
                <span>{plan.nutritionPlan.totalCalories} kcal</span>
              </div>
              <div className="review-item">
                <span>Protein</span>
                <span>{plan.nutritionPlan.protein}g</span>
              </div>
              <div className="review-item">
                <span>Carbs</span>
                <span>{plan.nutritionPlan.carbs}g</span>
              </div>
              <div className="review-item">
                <span>Fat</span>
                <span>{plan.nutritionPlan.fat}g</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim().length > 0;
      case 1:
        return formData.age > 0 && formData.weight > 0 && formData.height > 0;
      case 2:
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (isSubmitting) {
    return (
      <div className="onboarding-container">
        <div className="submitting-screen">
          <div className="loader"></div>
          <h2>Initializing Your Protocol...</h2>
          <p>Analyzing data and generating personalized plan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        {/* Progress indicator */}
        <div className="progress-section">
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="step-indicator">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="step-container"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="navigation">
          {currentStep > 0 && (
            <button className="btn btn-secondary" onClick={prevStep}>
              Previous
            </button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <button 
              className="btn btn-primary" 
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={!canProceed()}
            >
              Initialize Protocol
            </button>
          )}
        </div>
      </div>

      <style>{`
        .onboarding-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0b0f14 0%, #0f1720 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .onboarding-content {
          background: rgba(15, 23, 32, 0.8);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 16px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          backdrop-filter: blur(20px);
          box-shadow: 0 0 40px rgba(0, 180, 255, 0.1);
        }

        .progress-section {
          margin-bottom: 40px;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00b4ff, #ff8a00);
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(0, 180, 255, 0.5);
        }

        .step-indicator {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 500;
        }

        .step-container {
          min-height: 300px;
          margin-bottom: 40px;
        }

        .step-content h2 {
          font-family: 'Orbitron', monospace;
          color: #00b4ff;
          font-size: 28px;
          margin-bottom: 8px;
          text-align: center;
        }

        .step-content > p {
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
          margin-bottom: 32px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group label {
          display: block;
          color: #ffffff;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(0, 180, 255, 0.3);
          border-radius: 8px;
          color: #ffffff;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #00b4ff;
          box-shadow: 0 0 15px rgba(0, 180, 255, 0.3);
        }

        .radio-group {
          display: flex;
          gap: 20px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .radio-label input[type="radio"] {
          display: none;
        }

        .radio-custom {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(0, 180, 255, 0.5);
          border-radius: 50%;
          position: relative;
          transition: all 0.3s ease;
        }

        .radio-label input[type="radio"]:checked + .radio-custom {
          border-color: #00b4ff;
          background: #00b4ff;
        }

        .radio-label input[type="radio"]:checked + .radio-custom::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffffff;
        }

        .goal-options {
          display: grid;
          gap: 16px;
        }

        .goal-option {
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(0, 180, 255, 0.3);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .goal-option:hover {
          border-color: #00b4ff;
          background: rgba(0, 180, 255, 0.1);
        }

        .goal-option.selected {
          border-color: #00b4ff;
          background: rgba(0, 180, 255, 0.15);
          box-shadow: 0 0 20px rgba(0, 180, 255, 0.3);
        }

        .goal-option h3 {
          color: #ffffff;
          margin: 0 0 8px 0;
          font-size: 18px;
        }

        .goal-option p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-size: 14px;
        }

        .review-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .review-card h3 {
          color: #00b4ff;
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .review-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .review-item:last-child {
          border-bottom: none;
        }

        .navigation {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 16px;
          flex: 1;
        }

        .btn-primary {
          background: linear-gradient(135deg, #00b4ff, #0099cc);
          color: #ffffff;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 180, 255, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .submitting-screen {
          text-align: center;
          padding: 60px 40px;
        }

        .submitting-screen .loader {
          width: 60px;
          height: 60px;
          border: 3px solid rgba(0, 180, 255, 0.3);
          border-top: 3px solid #00b4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 24px;
        }

        .submitting-screen h2 {
          color: #00b4ff;
          font-family: 'Orbitron', monospace;
          margin-bottom: 12px;
        }

        .submitting-screen p {
          color: rgba(255, 255, 255, 0.7);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .onboarding-content {
            padding: 24px;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .radio-group {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingWizard;