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
    const strength: WorkoutDay[] = [
      {
        name: 'Day 1: Squat Focus',
        exercises: [
          { name: 'Back Squat', sets: 5, reps: '5', restTime: 180, notes: 'Main strength movement - progressive overload' },
          { name: 'Romanian Deadlift', sets: 4, reps: '6-8', restTime: 150, notes: 'Hip hinge pattern, hamstring development' },
          { name: 'Bulgarian Split Squat', sets: 3, reps: '8-10 each', restTime: 90, notes: 'Unilateral strength and stability' },
          { name: 'Barbell Row', sets: 4, reps: '6-8', restTime: 120, notes: 'Upper back strength for squat support' },
          { name: 'Overhead Press', sets: 3, reps: '8-10', restTime: 120, notes: 'Shoulder stability and strength' },
          { name: 'Walking Lunges', sets: 3, reps: '10 each', restTime: 90, notes: 'Functional strength pattern' },
          { name: 'Plank', sets: 3, reps: '60s', restTime: 60, notes: 'Core stability for compound lifts' }
        ]
      },
      {
        name: 'Day 2: Bench Focus',
        exercises: [
          { name: 'Bench Press', sets: 5, reps: '5', restTime: 180, notes: 'Main upper body strength movement' },
          { name: 'Deadlift', sets: 4, reps: '5', restTime: 180, notes: 'Pull pattern to balance push' },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', restTime: 120, notes: 'Upper chest development' },
          { name: 'Pull-ups/Chin-ups', sets: 4, reps: '5-8', restTime: 120, notes: 'Vertical pull strength' },
          { name: 'Dips', sets: 3, reps: '8-12', restTime: 90, notes: 'Tricep and chest strength' },
          { name: 'Barbell Curls', sets: 3, reps: '8-10', restTime: 75, notes: 'Bicep strength for pulling' },
          { name: 'Close-Grip Push-ups', sets: 2, reps: 'AMRAP', restTime: 60, notes: 'Tricep endurance finisher' }
        ]
      },
      {
        name: 'Day 3: Deadlift Focus',
        exercises: [
          { name: 'Deadlift', sets: 5, reps: '5', restTime: 240, notes: 'Main posterior chain strength movement' },
          { name: 'Front Squat', sets: 4, reps: '6-8', restTime: 150, notes: 'Quad dominant squat variation' },
          { name: 'Bent-over Row', sets: 4, reps: '6-8', restTime: 120, notes: 'Horizontal pull strength' },
          { name: 'Overhead Press', sets: 4, reps: '6-8', restTime: 120, notes: 'Vertical push strength' },
          { name: 'Good Mornings', sets: 3, reps: '10-12', restTime: 90, notes: 'Hip hinge pattern reinforcement' },
          { name: 'Farmer\'s Walk', sets: 3, reps: '40m', restTime: 90, notes: 'Grip strength and core stability' },
          { name: 'Hanging Leg Raises', sets: 3, reps: '8-12', restTime: 75, notes: 'Core strength for deadlifts' }
        ]
      }
    ];

    return {
      name: '3-Day Strength Training Split',
      type: 'strength',
      frequency: 3,
      duration: 12,
      workouts: strength
    };
  }

  private static getHypertrophyProgram(_level: string): WorkoutProgram {
    const hypertrophy: WorkoutDay[] = [
      {
        name: 'Push Day (Chest, Shoulders, Triceps)',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: '6-8', restTime: 180, notes: 'Compound movement for overall chest development' },
          { name: 'Incline Dumbbell Press', sets: 4, reps: '8-10', restTime: 120, notes: 'Upper chest focus, 30-45 degree angle' },
          { name: 'Overhead Press', sets: 4, reps: '6-8', restTime: 150, notes: 'Main shoulder builder, keep core tight' },
          { name: 'Dumbbell Lateral Raises', sets: 4, reps: '12-15', restTime: 90, notes: 'Slow controlled movement, feel the burn' },
          { name: 'Dips', sets: 3, reps: '10-15', restTime: 90, notes: 'Lean forward for chest, upright for triceps' },
          { name: 'Close-Grip Bench Press', sets: 3, reps: '8-12', restTime: 120, notes: 'Hands 12-16 inches apart, tricep focus' },
          { name: 'Cable Lateral Raises', sets: 3, reps: '15-20', restTime: 60, notes: 'Constant tension through ROM' },
          { name: 'Tricep Pushdowns', sets: 4, reps: '12-15', restTime: 75, notes: 'Keep elbows locked at sides' },
          { name: 'Overhead Tricep Extension', sets: 3, reps: '12-15', restTime: 75, notes: 'Full stretch at bottom' },
          { name: 'Diamond Push-ups', sets: 2, reps: 'AMRAP', restTime: 60, notes: 'Burnout set to finish' }
        ]
      },
      {
        name: 'Pull Day (Back, Biceps, Rear Delts)',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: '5-6', restTime: 180, notes: 'King of all lifts, perfect form essential' },
          { name: 'Pull-ups/Chin-ups', sets: 4, reps: '6-12', restTime: 120, notes: 'Add weight if doing 12+ reps easily' },
          { name: 'Bent-over Barbell Row', sets: 4, reps: '8-10', restTime: 120, notes: 'Pull to lower chest, squeeze at top' },
          { name: 'Seated Cable Row', sets: 4, reps: '10-12', restTime: 90, notes: 'Pull to abdomen, retract shoulder blades' },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12', restTime: 90, notes: 'Wide grip, pull to upper chest' },
          { name: 'T-Bar Row', sets: 3, reps: '10-12', restTime: 90, notes: 'Chest supported if available' },
          { name: 'Barbell Curls', sets: 4, reps: '10-12', restTime: 75, notes: 'No swinging, control the weight' },
          { name: 'Hammer Curls', sets: 3, reps: '12-15', restTime: 60, notes: 'Neutral grip, hit brachialis' },
          { name: 'Cable Reverse Fly', sets: 3, reps: '15-20', restTime: 60, notes: 'Rear delt isolation' },
          { name: 'Face Pulls', sets: 3, reps: '15-20', restTime: 60, notes: 'High elbows, pull to face level' }
        ]
      },
      {
        name: 'Legs Day (Quads, Hamstrings, Glutes, Calves)',
        exercises: [
          { name: 'Back Squat', sets: 4, reps: '6-8', restTime: 180, notes: 'King of leg exercises, go deep' },
          { name: 'Romanian Deadlift', sets: 4, reps: '8-10', restTime: 150, notes: 'Hip hinge movement, feel hamstring stretch' },
          { name: 'Bulgarian Split Squat', sets: 3, reps: '10-12 each', restTime: 90, notes: 'Rear foot elevated, front leg focus' },
          { name: 'Leg Press', sets: 4, reps: '12-15', restTime: 120, notes: 'Feet high and wide for glute activation' },
          { name: 'Walking Lunges', sets: 3, reps: '12-15 each', restTime: 90, notes: 'Long steps, knee to floor' },
          { name: 'Leg Curls', sets: 4, reps: '12-15', restTime: 75, notes: 'Lying or seated, control the negative' },
          { name: 'Leg Extension', sets: 3, reps: '15-20', restTime: 75, notes: 'Quad isolation, squeeze at top' },
          { name: 'Calf Raises', sets: 5, reps: '15-20', restTime: 60, notes: 'Full range, pause at top' },
          { name: 'Seated Calf Raises', sets: 3, reps: '20-25', restTime: 60, notes: 'Soleus focus' },
          { name: 'Stiff Leg Deadlift', sets: 3, reps: '12-15', restTime: 90, notes: 'Hamstring and glute stretch' }
        ]
      }
    ];

    return {
      name: '3-Day Push/Pull/Legs Split',
      type: 'hypertrophy',
      frequency: 3,
      duration: 8,
      workouts: hypertrophy
    };
  }

  private static getFatLossProgram(_level: string): WorkoutProgram {
    const fatLoss: WorkoutDay[] = [
      {
        name: 'Day 1: Upper Body Circuit',
        exercises: [
          { name: 'Push-ups', sets: 4, reps: '12-15', restTime: 45, notes: 'Modify on knees if needed' },
          { name: 'Bent-over Dumbbell Rows', sets: 4, reps: '12-15', restTime: 45, notes: 'Keep back straight, squeeze shoulder blades' },
          { name: 'Overhead Press', sets: 3, reps: '10-12', restTime: 60, notes: 'Use dumbbells or barbell' },
          { name: 'Lat Pulldown', sets: 3, reps: '12-15', restTime: 45, notes: 'Wide grip, pull to chest' },
          { name: 'Dips', sets: 3, reps: '8-12', restTime: 45, notes: 'Assisted if needed' },
          { name: 'Mountain Climbers', sets: 3, reps: '20 each', restTime: 30, notes: 'Keep core tight, fast pace' },
          { name: 'Tricep Pushdowns', sets: 3, reps: '15', restTime: 30, notes: 'High rep for metabolic stress' },
          { name: 'Barbell Curls', sets: 3, reps: '12-15', restTime: 30, notes: 'Control the weight' },
          { name: 'Plank', sets: 3, reps: '45s', restTime: 30, notes: 'Hold strong position' },
          { name: 'Burpees', sets: 2, reps: '8-10', restTime: 60, notes: 'High intensity finisher' }
        ]
      },
      {
        name: 'Day 2: Lower Body Circuit',
        exercises: [
          { name: 'Goblet Squats', sets: 4, reps: '15-20', restTime: 45, notes: 'Hold weight at chest, deep squat' },
          { name: 'Romanian Deadlift', sets: 4, reps: '12-15', restTime: 60, notes: 'Hip hinge, feel hamstring stretch' },
          { name: 'Walking Lunges', sets: 3, reps: '12 each', restTime: 45, notes: 'Long steps, knee to ground' },
          { name: 'Leg Press', sets: 3, reps: '15-20', restTime: 45, notes: 'Higher reps for fat loss' },
          { name: 'Jump Squats', sets: 3, reps: '12-15', restTime: 30, notes: 'Explosive movement' },
          { name: 'Leg Curls', sets: 3, reps: '15', restTime: 30, notes: 'Hamstring isolation' },
          { name: 'Calf Raises', sets: 4, reps: '20', restTime: 30, notes: 'High volume for endurance' },
          { name: 'Wall Sit', sets: 3, reps: '45s', restTime: 30, notes: 'Isometric quad burner' },
          { name: 'High Knees', sets: 3, reps: '30s', restTime: 30, notes: 'Cardio burst' },
          { name: 'Bulgarian Split Squats', sets: 2, reps: '10 each', restTime: 45, notes: 'Unilateral finisher' }
        ]
      },
      {
        name: 'Day 3: Full Body HIIT',
        exercises: [
          { name: 'Thrusters', sets: 4, reps: '12', restTime: 45, notes: 'Squat to overhead press combo' },
          { name: 'Renegade Rows', sets: 3, reps: '8 each', restTime: 60, notes: 'Plank position, row each arm' },
          { name: 'Kettlebell Swings', sets: 4, reps: '20', restTime: 45, notes: 'Hip hinge explosive movement' },
          { name: 'Box Jumps', sets: 3, reps: '10', restTime: 45, notes: 'Step down to reduce impact' },
          { name: 'Battle Ropes', sets: 3, reps: '30s', restTime: 30, notes: 'All-out intensity' },
          { name: 'Bear Crawl', sets: 3, reps: '20 steps', restTime: 45, notes: 'Keep hips low' },
          { name: 'Bicycle Crunches', sets: 3, reps: '20 each', restTime: 30, notes: 'Control the movement' },
          { name: 'Jumping Jacks', sets: 3, reps: '30', restTime: 30, notes: 'Classic cardio move' },
          { name: 'Russian Twists', sets: 3, reps: '20 each', restTime: 30, notes: 'Rotate through core' },
          { name: 'Sprawls', sets: 2, reps: '10', restTime: 60, notes: 'Burpee without jump, conditioning' }
        ]
      }
    ];

    return {
      name: '3-Day Fat Loss Circuit Split',
      type: 'fat_loss',
      frequency: 3,
      duration: 6,
      workouts: fatLoss
    };
  }
}