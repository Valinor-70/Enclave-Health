import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, UserProfile } from '../db/db';
import { EvaluationModel } from '../logic/evaluation';
import { EnclaveCard, EnclaveButton } from './EnclaveUI';

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
                  <label key={option} className={`radio-label ${formData.gender === option ? 'checked' : ''}`}>
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
        {/* Progress indicator with segmented HUD style */}
        <div className="progress-section">
          <div className="hud-progress-container">
            <div className="progress-segments">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`progress-segment ${index <= currentStep ? 'active' : ''}`}
                  initial={{ scale: 0.8, opacity: 0.3 }}
                  animate={{ 
                    scale: index === currentStep ? 1.1 : 1, 
                    opacity: index <= currentStep ? 1 : 0.3 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="segment-inner" />
                  {index <= currentStep && (
                    <motion.div
                      className="segment-glow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
            <div className="step-indicator">
              <span className="step-label">Mission Step</span>
              <span className="step-number">{currentStep + 1}/{steps.length}</span>
              <span className="step-name">{steps[currentStep]}</span>
            </div>
          </div>
        </div>

        {/* Step content */}
        <EnclaveCard glowing={true} className="step-card">
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
        </EnclaveCard>

        {/* Navigation */}
        <div className="navigation">
          {currentStep > 0 && (
            <EnclaveButton variant="secondary" onClick={prevStep}>
              Previous
            </EnclaveButton>
          )}
          
          {currentStep < steps.length - 1 ? (
            <EnclaveButton 
              variant="primary"
              plasma={true}
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
            </EnclaveButton>
          ) : (
            <EnclaveButton 
              variant="success"
              plasma={true}
              onClick={handleSubmit}
              disabled={!canProceed()}
            >
              Initialize Protocol
            </EnclaveButton>
          )}
        </div>
      </div>

      <style>{`
        .onboarding-container {
          min-height: 100vh;
          background: var(--enclave-bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }

        .onboarding-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(0, 180, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 138, 0, 0.15) 0%, transparent 50%);
          pointer-events: none;
        }

        .onboarding-content {
          max-width: 700px;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .progress-section {
          margin-bottom: 40px;
        }

        .hud-progress-container {
          background: var(--enclave-bg-secondary);
          border: 1px solid var(--enclave-border);
          border-radius: 12px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .hud-progress-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(0, 180, 255, 0.05) 50%, transparent 100%);
          pointer-events: none;
        }

        .progress-segments {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          position: relative;
        }

        .progress-segment {
          flex: 1;
          height: 8px;
          position: relative;
          border-radius: 4px;
          overflow: hidden;
        }

        .segment-inner {
          width: 100%;
          height: 100%;
          background: var(--enclave-bg-tertiary);
          border: 1px solid var(--enclave-border);
          border-radius: 4px;
          transition: var(--enclave-transition);
        }

        .progress-segment.active .segment-inner {
          background: linear-gradient(90deg, var(--enclave-primary), rgba(0, 180, 255, 0.8));
          border-color: var(--enclave-primary);
          box-shadow: inset 0 0 10px rgba(0, 180, 255, 0.5);
        }

        .segment-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: var(--enclave-primary);
          border-radius: 6px;
          filter: blur(4px);
          z-index: -1;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-heading);
        }

        .step-label {
          color: var(--enclave-text-secondary);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .step-number {
          color: var(--enclave-primary);
          font-size: 18px;
          font-weight: 700;
          text-shadow: 0 0 10px var(--enclave-primary-glow);
        }

        .step-name {
          color: var(--enclave-text-primary);
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .step-card {
          margin-bottom: 32px;
        }

        .step-container {
          min-height: 320px;
        }

        .step-content h2 {
          font-family: var(--font-display);
          color: var(--enclave-primary);
          font-size: 32px;
          margin-bottom: 12px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 20px var(--enclave-primary-glow);
        }

        .step-content > p {
          color: var(--enclave-text-secondary);
          text-align: center;
          margin-bottom: 32px;
          font-size: 16px;
          font-family: var(--font-body);
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
          color: var(--enclave-text-primary);
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
          font-family: var(--font-heading);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          width: 100%;
          padding: 14px 18px;
          background: rgba(15, 23, 32, 0.8);
          border: 2px solid var(--enclave-border);
          border-radius: 8px;
          color: var(--enclave-text-primary);
          font-size: 16px;
          font-family: var(--font-body);
          transition: var(--enclave-transition);
          position: relative;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--enclave-primary);
          box-shadow: 0 0 15px var(--enclave-primary-glow);
          background: rgba(15, 23, 32, 0.9);
        }

        .radio-group {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-weight: 500;
          padding: 12px 16px;
          border: 2px solid var(--enclave-border);
          border-radius: 8px;
          transition: var(--enclave-transition);
          background: rgba(15, 23, 32, 0.5);
        }

        .radio-label:hover {
          border-color: var(--enclave-primary);
          background: var(--enclave-primary-dim);
        }

        .radio-label input[type="radio"] {
          display: none;
        }

        .radio-custom {
          width: 20px;
          height: 20px;
          border: 2px solid var(--enclave-border-glow);
          border-radius: 50%;
          position: relative;
          transition: var(--enclave-transition);
          background: var(--enclave-bg-tertiary);
        }

        .radio-label.checked {
          border-color: var(--enclave-primary);
          background: var(--enclave-primary-dim);
          box-shadow: var(--enclave-shadow-glow);
        }

        .radio-label input[type="radio"]:checked + .radio-custom {
          border-color: var(--enclave-primary);
          background: var(--enclave-primary);
          box-shadow: 0 0 15px var(--enclave-primary-glow);
        }

        .radio-label input[type="radio"]:checked + .radio-custom::after {
          content: '';
          position: absolute;
          top: 4px;
          left: 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--enclave-bg-primary);
        }

        .goal-options {
          display: grid;
          gap: 16px;
        }

        .goal-option {
          padding: 24px;
          background: rgba(15, 23, 32, 0.6);
          border: 2px solid var(--enclave-border);
          border-radius: 12px;
          cursor: pointer;
          transition: var(--enclave-transition);
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .goal-option::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(0, 180, 255, 0.05) 50%, transparent 100%);
          opacity: 0;
          transition: var(--enclave-transition);
        }

        .goal-option:hover {
          border-color: var(--enclave-primary);
          background: var(--enclave-primary-dim);
          transform: translateY(-2px);
        }

        .goal-option:hover::before {
          opacity: 1;
        }

        .goal-option.selected {
          border-color: var(--enclave-primary);
          background: var(--enclave-primary-dim);
          box-shadow: var(--enclave-shadow-glow);
        }

        .goal-option.selected::before {
          opacity: 1;
        }

        .goal-option h3 {
          color: var(--enclave-text-primary);
          margin: 0 0 8px 0;
          font-size: 20px;
          font-family: var(--font-heading);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .goal-option p {
          color: var(--enclave-text-secondary);
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .review-card {
          background: rgba(15, 23, 32, 0.8);
          border: 2px solid var(--enclave-border);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }

        .review-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(0, 180, 255, 0.03) 50%, transparent 100%);
        }

        .review-card h3 {
          color: var(--enclave-primary);
          margin: 0 0 16px 0;
          font-size: 18px;
          font-family: var(--font-heading);
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          z-index: 1;
        }

        .review-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--enclave-border);
          position: relative;
          z-index: 1;
        }

        .review-item:last-child {
          border-bottom: none;
        }

        .review-item span:first-child {
          color: var(--enclave-text-secondary);
          font-family: var(--font-body);
        }

        .review-item span:last-child {
          color: var(--enclave-primary);
          font-family: var(--font-heading);
          font-weight: 600;
        }

        .navigation {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .navigation > * {
          flex: 1;
        }

        .submitting-screen {
          text-align: center;
          padding: 80px 40px;
          background: var(--enclave-bg-secondary);
          border: 1px solid var(--enclave-border);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }

        .submitting-screen::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at center, rgba(0, 180, 255, 0.1) 0%, transparent 70%),
            linear-gradient(45deg, transparent 30%, rgba(0, 180, 255, 0.02) 50%, transparent 70%);
        }

        .submitting-screen .loader {
          width: 80px;
          height: 80px;
          border: 4px solid var(--enclave-border);
          border-top: 4px solid var(--enclave-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 32px;
          box-shadow: var(--enclave-shadow-glow);
          position: relative;
          z-index: 1;
        }

        .submitting-screen h2 {
          color: var(--enclave-primary);
          font-family: var(--font-display);
          margin-bottom: 16px;
          font-size: 28px;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 20px var(--enclave-primary-glow);
          position: relative;
          z-index: 1;
        }

        .submitting-screen p {
          color: var(--enclave-text-secondary);
          font-family: var(--font-body);
          position: relative;
          z-index: 1;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .onboarding-content {
            padding: 16px;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .radio-group {
            flex-direction: column;
            gap: 12px;
          }

          .step-content h2 {
            font-size: 24px;
          }

          .hud-progress-container {
            padding: 20px;
          }

          .step-indicator {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingWizard;