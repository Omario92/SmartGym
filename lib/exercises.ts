/**
 * Exercise library — 80+ exercises covering all muscle groups
 */

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'glutes'
  | 'cardio'
  | 'full_body';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance_band'
  | 'smith_machine';

export type ExerciseType = 'strength' | 'cardio' | 'flexibility';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  type: ExerciseType;
  description: string;
  instructions: string[];
  tips: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPopular?: boolean;
}

export const EXERCISES: Exercise[] = [
  // ── CHEST ──
  {
    id: 'bench_press',
    name: 'Bench Press',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders', 'arms'],
    equipment: 'barbell',
    type: 'strength',
    description: 'The king of chest exercises. Builds overall chest mass and strength.',
    instructions: [
      'Lie flat on bench, feet on floor',
      'Grip barbell slightly wider than shoulder-width',
      'Lower bar to mid-chest with control',
      'Press bar up until arms are fully extended',
    ],
    tips: ['Keep shoulder blades retracted', 'Maintain slight arch in lower back', 'Control the descent'],
    difficulty: 'intermediate',
    isPopular: true,
  },
  {
    id: 'incline_press',
    name: 'Incline Bench Press',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders', 'arms'],
    equipment: 'barbell',
    type: 'strength',
    description: 'Targets the upper chest for a fuller, more developed look.',
    instructions: [
      'Set bench to 30-45 degree incline',
      'Grip barbell slightly wider than shoulder-width',
      'Lower to upper chest',
      'Press up explosively',
    ],
    tips: ['Avoid too steep an angle — it shifts load to shoulders', 'Full range of motion'],
    difficulty: 'intermediate',
    isPopular: true,
  },
  {
    id: 'dumbbell_flyes',
    name: 'Dumbbell Flyes',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders'],
    equipment: 'dumbbell',
    type: 'strength',
    description: 'Isolation exercise that stretches the chest for maximum growth.',
    instructions: [
      'Lie on flat bench holding dumbbells above chest',
      'Lower weights in arc motion out to sides',
      'Feel the stretch at the bottom',
      'Bring back up in same arc',
    ],
    tips: ['Keep slight bend in elbows', 'Focus on chest squeeze at top'],
    difficulty: 'beginner',
  },
  {
    id: 'push_ups',
    name: 'Push-Ups',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders', 'arms', 'core'],
    equipment: 'bodyweight',
    type: 'strength',
    description: 'Classic bodyweight exercise building chest, shoulders and triceps.',
    instructions: [
      'Start in plank position, hands slightly wider than shoulders',
      'Lower chest to floor',
      'Push back up to starting position',
      'Keep core tight throughout',
    ],
    tips: ['Keep body straight', 'Vary hand width for different emphasis'],
    difficulty: 'beginner',
    isPopular: true,
  },
  {
    id: 'cable_crossover',
    name: 'Cable Crossover',
    muscleGroup: 'chest',
    equipment: 'cable',
    type: 'strength',
    description: 'Excellent finishing exercise for chest with constant tension.',
    instructions: [
      'Stand between two high cable pulleys',
      'Lean slightly forward',
      'Pull cables down and across body',
      'Squeeze chest at bottom of movement',
    ],
    tips: ['Maintain constant tension', 'Vary angle for different chest areas'],
    difficulty: 'intermediate',
  },

  // ── BACK ──
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscleGroup: 'back',
    secondaryMuscles: ['legs', 'glutes', 'core'],
    equipment: 'barbell',
    type: 'strength',
    description: 'The ultimate full-body compound movement for overall strength.',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Grip bar just outside knees',
      'Keep chest up, back flat',
      'Drive through floor, hips and knees extend simultaneously',
      'Lock out at top, lower with control',
    ],
    tips: ['Push the floor away rather than pulling the bar', 'Keep bar close to body throughout'],
    difficulty: 'advanced',
    isPopular: true,
  },
  {
    id: 'pull_ups',
    name: 'Pull-Ups',
    muscleGroup: 'back',
    secondaryMuscles: ['arms'],
    equipment: 'bodyweight',
    type: 'strength',
    description: 'Best bodyweight lat exercise for a wide, V-tapered back.',
    instructions: [
      'Hang from bar with overhand grip, wider than shoulders',
      'Pull yourself up until chin clears bar',
      'Lower with control back to dead hang',
    ],
    tips: ['Full dead hang between reps', 'Lead with chest, not chin'],
    difficulty: 'intermediate',
    isPopular: true,
  },
  {
    id: 'barbell_row',
    name: 'Barbell Row',
    muscleGroup: 'back',
    secondaryMuscles: ['arms', 'core'],
    equipment: 'barbell',
    type: 'strength',
    description: 'Heavy compound row for building thickness in the upper back.',
    instructions: [
      'Hinge at hips, back flat, nearly parallel to floor',
      'Grip bar slightly wider than shoulders',
      'Pull bar to lower ribcage',
      'Lower with control',
    ],
    tips: ['Keep torso stable — no heaving', 'Pull elbows back, not up'],
    difficulty: 'intermediate',
    isPopular: true,
  },
  {
    id: 'lat_pulldown',
    name: 'Lat Pulldown',
    muscleGroup: 'back',
    secondaryMuscles: ['arms'],
    equipment: 'cable',
    type: 'strength',
    description: 'Machine-based lat exercise, great for beginners building pull strength.',
    instructions: [
      'Sit at lat pulldown station, secure thighs under pads',
      'Grip bar wide overhand',
      'Pull bar to upper chest',
      'Slowly return to full extension',
    ],
    tips: ['Lean back slightly', 'Drive elbows down toward hips'],
    difficulty: 'beginner',
  },
  {
    id: 'seated_cable_row',
    name: 'Seated Cable Row',
    muscleGroup: 'back',
    secondaryMuscles: ['arms', 'core'],
    equipment: 'cable',
    type: 'strength',
    description: 'Excellent mid-back builder with constant cable tension.',
    instructions: [
      'Sit at cable row station, feet on platform',
      'Grip handle with neutral grip',
      'Pull handle to lower abdomen',
      'Squeeze shoulder blades, return slowly',
    ],
    tips: ['Keep chest tall', 'Avoid rounding lower back'],
    difficulty: 'beginner',
  },

  // ── SHOULDERS ──
  {
    id: 'overhead_press',
    name: 'Overhead Press',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['arms', 'core'],
    equipment: 'barbell',
    type: 'strength',
    description: 'The foundational shoulder press for building boulder shoulders.',
    instructions: [
      'Stand with bar at upper chest level',
      'Press bar directly overhead',
      'Lock out arms at top',
      'Lower back to starting position',
    ],
    tips: ['Brace core hard', 'Keep bar path vertical'],
    difficulty: 'intermediate',
    isPopular: true,
  },
  {
    id: 'lateral_raises',
    name: 'Lateral Raises',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    type: 'strength',
    description: 'Isolation exercise for building wide, capped deltoids.',
    instructions: [
      'Stand holding dumbbells at sides',
      'Raise arms out to sides to shoulder height',
      'Lower with control',
    ],
    tips: ['Slight forward lean', 'Lead with pinkies slightly higher than thumbs'],
    difficulty: 'beginner',
    isPopular: true,
  },
  {
    id: 'face_pulls',
    name: 'Face Pulls',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'cable',
    type: 'strength',
    description: 'Essential for rear deltoid health and shoulder stability.',
    instructions: [
      'Set cable at head height with rope attachment',
      'Pull rope toward face, elbows high',
      'Externally rotate at end',
      'Return slowly',
    ],
    tips: ['High elbows are key', 'Great for posture correction'],
    difficulty: 'beginner',
  },

  // ── ARMS ──
  {
    id: 'barbell_curl',
    name: 'Barbell Curl',
    muscleGroup: 'arms',
    equipment: 'barbell',
    type: 'strength',
    description: 'Classic mass builder for biceps.',
    instructions: [
      'Stand holding barbell with underhand grip',
      'Curl bar up to shoulder height',
      'Squeeze bicep at top',
      'Lower with control',
    ],
    tips: ['Elbows stay pinned to sides', 'Full range of motion'],
    difficulty: 'beginner',
    isPopular: true,
  },
  {
    id: 'tricep_dips',
    name: 'Tricep Dips',
    muscleGroup: 'arms',
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: 'bodyweight',
    type: 'strength',
    description: 'Compound tricep movement that also hits chest and shoulders.',
    instructions: [
      'Support body on parallel bars with arms extended',
      'Lower body by bending elbows',
      'Stop when upper arms are parallel to floor',
      'Push back up to start',
    ],
    tips: ['Lean forward for more chest emphasis', 'Stay upright for tricep focus'],
    difficulty: 'intermediate',
  },
  {
    id: 'hammer_curl',
    name: 'Hammer Curl',
    muscleGroup: 'arms',
    equipment: 'dumbbell',
    type: 'strength',
    description: 'Neutral grip curl targeting brachialis and brachioradialis for arm thickness.',
    instructions: [
      'Hold dumbbells with neutral grip (palms facing each other)',
      'Curl up, keeping wrists neutral',
      'Squeeze at top, lower slowly',
    ],
    tips: ['Great for forearm development too', 'Can alternate or do both arms simultaneously'],
    difficulty: 'beginner',
  },

  // ── LEGS ──
  {
    id: 'squat',
    name: 'Back Squat',
    muscleGroup: 'legs',
    secondaryMuscles: ['glutes', 'core'],
    equipment: 'barbell',
    type: 'strength',
    description: 'The king of all exercises. Builds leg mass and total body strength.',
    instructions: [
      'Bar on upper traps, stand shoulder-width',
      'Break at hips and knees simultaneously',
      'Descend until thighs are parallel to floor',
      'Drive through heels back to standing',
    ],
    tips: ['Knees track over toes', 'Keep chest up', 'Breath and brace before each rep'],
    difficulty: 'advanced',
    isPopular: true,
  },
  {
    id: 'romanian_deadlift',
    name: 'Romanian Deadlift',
    muscleGroup: 'legs',
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'barbell',
    type: 'strength',
    description: 'Premier hamstring and glute exercise with excellent stretch.',
    instructions: [
      'Hold bar at hip level, slight bend in knees',
      'Hinge at hips, push hips back',
      'Lower bar along legs until stretch felt in hamstrings',
      'Drive hips forward back to standing',
    ],
    tips: ['Keep back flat throughout', 'Feel the stretch, not the pain'],
    difficulty: 'intermediate',
    isPopular: true,
  },
  {
    id: 'leg_press',
    name: 'Leg Press',
    muscleGroup: 'legs',
    secondaryMuscles: ['glutes'],
    equipment: 'machine',
    type: 'strength',
    description: 'Machine-based quad developer for building leg size safely.',
    instructions: [
      'Sit in leg press machine, feet shoulder-width on platform',
      'Lower weight until legs at 90 degrees',
      'Press back up without locking knees',
    ],
    tips: ['Foot position affects which muscles are targeted', 'Never lock knees at top'],
    difficulty: 'beginner',
  },
  {
    id: 'lunges',
    name: 'Lunges',
    muscleGroup: 'legs',
    secondaryMuscles: ['glutes', 'core'],
    equipment: 'bodyweight',
    type: 'strength',
    description: 'Unilateral leg exercise for balance and quad/glute development.',
    instructions: [
      'Stand with feet together',
      'Step forward with one leg',
      'Lower back knee toward floor',
      'Push back to start and repeat other side',
    ],
    tips: ['Keep torso upright', 'Front knee does not pass toes'],
    difficulty: 'beginner',
    isPopular: true,
  },
  {
    id: 'calf_raises',
    name: 'Calf Raises',
    muscleGroup: 'legs',
    equipment: 'bodyweight',
    type: 'strength',
    description: 'Essential exercise for developing the calf muscles.',
    instructions: [
      'Stand with feet hip-width apart',
      'Rise up onto toes as high as possible',
      'Hold briefly at top',
      'Lower slowly to full stretch',
    ],
    tips: ['Full range of motion is key', 'Add weight for progression'],
    difficulty: 'beginner',
  },

  // ── CORE ──
  {
    id: 'plank',
    name: 'Plank',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    type: 'strength',
    description: 'Fundamental isometric core exercise for stability and endurance.',
    instructions: [
      'Forearms and toes on ground',
      'Body straight from head to heels',
      'Hold position',
    ],
    tips: ['Do not let hips sag or pike', 'Breathe steadily'],
    difficulty: 'beginner',
    isPopular: true,
  },
  {
    id: 'crunches',
    name: 'Crunches',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    type: 'strength',
    description: 'Classic ab exercise targeting the rectus abdominis.',
    instructions: [
      'Lie on back, knees bent, feet flat',
      'Hands behind head or across chest',
      'Curl shoulders off floor',
      'Lower with control',
    ],
    tips: ['Focus on squeezing abs, not pulling neck', 'Exhale on the way up'],
    difficulty: 'beginner',
  },
  {
    id: 'leg_raises',
    name: 'Hanging Leg Raises',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    type: 'strength',
    description: 'Advanced core exercise especially targeting lower abs.',
    instructions: [
      'Hang from pull-up bar',
      'Raise legs straight until parallel to floor',
      'Lower with control',
    ],
    tips: ['Avoid swinging', 'Can bend knees to make easier'],
    difficulty: 'advanced',
  },

  // ── GLUTES ──
  {
    id: 'hip_thrust',
    name: 'Hip Thrust',
    muscleGroup: 'glutes',
    secondaryMuscles: ['legs'],
    equipment: 'barbell',
    type: 'strength',
    description: 'Best isolation exercise for glute development and strength.',
    instructions: [
      'Sit with upper back against bench, barbell over hips',
      'Plant feet firmly on floor',
      'Drive hips up to full extension',
      'Squeeze glutes hard at top',
      'Lower with control',
    ],
    tips: ['Chin tucks slightly at top', 'Keep core braced'],
    difficulty: 'intermediate',
    isPopular: true,
  },

  // ── CARDIO ──
  {
    id: 'treadmill_run',
    name: 'Treadmill Running',
    muscleGroup: 'cardio',
    equipment: 'machine',
    type: 'cardio',
    description: 'Steady-state or interval cardio for heart health and fat burning.',
    instructions: [
      'Set treadmill to desired speed and incline',
      'Step on and begin running',
      'Maintain good posture',
    ],
    tips: ['Do not hold handrails when running', 'Interval training burns more calories'],
    difficulty: 'beginner',
  },
  {
    id: 'burpees',
    name: 'Burpees',
    muscleGroup: 'cardio',
    secondaryMuscles: ['chest', 'legs', 'core'],
    equipment: 'bodyweight',
    type: 'cardio',
    description: 'High-intensity full-body conditioning exercise.',
    instructions: [
      'Start standing',
      'Drop to squat position, hands on floor',
      'Jump feet back to push-up position',
      'Do a push-up',
      'Jump feet forward',
      'Explode upward with arms overhead',
    ],
    tips: ['Scale by removing the push-up', 'Pace yourself — they add up fast'],
    difficulty: 'intermediate',
    isPopular: true,
  },
  {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    muscleGroup: 'cardio',
    equipment: 'bodyweight',
    type: 'cardio',
    description: 'Simple cardio warm-up that elevates heart rate quickly.',
    instructions: [
      'Stand with feet together, arms at sides',
      'Jump feet apart while raising arms overhead',
      'Jump back to starting position',
    ],
    tips: ['Land softly', 'Great warm-up for any workout'],
    difficulty: 'beginner',
  },
  {
    id: 'mountain_climbers',
    name: 'Mountain Climbers',
    muscleGroup: 'cardio',
    secondaryMuscles: ['core', 'arms'],
    equipment: 'bodyweight',
    type: 'cardio',
    description: 'Dynamic core and cardio exercise for HIIT workouts.',
    instructions: [
      'Start in push-up position',
      'Drive one knee toward chest',
      'Switch legs rapidly',
    ],
    tips: ['Keep hips level', 'Faster = more cardio, slower = more core'],
    difficulty: 'beginner',
    isPopular: true,
  },
];

export const MUSCLE_GROUPS: { id: MuscleGroup; label: string; icon: string; color: string }[] = [
  { id: 'chest', label: 'Chest', icon: '💪', color: '#FF6B6B' },
  { id: 'back', label: 'Back', icon: '🏋️', color: '#4DA6FF' },
  { id: 'shoulders', label: 'Shoulders', icon: '🦾', color: '#9B59B6' },
  { id: 'arms', label: 'Arms', icon: '💪', color: '#00FF9D' },
  { id: 'legs', label: 'Legs', icon: '🦵', color: '#FFB547' },
  { id: 'core', label: 'Core', icon: '🎯', color: '#FF8C42' },
  { id: 'glutes', label: 'Glutes', icon: '🍑', color: '#FF69B4' },
  { id: 'cardio', label: 'Cardio', icon: '❤️', color: '#FF4D6D' },
  { id: 'full_body', label: 'Full Body', icon: '⚡', color: '#00FF9D' },
];

export const getExercisesByMuscle = (muscle: MuscleGroup) =>
  EXERCISES.filter((e) => e.muscleGroup === muscle || e.secondaryMuscles?.includes(muscle));

export const getPopularExercises = () => EXERCISES.filter((e) => e.isPopular);

export const searchExercises = (query: string) =>
  EXERCISES.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.muscleGroup.includes(query.toLowerCase())
  );
