import { UserProfile } from '../db/db';

export interface PersonalizedPlan {
  workoutProgram: WorkoutProgram;
  nutritionPlan: NutritionPlan;
  recommendations: string[];
}

export interface WorkoutProgram {
  name: string;
  type: 'strength' | 'hypertrophy' | 'fat_loss';
  frequency: number;
  duration: number; // weeks
  workouts: WorkoutDay[];
}

export interface WorkoutDay {
  name: string;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  name: string;
  sets: number;
  reps: string;
  restTime: number;
  weight?: number;
  notes?: string;
}

export interface NutritionPlan {
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  mealsPerDay: number;
}

// Formulas and calculations
export class EvaluationModel {
  
  // Calculate BMR using Mifflin-St Jeor equation
  static calculateBMR(profile: UserProfile): number {
    const { weight, height, age, gender } = profile;
    
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  }

  // Calculate TDEE (Total Daily Energy Expenditure)
  static calculateTDEE(profile: UserProfile): number {
    const bmr = this.calculateBMR(profile);
    
    // Activity multipliers - assuming moderate activity for fitness app users
    const activityMultiplier = 1.55; // Moderately active (3-5 days/week)
    
    return bmr * activityMultiplier;
  }

  // Calculate estimated 1RM using Epley formula
  static calculateOneRM(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  }

  // Assess strength level based on body weight ratios
  static assessStrengthLevel(profile: UserProfile): {
    bench: 'beginner' | 'novice' | 'intermediate' | 'advanced';
    squat: 'beginner' | 'novice' | 'intermediate' | 'advanced';
    deadlift: 'beginner' | 'novice' | 'intermediate' | 'advanced';
    overall: 'beginner' | 'novice' | 'intermediate' | 'advanced';
  } {
    const { weight, gender, benchPress = 0, squat = 0, deadlift = 0 } = profile;
    
    // Strength standards (body weight ratios) for males/females
    const standards = gender === 'male' ? {
      bench: { beginner: 0.5, novice: 0.8, intermediate: 1.2, advanced: 1.5 },
      squat: { beginner: 0.8, novice: 1.2, intermediate: 1.8, advanced: 2.2 },
      deadlift: { beginner: 1.0, novice: 1.5, intermediate: 2.0, advanced: 2.5 }
    } : {
      bench: { beginner: 0.3, novice: 0.5, intermediate: 0.8, advanced: 1.0 },
      squat: { beginner: 0.6, novice: 0.9, intermediate: 1.3, advanced: 1.6 },
      deadlift: { beginner: 0.8, novice: 1.2, intermediate: 1.6, advanced: 2.0 }
    };

    const assessLift = (liftWeight: number, standard: any) => {
      const ratio = liftWeight / weight;
      if (ratio >= standard.advanced) return 'advanced';
      if (ratio >= standard.intermediate) return 'intermediate';
      if (ratio >= standard.novice) return 'novice';
      return 'beginner';
    };

    const benchLevel = assessLift(benchPress, standards.bench);
    const squatLevel = assessLift(squat, standards.squat);
    const deadliftLevel = assessLift(deadlift, standards.deadlift);

    // Overall level is the lowest of the three
    const levels = ['beginner', 'novice', 'intermediate', 'advanced'];
    const overallIndex = Math.min(
      levels.indexOf(benchLevel),
      levels.indexOf(squatLevel),
      levels.indexOf(deadliftLevel)
    );

    return {
      bench: benchLevel,
      squat: squatLevel,
      deadlift: deadliftLevel,
      overall: levels[overallIndex] as any
    };
  }

  // Generate personalized workout program
  static generateWorkoutProgram(profile: UserProfile): WorkoutProgram {
    const strengthLevel = this.assessStrengthLevel(profile);
    const { fitnessAim } = profile;

    if (fitnessAim === 'gain_muscle') {
      return this.getHypertrophyProgram(strengthLevel.overall);
    } else if (fitnessAim === 'lose_fat') {
      return this.getFatLossProgram(strengthLevel.overall);
    } else {
      return this.getStrengthProgram(strengthLevel.overall);
    }
  }

  // Generate personalized nutrition plan
  static generateNutritionPlan(profile: UserProfile): NutritionPlan {
    const tdee = this.calculateTDEE(profile);
    const { fitnessAim } = profile;

    let calories: number;
    let proteinPercent: number;
    let carbsPercent: number;
    let fatPercent: number;

    switch (fitnessAim) {
      case 'lose_fat':
        calories = tdee * 0.8; // 20% deficit
        proteinPercent = 40;
        carbsPercent = 30;
        fatPercent = 30;
        break;
      case 'gain_muscle':
        calories = tdee * 1.15; // 15% surplus
        proteinPercent = 25;
        carbsPercent = 50;
        fatPercent = 25;
        break;
      default: // maintain
        calories = tdee;
        proteinPercent = 30;
        carbsPercent = 40;
        fatPercent = 30;
        break;
    }

    const protein = (calories * proteinPercent / 100) / 4; // 4 calories per gram
    const carbs = (calories * carbsPercent / 100) / 4;
    const fat = (calories * fatPercent / 100) / 9; // 9 calories per gram

    return {
      totalCalories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      proteinPercent,
      carbsPercent,
      fatPercent,
      mealsPerDay: 4
    };
  }

  // Create complete personalized plan
  static createPersonalizedPlan(profile: UserProfile): PersonalizedPlan {
    const workoutProgram = this.generateWorkoutProgram(profile);
    const nutritionPlan = this.generateNutritionPlan(profile);
    const strengthLevel = this.assessStrengthLevel(profile);

    const recommendations = [
      `Based on your strength level (${strengthLevel.overall}), we've designed a ${workoutProgram.type} program.`,
      `Your estimated TDEE is ${Math.round(this.calculateTDEE(profile))} calories per day.`,
      `Target ${nutritionPlan.protein}g protein, ${nutritionPlan.carbs}g carbs, ${nutritionPlan.fat}g fat daily.`,
      'Track your workouts and adjust weights progressively.',
      'Stay consistent with your nutrition and training schedule.',
      'Take progress photos and measurements weekly.'
    ];

    return {
      workoutProgram,
      nutritionPlan,
      recommendations
    };
  }

  // Program templates
  private static getStrengthProgram(_level: string): WorkoutProgram {
    const beginner: WorkoutDay[] = [
      {
        name: 'Day A',
        exercises: [
          { name: 'Squat', sets: 3, reps: '5', restTime: 180 },
          { name: 'Bench Press', sets: 3, reps: '5', restTime: 180 },
          { name: 'Bent-over Row', sets: 3, reps: '5', restTime: 180 },
          { name: 'Overhead Press', sets: 2, reps: '8', restTime: 120 },
          { name: 'Romanian Deadlift', sets: 2, reps: '8', restTime: 120 }
        ]
      },
      {
        name: 'Day B',
        exercises: [
          { name: 'Deadlift', sets: 1, reps: '5', restTime: 240 },
          { name: 'Overhead Press', sets: 3, reps: '5', restTime: 180 },
          { name: 'Squat', sets: 3, reps: '5', restTime: 180, weight: 0.9 },
          { name: 'Pull-ups/Chin-ups', sets: 2, reps: 'AMRAP', restTime: 120 },
          { name: 'Dips', sets: 2, reps: '8-12', restTime: 120 }
        ]
      }
    ];

    return {
      name: 'Starting Strength Program',
      type: 'strength',
      frequency: 3,
      duration: 12,
      workouts: beginner
    };
  }

  private static getHypertrophyProgram(_level: string): WorkoutProgram {
    const hypertrophy: WorkoutDay[] = [
      {
        name: 'Upper Body A',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: '8-10', restTime: 120 },
          { name: 'Bent-over Row', sets: 4, reps: '8-10', restTime: 120 },
          { name: 'Overhead Press', sets: 3, reps: '10-12', restTime: 90 },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12', restTime: 90 },
          { name: 'Dips', sets: 3, reps: '12-15', restTime: 90 },
          { name: 'Barbell Curls', sets: 3, reps: '12-15', restTime: 60 }
        ]
      },
      {
        name: 'Lower Body A',
        exercises: [
          { name: 'Squat', sets: 4, reps: '8-10', restTime: 150 },
          { name: 'Romanian Deadlift', sets: 4, reps: '10-12', restTime: 120 },
          { name: 'Bulgarian Split Squat', sets: 3, reps: '12-15', restTime: 90 },
          { name: 'Walking Lunges', sets: 3, reps: '12-15', restTime: 90 },
          { name: 'Calf Raises', sets: 4, reps: '15-20', restTime: 60 },
          { name: 'Plank', sets: 3, reps: '60s', restTime: 60 }
        ]
      },
      {
        name: 'Upper Body B',
        exercises: [
          { name: 'Incline Dumbbell Press', sets: 4, reps: '8-10', restTime: 120 },
          { name: 'Seated Cable Row', sets: 4, reps: '8-10', restTime: 120 },
          { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', restTime: 90 },
          { name: 'Pull-ups', sets: 3, reps: 'AMRAP', restTime: 90 },
          { name: 'Tricep Extensions', sets: 3, reps: '12-15', restTime: 60 },
          { name: 'Hammer Curls', sets: 3, reps: '12-15', restTime: 60 }
        ]
      },
      {
        name: 'Lower Body B',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: '6-8', restTime: 180 },
          { name: 'Front Squat', sets: 3, reps: '10-12', restTime: 120 },
          { name: 'Leg Curls', sets: 3, reps: '12-15', restTime: 90 },
          { name: 'Leg Press', sets: 3, reps: '15-20', restTime: 90 },
          { name: 'Standing Calf Raises', sets: 4, reps: '15-20', restTime: 60 },
          { name: 'Russian Twists', sets: 3, reps: '20', restTime: 60 }
        ]
      }
    ];

    return {
      name: 'Upper/Lower Hypertrophy Split',
      type: 'hypertrophy',
      frequency: 4,
      duration: 8,
      workouts: hypertrophy
    };
  }

  private static getFatLossProgram(_level: string): WorkoutProgram {
    const fatLoss: WorkoutDay[] = [
      {
        name: 'Full Body Circuit A',
        exercises: [
          { name: 'Goblet Squats', sets: 3, reps: '15', restTime: 45 },
          { name: 'Push-ups', sets: 3, reps: '12-15', restTime: 45 },
          { name: 'Bent-over Dumbbell Rows', sets: 3, reps: '12', restTime: 45 },
          { name: 'Mountain Climbers', sets: 3, reps: '20', restTime: 45 },
          { name: 'Plank', sets: 3, reps: '45s', restTime: 45 },
          { name: 'Burpees', sets: 3, reps: '8-10', restTime: 60 }
        ]
      },
      {
        name: 'Full Body Circuit B',
        exercises: [
          { name: 'Deadlifts', sets: 3, reps: '10', restTime: 60 },
          { name: 'Overhead Press', sets: 3, reps: '10', restTime: 45 },
          { name: 'Lunges', sets: 3, reps: '12 each leg', restTime: 45 },
          { name: 'Jumping Jacks', sets: 3, reps: '30', restTime: 30 },
          { name: 'Russian Twists', sets: 3, reps: '20', restTime: 30 },
          { name: 'High Knees', sets: 3, reps: '30s', restTime: 45 }
        ]
      },
      {
        name: 'Full Body Circuit C',
        exercises: [
          { name: 'Thrusters', sets: 3, reps: '12', restTime: 45 },
          { name: 'Renegade Rows', sets: 3, reps: '8 each arm', restTime: 60 },
          { name: 'Jump Squats', sets: 3, reps: '15', restTime: 45 },
          { name: 'Bicycle Crunches', sets: 3, reps: '20', restTime: 30 },
          { name: 'Bear Crawl', sets: 3, reps: '30s', restTime: 45 },
          { name: 'Battle Ropes', sets: 3, reps: '30s', restTime: 60 }
        ]
      }
    ];

    return {
      name: 'Fat Loss Circuit Training',
      type: 'fat_loss',
      frequency: 3,
      duration: 6,
      workouts: fatLoss
    };
  }
}