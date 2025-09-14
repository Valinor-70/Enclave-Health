import Dexie, { Table } from 'dexie';

// Database interfaces
export interface UserProfile {
  id?: number;
  name: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  fitnessAim: 'lose_fat' | 'gain_muscle' | 'maintain';
  benchPress?: number;
  squat?: number;
  deadlift?: number;
  overheadPress?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutPlan {
  id?: number;
  userId: number;
  name: string;
  description: string;
  exercises: Exercise[];
  frequency: number; // days per week
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id?: number;
  name: string;
  sets: number;
  reps: string; // e.g., "8-12", "5", "AMRAP"
  weight?: number;
  restTime: number; // seconds
  notes?: string;
}

export interface WorkoutLog {
  id?: number;
  userId: number;
  workoutPlanId: number;
  date: Date;
  exercises: ExerciseLog[];
  duration?: number; // minutes
  notes?: string;
  completed: boolean;
  createdAt: Date;
}

export interface ExerciseLog {
  exerciseId: number;
  sets: SetLog[];
  notes?: string;
}

export interface SetLog {
  reps: number;
  weight: number;
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface MealPlan {
  id?: number;
  userId: number;
  name: string;
  meals: Meal[];
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meal {
  id?: number;
  name: string;
  ingredients: Ingredient[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLog {
  id?: number;
  userId: number;
  date: Date;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: Date;
}

export interface ProgressEntry {
  id?: number;
  userId: number;
  date: Date;
  weight?: number;
  bodyFat?: number;
  measurements?: { [key: string]: number }; // neck, chest, waist, etc.
  photos?: string[]; // base64 encoded images
  notes?: string;
  createdAt: Date;
}

export interface SyncQueue {
  id?: number;
  tableName: string;
  operation: 'create' | 'update' | 'delete';
  recordId: number;
  data: any;
  timestamp: Date;
  synced: boolean;
}

// Dexie database class
export class EnclaveFitDB extends Dexie {
  userProfiles!: Table<UserProfile>;
  workoutPlans!: Table<WorkoutPlan>;
  workoutLogs!: Table<WorkoutLog>;
  mealPlans!: Table<MealPlan>;
  mealLogs!: Table<MealLog>;
  progressEntries!: Table<ProgressEntry>;
  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('EnclaveFitDB');
    
    this.version(1).stores({
      userProfiles: '++id, name, createdAt, updatedAt',
      workoutPlans: '++id, userId, name, createdAt, updatedAt',
      workoutLogs: '++id, userId, workoutPlanId, date, completed, createdAt',
      mealPlans: '++id, userId, name, createdAt, updatedAt',
      mealLogs: '++id, userId, date, createdAt',
      progressEntries: '++id, userId, date, createdAt',
      syncQueue: '++id, tableName, operation, timestamp, synced'
    });
  }
}

// Create database instance
export const db = new EnclaveFitDB();

// Helper functions for database operations
export const dbHelpers = {
  // Get or create user profile
  async getCurrentUser(): Promise<UserProfile | undefined> {
    return await db.userProfiles.orderBy('createdAt').last();
  },

  // Add to sync queue
  async addToSyncQueue(tableName: string, operation: 'create' | 'update' | 'delete', recordId: number, data: any) {
    await db.syncQueue.add({
      tableName,
      operation,
      recordId,
      data,
      timestamp: new Date(),
      synced: false
    });
  },

  // Get workout logs for date range
  async getWorkoutLogs(userId: number, startDate: Date, endDate: Date): Promise<WorkoutLog[]> {
    return await db.workoutLogs
      .where('userId').equals(userId)
      .and(log => log.date >= startDate && log.date <= endDate)
      .toArray();
  },

  // Get meal logs for date range
  async getMealLogs(userId: number, startDate: Date, endDate: Date): Promise<MealLog[]> {
    return await db.mealLogs
      .where('userId').equals(userId)
      .and(log => log.date >= startDate && log.date <= endDate)
      .toArray();
  },

  // Get progress entries for date range
  async getProgressEntries(userId: number, startDate: Date, endDate: Date): Promise<ProgressEntry[]> {
    return await db.progressEntries
      .where('userId').equals(userId)
      .and(entry => entry.date >= startDate && entry.date <= endDate)
      .orderBy('date')
      .toArray();
  },

  // Get today's data
  async getTodayData(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [workoutLogs, mealLogs, progressEntries] = await Promise.all([
      this.getWorkoutLogs(userId, today, tomorrow),
      this.getMealLogs(userId, today, tomorrow),
      this.getProgressEntries(userId, today, tomorrow)
    ]);

    return {
      workoutLogs,
      mealLogs,
      progressEntries
    };
  }
};