/**
 * Exercise image URLs — Unsplash free images (no API key needed)
 * Format: https://images.unsplash.com/photo-<ID>?auto=format&fit=crop&w=800&q=80
 */

export const EXERCISE_IMAGES: Record<string, string> = {
  bench_press:       'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
  incline_press:     'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
  dumbbell_flyes:    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  push_ups:          'https://images.unsplash.com/photo-1598971639058-a7e83e5e9ee2?auto=format&fit=crop&w=800&q=80',
  cable_crossover:   'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
  deadlift:          'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
  pull_ups:          'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80',
  barbell_row:       'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  lat_pulldown:      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
  seated_cable_row:  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
  overhead_press:    'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=800&q=80',
  lateral_raises:    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
  face_pulls:        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  barbell_curl:      'https://images.unsplash.com/photo-1583454155184-870a1f63aebc?auto=format&fit=crop&w=800&q=80',
  tricep_dips:       'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=800&q=80',
  hammer_curl:       'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
  squat:             'https://images.unsplash.com/photo-1567598508481-65985588e295?auto=format&fit=crop&w=800&q=80',
  romanian_deadlift: 'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?auto=format&fit=crop&w=800&q=80',
  leg_press:         'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
  lunges:            'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=800&q=80',
  calf_raises:       'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  plank:             'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=800&q=80',
  crunches:          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
  leg_raises:        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
  hip_thrust:        'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?auto=format&fit=crop&w=800&q=80',
  treadmill_run:     'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=800&q=80',
  burpees:           'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=800&q=80',
  jumping_jacks:     'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&w=800&q=80',
  mountain_climbers: 'https://images.unsplash.com/photo-1598971639058-a7e83e5e9ee2?auto=format&fit=crop&w=800&q=80',
  // Extras — more exercises for 40+ total
  chest_press_machine: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  dip_bar:             'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=800&q=80',
  dumbbell_row:        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
  front_raise:         'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=800&q=80',
  preacher_curl:       'https://images.unsplash.com/photo-1583454155184-870a1f63aebc?auto=format&fit=crop&w=800&q=80',
  tricep_pushdown:     'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  leg_curl:            'https://images.unsplash.com/photo-1567598508481-65985588e295?auto=format&fit=crop&w=800&q=80',
  leg_extension:       'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
  glute_bridge:        'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?auto=format&fit=crop&w=800&q=80',
  russian_twist:       'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
  bicycle_crunch:      'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=800&q=80',
  box_jumps:           'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&w=800&q=80',
  jump_rope:           'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=800&q=80',
};

export const EXERCISE_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80';

export const getExerciseImage = (id: string): string =>
  EXERCISE_IMAGES[id] ?? EXERCISE_FALLBACK_IMAGE;
