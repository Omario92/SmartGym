/**
 * AI Smart Trainer — Type definitions
 * Strict schemas for all AI inputs, outputs, and error states.
 */

// ─── User Profile ─────────────────────────────────────────────────────────────

export type AIGoal =
  | 'muscle_gain'
  | 'fat_loss'
  | 'strength'
  | 'endurance'
  | 'flexibility'
  | 'maintenance';

export type AIExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type AISplit =
  | 'ppl'
  | 'upper_lower'
  | 'full_body'
  | 'bro_split'
  | 'custom';

export type AIEquipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance_band'
  | 'full_gym';

export interface AIUserProfile {
  goals: AIGoal[];
  experienceLevel: AIExperienceLevel;
  daysPerWeek: number; // 2–7
  equipment: AIEquipment[];
  preferredSplit: AISplit;
  focusMuscles: string[];
  age?: number;
}

// ─── Context (sent to AI calls) ───────────────────────────────────────────────

export interface AIExerciseRef {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
}

export interface AIBuildContext {
  userProfile: AIUserProfile;
  recentWorkoutNames: string[];
  workoutFrequencyLastMonth: number;
  exerciseLibrary: AIExerciseRef[];
  prsByExercise: Record<string, { oneRM: number; weight: number; reps: number }>;
  bodyStats: {
    currentWeight?: number;
    bodyFat?: number;
    weightTrend?: 'losing' | 'gaining' | 'stable';
    measurements?: Partial<Record<string, number>>;
  };
  sessionsLast4Weeks: number;
}

// ─── Feature 1: Routine Generator ─────────────────────────────────────────────

export interface AIGeneratedExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight?: number;
  restSeconds?: number;
  note?: string;
}

export interface AIGeneratedRoutine {
  name: string;
  description: string;
  color: string;
  category: string;
  estimatedDuration: number;
  exercises: AIGeneratedExercise[];
  reasoning: string;
  splitType: string;
}

// ─── Feature 2: Exercise Auto-Fill ────────────────────────────────────────────

export interface AIExerciseFill {
  description: string;
  instructions: string[];
  tips: string[];
  common_mistakes: string[];
  breathing: string;
  variations: string[];
}

// ─── Feature 3: Smart Weekly Plan ─────────────────────────────────────────────

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface AIWeekDay {
  day: DayOfWeek;
  type: 'rest' | 'active_recovery' | 'workout';
  focus?: string;
  reasoning: string;
  suggestedDuration?: number;
}

export interface AIProgressAnalysis {
  overallScore: number; // 0–100
  trend: 'excellent' | 'good' | 'plateau' | 'declining' | 'insufficient_data';
  insights: string[];
  recommendations: string[];
  actionItems: string[];
  deloadRecommended: boolean;
  plateauDetected: boolean;
  plateauExercise?: string;
}

export interface AISmartWeeklyPlan {
  weekPlan: AIWeekDay[];
  analysis: AIProgressAnalysis;
  weeklyVolumeSets: number;
  intensityAdjustment: 'deload' | 'maintain' | 'increase';
}

// ─── Error ────────────────────────────────────────────────────────────────────

export type AIErrorCode =
  | 'invalid_key'
  | 'rate_limit'
  | 'network'
  | 'parse_error'
  | 'quota_exceeded'
  | 'model_overloaded'
  | 'unknown';

export interface AIServiceError {
  code: AIErrorCode;
  message: string;
  retryable: boolean;
}
