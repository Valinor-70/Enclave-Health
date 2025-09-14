import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, db, MealPlan, Meal } from '../db/db';
import { EvaluationModel } from '../logic/evaluation';

interface MealPlannerProps {
  user: UserProfile;
}

const MealPlanner: React.FC<MealPlannerProps> = ({ user }) => {
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  useEffect(() => {
    loadMealPlans();
  }, [user]);

  const loadMealPlans = async () => {
    try {
      const plans = await db.mealPlans.where('userId').equals(user.id!).toArray();
      
      if (plans.length === 0) {
        await createDefaultPlan();
      } else {
        setSelectedPlan(plans[0]);
      }
    } catch (error) {
      console.error('Failed to load meal plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultPlan = async () => {
    try {
      const personalizedPlan = EvaluationModel.createPersonalizedPlan(user);
      const nutrition = personalizedPlan.nutritionPlan;

      // Create sample meals based on nutrition targets
      const sampleMeals: Meal[] = [
        {
          id: 1,
          name: 'Power Breakfast',
          mealType: 'breakfast',
          ingredients: [
            { name: 'Oatmeal', amount: 80, unit: 'g', calories: 312, protein: 10.6, carbs: 54.8, fat: 6.2 },
            { name: 'Banana', amount: 150, unit: 'g', calories: 134, protein: 1.6, carbs: 34.3, fat: 0.4 },
            { name: 'Protein Powder', amount: 30, unit: 'g', calories: 120, protein: 25, carbs: 2, fat: 1 }
          ],
          calories: 566,
          protein: 37.2,
          carbs: 91.1,
          fat: 7.6
        },
        {
          id: 2,
          name: 'Elite Lunch',
          mealType: 'lunch',
          ingredients: [
            { name: 'Chicken Breast', amount: 200, unit: 'g', calories: 330, protein: 62, carbs: 0, fat: 7.4 },
            { name: 'Brown Rice', amount: 100, unit: 'g', calories: 112, protein: 2.6, carbs: 23, fat: 0.9 },
            { name: 'Broccoli', amount: 150, unit: 'g', calories: 51, protein: 5.4, carbs: 10.1, fat: 0.6 },
            { name: 'Olive Oil', amount: 15, unit: 'ml', calories: 135, protein: 0, carbs: 0, fat: 15 }
          ],
          calories: 628,
          protein: 70,
          carbs: 33.1,
          fat: 24
        },
        {
          id: 3,
          name: 'Victory Dinner',
          mealType: 'dinner',
          ingredients: [
            { name: 'Salmon', amount: 180, unit: 'g', calories: 367, protein: 55.2, carbs: 0, fat: 15.3 },
            { name: 'Sweet Potato', amount: 200, unit: 'g', calories: 172, protein: 3.8, carbs: 40, fat: 0.2 },
            { name: 'Spinach', amount: 100, unit: 'g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
            { name: 'Avocado', amount: 80, unit: 'g', calories: 128, protein: 1.6, carbs: 6.8, fat: 11.6 }
          ],
          calories: 690,
          protein: 63.5,
          carbs: 50.4,
          fat: 27.5
        },
        {
          id: 4,
          name: 'Recovery Snack',
          mealType: 'snack',
          ingredients: [
            { name: 'Greek Yogurt', amount: 200, unit: 'g', calories: 130, protein: 20, carbs: 9, fat: 0.4 },
            { name: 'Almonds', amount: 30, unit: 'g', calories: 174, protein: 6.4, carbs: 6.1, fat: 15.2 },
            { name: 'Berries', amount: 100, unit: 'g', calories: 43, protein: 1.4, carbs: 9.6, fat: 0.5 }
          ],
          calories: 347,
          protein: 27.8,
          carbs: 24.7,
          fat: 16.1
        }
      ];

      const plan: MealPlan = {
        userId: user.id!,
        name: 'Personalized Meal Plan',
        meals: sampleMeals,
        targetCalories: nutrition.totalCalories,
        targetProtein: nutrition.protein,
        targetCarbs: nutrition.carbs,
        targetFat: nutrition.fat,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const id = await db.mealPlans.add(plan);
      plan.id = id;
      
      setSelectedPlan(plan);
    } catch (error) {
      console.error('Failed to create default plan:', error);
    }
  };

  const addMeal = async (meal: Meal) => {
    if (!selectedPlan) return;

    try {
      const newMeal = { ...meal, id: Date.now() };
      const updatedMeals = [...selectedPlan.meals, newMeal];
      const updatedPlan = { ...selectedPlan, meals: updatedMeals, updatedAt: new Date() };

      await db.mealPlans.update(selectedPlan.id!, { meals: updatedMeals, updatedAt: new Date() });
      setSelectedPlan(updatedPlan);
      
    } catch (error) {
      console.error('Failed to add meal:', error);
    }
  };

  const updateMeal = async (mealId: number, updates: Partial<Meal>) => {
    if (!selectedPlan) return;

    try {
      const updatedMeals = selectedPlan.meals.map(meal => 
        meal.id === mealId ? { ...meal, ...updates } : meal
      );
      const updatedPlan = { ...selectedPlan, meals: updatedMeals, updatedAt: new Date() };

      await db.mealPlans.update(selectedPlan.id!, { meals: updatedMeals, updatedAt: new Date() });
      setSelectedPlan(updatedPlan);
      
      setEditingMeal(null);
    } catch (error) {
      console.error('Failed to update meal:', error);
    }
  };

  const deleteMeal = async (mealId: number) => {
    if (!selectedPlan) return;

    try {
      const updatedMeals = selectedPlan.meals.filter(meal => meal.id !== mealId);
      const updatedPlan = { ...selectedPlan, meals: updatedMeals, updatedAt: new Date() };

      await db.mealPlans.update(selectedPlan.id!, { meals: updatedMeals, updatedAt: new Date() });
      setSelectedPlan(updatedPlan);
      
    } catch (error) {
      console.error('Failed to delete meal:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="meal-planner-loading">
        <div className="loading-spinner"></div>
        <p>Loading meal plans...</p>
      </div>
    );
  }

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const totalCalories = selectedPlan?.meals.reduce((sum, meal) => sum + meal.calories, 0) || 0;
  const totalProtein = selectedPlan?.meals.reduce((sum, meal) => sum + meal.protein, 0) || 0;
  const totalCarbs = selectedPlan?.meals.reduce((sum, meal) => sum + meal.carbs, 0) || 0;
  const totalFat = selectedPlan?.meals.reduce((sum, meal) => sum + meal.fat, 0) || 0;

  return (
    <div className="meal-planner">
      <motion.div 
        className="header-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Nutrition Protocol</h1>
        <p>Manage your meal plans and track macronutrients</p>
      </motion.div>

      {selectedPlan ? (
        <motion.div 
          className="plan-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Nutrition Summary */}
          <div className="nutrition-summary">
            <h2>Daily Targets vs. Current</h2>
            <div className="macro-grid">
              <div className="macro-card">
                <div className="macro-header">
                  <span className="macro-name">Calories</span>
                  <span className="macro-unit">kcal</span>
                </div>
                <div className="macro-values">
                  <span className="current">{Math.round(totalCalories)}</span>
                  <span className="separator">/</span>
                  <span className="target">{selectedPlan.targetCalories}</span>
                </div>
                <div className="macro-bar">
                  <div 
                    className="macro-fill calories"
                    style={{ width: `${Math.min((totalCalories / selectedPlan.targetCalories) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="macro-card">
                <div className="macro-header">
                  <span className="macro-name">Protein</span>
                  <span className="macro-unit">g</span>
                </div>
                <div className="macro-values">
                  <span className="current">{Math.round(totalProtein)}</span>
                  <span className="separator">/</span>
                  <span className="target">{selectedPlan.targetProtein}</span>
                </div>
                <div className="macro-bar">
                  <div 
                    className="macro-fill protein"
                    style={{ width: `${Math.min((totalProtein / selectedPlan.targetProtein) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="macro-card">
                <div className="macro-header">
                  <span className="macro-name">Carbs</span>
                  <span className="macro-unit">g</span>
                </div>
                <div className="macro-values">
                  <span className="current">{Math.round(totalCarbs)}</span>
                  <span className="separator">/</span>
                  <span className="target">{selectedPlan.targetCarbs}</span>
                </div>
                <div className="macro-bar">
                  <div 
                    className="macro-fill carbs"
                    style={{ width: `${Math.min((totalCarbs / selectedPlan.targetCarbs) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="macro-card">
                <div className="macro-header">
                  <span className="macro-name">Fat</span>
                  <span className="macro-unit">g</span>
                </div>
                <div className="macro-values">
                  <span className="current">{Math.round(totalFat)}</span>
                  <span className="separator">/</span>
                  <span className="target">{selectedPlan.targetFat}</span>
                </div>
                <div className="macro-bar">
                  <div 
                    className="macro-fill fat"
                    style={{ width: `${Math.min((totalFat / selectedPlan.targetFat) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meal List */}
          <div className="meals-section">
            <div className="section-header">
              <h2>Daily Meals</h2>
              <button 
                className="add-meal-btn"
                onClick={() => setIsCreating(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add Meal
              </button>
            </div>

            <div className="meal-list">
              <AnimatePresence>
                {selectedPlan.meals
                  .sort((a, b) => {
                    const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
                    return (order[a.mealType] || 5) - (order[b.mealType] || 5);
                  })
                  .map((meal, index) => (
                    <motion.div 
                      key={meal.id}
                      className="meal-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="meal-header">
                        <div className="meal-title">
                          <span className="meal-icon">{getMealTypeIcon(meal.mealType)}</span>
                          <div>
                            <h3>{meal.name}</h3>
                            <span className="meal-type">{meal.mealType.toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="meal-actions">
                          <button 
                            className="action-btn edit"
                            onClick={() => setEditingMeal(meal)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => deleteMeal(meal.id!)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="meal-macros">
                        <div className="macro-item">
                          <span className="macro-label">Calories</span>
                          <span className="macro-value">{Math.round(meal.calories)}</span>
                        </div>
                        <div className="macro-item">
                          <span className="macro-label">Protein</span>
                          <span className="macro-value">{Math.round(meal.protein)}g</span>
                        </div>
                        <div className="macro-item">
                          <span className="macro-label">Carbs</span>
                          <span className="macro-value">{Math.round(meal.carbs)}g</span>
                        </div>
                        <div className="macro-item">
                          <span className="macro-label">Fat</span>
                          <span className="macro-value">{Math.round(meal.fat)}g</span>
                        </div>
                      </div>

                      <div className="ingredients-list">
                        <h4>Ingredients</h4>
                        {meal.ingredients.map((ingredient, idx) => (
                          <div key={idx} className="ingredient-item">
                            <span className="ingredient-name">{ingredient.name}</span>
                            <span className="ingredient-amount">
                              {ingredient.amount}{ingredient.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="no-plans">
          <p>No meal plans found</p>
          <button onClick={createDefaultPlan}>Create Default Plan</button>
        </div>
      )}

      {/* Add/Edit Meal Modal */}
      <AnimatePresence>
        {(isCreating || editingMeal) && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsCreating(false);
              setEditingMeal(null);
            }}
          >
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <MealForm 
                meal={editingMeal}
                onSave={(meal) => {
                  if (editingMeal) {
                    updateMeal(editingMeal.id!, meal);
                  } else {
                    addMeal(meal);
                  }
                  setIsCreating(false);
                  setEditingMeal(null);
                }}
                onCancel={() => {
                  setIsCreating(false);
                  setEditingMeal(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .meal-planner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .meal-planner-loading {
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

        .nutrition-summary {
          background: rgba(15, 23, 32, 0.8);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          backdrop-filter: blur(10px);
        }

        .nutrition-summary h2 {
          font-family: 'Orbitron', monospace;
          color: #00b4ff;
          font-size: 20px;
          margin: 0 0 20px 0;
          text-align: center;
        }

        .macro-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .macro-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(0, 180, 255, 0.2);
          border-radius: 12px;
          padding: 16px;
        }

        .macro-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .macro-name {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          font-size: 14px;
        }

        .macro-unit {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }

        .macro-values {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 12px;
        }

        .macro-values .current {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
        }

        .macro-values .separator {
          color: rgba(255, 255, 255, 0.6);
          font-size: 18px;
        }

        .macro-values .target {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
        }

        .macro-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .macro-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .macro-fill.calories { background: linear-gradient(90deg, #ff8a00, #ffb84d); }
        .macro-fill.protein { background: linear-gradient(90deg, #00b4ff, #4dd0ff); }
        .macro-fill.carbs { background: linear-gradient(90deg, #22c55e, #4ade80); }
        .macro-fill.fat { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }

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

        .add-meal-btn {
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

        .add-meal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 180, 255, 0.4);
        }

        .meal-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .meal-card {
          background: rgba(15, 23, 32, 0.8);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .meal-card:hover {
          border-color: #00b4ff;
          box-shadow: 0 0 20px rgba(0, 180, 255, 0.2);
        }

        .meal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .meal-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .meal-icon {
          font-size: 32px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 180, 255, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(0, 180, 255, 0.3);
        }

        .meal-title h3 {
          color: #ffffff;
          font-size: 18px;
          margin: 0 0 4px 0;
          font-weight: 600;
        }

        .meal-type {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .meal-actions {
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

        .meal-macros {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .meal-macros .macro-item {
          text-align: center;
        }

        .meal-macros .macro-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          display: block;
        }

        .meal-macros .macro-value {
          color: #ffffff;
          font-weight: 600;
          font-size: 16px;
        }

        .ingredients-list h4 {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ingredient-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ingredient-item:last-child {
          border-bottom: none;
        }

        .ingredient-name {
          color: rgba(255, 255, 255, 0.9);
        }

        .ingredient-amount {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
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
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
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
          .meal-planner {
            padding: 0 15px;
          }

          .macro-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .meal-macros {
            grid-template-columns: repeat(2, 1fr);
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .header-section h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
};

// Meal Form Component (simplified for brevity)
interface MealFormProps {
  meal?: Meal | null;
  onSave: (meal: Meal) => void;
  onCancel: () => void;
}

const MealForm: React.FC<MealFormProps> = ({ meal, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Meal>({
    id: meal?.id || 0,
    name: meal?.name || '',
    mealType: meal?.mealType || 'breakfast',
    ingredients: meal?.ingredients || [],
    calories: meal?.calories || 0,
    protein: meal?.protein || 0,
    carbs: meal?.carbs || 0,
    fat: meal?.fat || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="meal-form">
      <h3>{meal ? 'Edit Meal' : 'Add Meal'}</h3>
      
      <div className="form-group">
        <label>Meal Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Protein Power Breakfast"
          required
        />
      </div>

      <div className="form-group">
        <label>Meal Type</label>
        <select
          value={formData.mealType}
          onChange={(e) => setFormData({ ...formData, mealType: e.target.value as any })}
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
        <button type="submit" className="btn-save">
          {meal ? 'Update' : 'Add'} Meal
        </button>
      </div>

      <style>{`
        .meal-form h3 {
          color: #00b4ff;
          font-family: 'Orbitron', monospace;
          margin: 0 0 24px 0;
          text-align: center;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          color: #ffffff;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
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
        .form-group select:focus {
          outline: none;
          border-color: #00b4ff;
          box-shadow: 0 0 15px rgba(0, 180, 255, 0.3);
        }

        .form-group select option {
          background: #0f1720;
          color: #ffffff;
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
      `}</style>
    </form>
  );
};

export default MealPlanner;