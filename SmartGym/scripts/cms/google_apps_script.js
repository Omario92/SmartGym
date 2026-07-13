/**
 * SmartGym CMS — Google Apps Script
 * ===================================
 * Deployed as a Web App to serve exercise/routine data from Google Sheets.
 *
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets → Extensions → Apps Script
 * 2. Paste this entire file
 * 3. Deploy → New Deployment → Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployment URL to your .env:
 *    EXPO_PUBLIC_CMS_BASE_URL=https://script.google.com/macros/s/YOUR_ID/exec
 *
 * ENDPOINTS:
 *   GET ?path=exercises              — Full exercise catalog
 *   GET ?path=exercises&muscle=chest — Filtered by muscle group
 *   GET ?path=routines               — Default/explore routines
 *   GET ?path=version                — Schema version + updated timestamps
 *
 * SHEET NAMES (must match exactly):
 *   "Exercises"
 *   "Routines"
 *   "Routine_Exercises"
 */

// ─── Configuration ────────────────────────────────────────────────────────────

var CONFIG = {
  CACHE_SECONDS: 3600,           // 1 hour server-side cache
  SCHEMA_VERSION: '1.0.0',
  MAX_ROWS: 5000,
  CORS_ORIGIN: '*',
};

// ─── Router ───────────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var path = (e.parameter && e.parameter.path) ? e.parameter.path : 'version';
    var params = e.parameter || {};

    var result;
    switch (path) {
      case 'exercises':
        result = handleExercises(params);
        break;
      case 'routines':
        result = handleRoutines(params);
        break;
      case 'version':
        result = handleVersion();
        break;
      default:
        result = errorResponse(404, 'Unknown path: ' + path);
    }

    return buildResponse(result);
  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return buildResponse(errorResponse(500, err.toString()));
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleVersion() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var exerciseSheet = ss.getSheetByName('Exercises');
  var routineSheet  = ss.getSheetByName('Routines');

  return {
    version: CONFIG.SCHEMA_VERSION,
    exercises_updated_at: exerciseSheet
      ? new Date(exerciseSheet.getRange(1, 1).getSheet().getLastRow()).toISOString()
      : null,
    routines_updated_at: routineSheet
      ? new Date().toISOString()
      : null,
    generated_at: new Date().toISOString(),
  };
}

function handleExercises(params) {
  var cache = CacheService.getScriptCache();
  var cacheKey = 'exercises_' + JSON.stringify(params);
  var cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Exercises');
  if (!sheet) throw new Error('Sheet "Exercises" not found');

  var data   = sheet.getDataRange().getValues();
  var headers = normalizeHeaders(data[0]);
  var exercises = [];

  for (var i = 1; i < data.length && i < CONFIG.MAX_ROWS; i++) {
    var row = data[i];
    if (!row[0]) continue; // skip empty rows

    var exercise = rowToExercise(headers, row);
    if (!exercise) continue;

    // Apply filters
    if (params.muscle && exercise.muscleGroup !== params.muscle) continue;
    if (params.equipment && exercise.equipment !== params.equipment) continue;
    if (params.difficulty && exercise.difficulty !== params.difficulty) continue;

    exercises.push(exercise);
  }

  var result = {
    version: CONFIG.SCHEMA_VERSION,
    count: exercises.length,
    exercises: exercises,
    generated_at: new Date().toISOString(),
  };

  // Cache the response
  try {
    cache.put(cacheKey, JSON.stringify(result), CONFIG.CACHE_SECONDS);
  } catch (e) {
    // Payload might be too large for cache — ignore
  }

  return result;
}

function handleRoutines(params) {
  var cache = CacheService.getScriptCache();
  var cacheKey = 'routines_' + JSON.stringify(params);
  var cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  var ss             = SpreadsheetApp.getActiveSpreadsheet();
  var routineSheet   = ss.getSheetByName('Routines');
  var exercisesSheet = ss.getSheetByName('Routine_Exercises');

  if (!routineSheet) throw new Error('Sheet "Routines" not found');
  if (!exercisesSheet) throw new Error('Sheet "Routine_Exercises" not found');

  // Load routine exercises indexed by routine_id
  var exData   = exercisesSheet.getDataRange().getValues();
  var exHeaders = normalizeHeaders(exData[0]);
  var exerciseMap = {};

  for (var i = 1; i < exData.length; i++) {
    var exRow = exData[i];
    if (!exRow[0]) continue;
    var ex = rowToRoutineExercise(exHeaders, exRow);
    if (!ex) continue;
    if (!exerciseMap[ex.routineId]) exerciseMap[ex.routineId] = [];
    exerciseMap[ex.routineId].push(ex);
  }

  // Sort exercises by order within each routine
  Object.keys(exerciseMap).forEach(function(rid) {
    exerciseMap[rid].sort(function(a, b) { return a.order - b.order; });
  });

  // Load routines
  var rData   = routineSheet.getDataRange().getValues();
  var rHeaders = normalizeHeaders(rData[0]);
  var routines = [];

  for (var j = 1; j < rData.length && j < CONFIG.MAX_ROWS; j++) {
    var rRow = rData[j];
    if (!rRow[0]) continue;
    var routine = rowToRoutine(rHeaders, rRow);
    if (!routine) continue;

    routine.exercises = exerciseMap[routine.id] || [];
    routines.push(routine);
  }

  var result = {
    version: CONFIG.SCHEMA_VERSION,
    count: routines.length,
    routines: routines,
    generated_at: new Date().toISOString(),
  };

  try {
    cache.put(cacheKey, JSON.stringify(result), CONFIG.CACHE_SECONDS);
  } catch (e) { /* ignore */ }

  return result;
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToExercise(headers, row) {
  try {
    var id = getString(row, headers, 'id');
    var name = getString(row, headers, 'name');
    if (!id || !name) return null;

    return {
      id: id,
      slug: getString(row, headers, 'slug') || slugify(name),
      name: name,
      description: getString(row, headers, 'description') || '',
      muscleGroup: getString(row, headers, 'muscle_group') || 'full_body',
      secondaryMuscles: parseArray(getString(row, headers, 'secondary_muscles')),
      category: getString(row, headers, 'category') || '',
      equipment: getString(row, headers, 'equipment') || 'bodyweight',
      type: getString(row, headers, 'type') || 'strength',
      difficulty: getString(row, headers, 'difficulty') || 'intermediate',
      instructions: parseArray(getString(row, headers, 'instructions')),
      tips: parseArray(getString(row, headers, 'tips')),
      imageUrl: getString(row, headers, 'image_url') || '',
      gifUrl: getString(row, headers, 'gif_url') || '',
      videoUrl: getString(row, headers, 'video_url') || '',
      caloriesPerMinute: getNumber(row, headers, 'calories_per_minute'),
      isPopular: getBool(row, headers, 'is_popular'),
      source: 'cms',
      updatedAt: getString(row, headers, 'updated_at') || new Date().toISOString(),
    };
  } catch (e) {
    Logger.log('rowToExercise error: ' + e);
    return null;
  }
}

function rowToRoutine(headers, row) {
  try {
    var id = getString(row, headers, 'id');
    var name = getString(row, headers, 'name');
    if (!id || !name) return null;

    return {
      id: id,
      name: name,
      description: getString(row, headers, 'description') || '',
      color: getString(row, headers, 'color') || '#00FF9D',
      category: getString(row, headers, 'category') || '',
      estimatedDuration: getNumber(row, headers, 'estimated_duration_minutes'),
      difficulty: getString(row, headers, 'difficulty') || 'intermediate',
      source: 'explore',
      imageUrl: getString(row, headers, 'image_url') || '',
      exercises: [], // populated by caller
      createdAt: getString(row, headers, 'created_at') || new Date().toISOString(),
      updatedAt: getString(row, headers, 'updated_at') || new Date().toISOString(),
    };
  } catch (e) {
    Logger.log('rowToRoutine error: ' + e);
    return null;
  }
}

function rowToRoutineExercise(headers, row) {
  try {
    var routineId = getString(row, headers, 'routine_id');
    var exerciseId = getString(row, headers, 'exercise_id');
    if (!routineId || !exerciseId) return null;

    return {
      routineId: routineId,
      exerciseId: exerciseId,
      exerciseName: getString(row, headers, 'exercise_name') || '',
      order: getNumber(row, headers, 'display_order') || 0,
      sets: getNumber(row, headers, 'sets') || 3,
      reps: getNumber(row, headers, 'reps'),
      weight: getNumber(row, headers, 'weight_kg'),
      restSeconds: getNumber(row, headers, 'rest_seconds'),
      note: getString(row, headers, 'note') || '',
    };
  } catch (e) {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeHeaders(headerRow) {
  var map = {};
  headerRow.forEach(function(h, i) {
    if (h) map[h.toString().trim().toLowerCase().replace(/\s+/g, '_')] = i;
  });
  return map;
}

function getString(row, headers, key) {
  var idx = headers[key];
  if (idx === undefined) return '';
  var val = row[idx];
  return val !== undefined && val !== null ? val.toString().trim() : '';
}

function getNumber(row, headers, key) {
  var str = getString(row, headers, key);
  if (!str) return undefined;
  var n = parseFloat(str);
  return isNaN(n) ? undefined : n;
}

function getBool(row, headers, key) {
  var str = getString(row, headers, key).toLowerCase();
  return str === 'true' || str === '1' || str === 'yes';
}

function parseArray(str) {
  if (!str) return [];
  return str.split('|').map(function(s) { return s.trim(); }).filter(Boolean);
}

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function errorResponse(code, message) {
  return { error: true, code: code, message: message };
}

function buildResponse(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
