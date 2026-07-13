const https = require('https');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1qFMidLbnndnG0obmo64nJf398frwRXO065pafrd9Cig';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Exercises`;
const OUT_FILE = path.join(__dirname, '../lib/exercises.ts');

https.get(URL, (res) => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const match = data.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
      if (!match || !match[1]) {
        console.error('Failed to parse Google Sheets response.');
        return;
      }
      
      const json = JSON.parse(match[1]);
      const cols = json.table.cols;
      const rows = json.table.rows;
      
      // Build header map
      const headers = {};
      cols.forEach((c, idx) => {
        if (c && c.label) headers[c.label] = idx;
      });
      
      const exercises = [];
      
      for (const row of rows) {
        const c = row.c;
        const id = c[headers['id']]?.v;
        const name = c[headers['name_en']]?.v;
        if (!id || !name) continue;
        
        // Only get published exercises
        if (c[headers['status']]?.v !== 'published') continue;
        
        const secondary = c[headers['secondary_muscles']]?.v;
        const secondaryArray = secondary ? secondary.split('|').map(s => s.trim()) : [];
        
        const inst = c[headers['instructions_en']]?.v;
        const instructions = inst ? inst.split('|').map(s => s.trim()) : [];
        
        const t = c[headers['tips_en']]?.v;
        const tips = t ? t.split('|').map(s => s.trim()) : [];
        
        exercises.push({
          id,
          name,
          muscleGroup: c[headers['muscle_group']]?.v || 'full_body',
          secondaryMuscles: secondaryArray.length > 0 ? secondaryArray : undefined,
          equipment: c[headers['equipment']]?.v || 'bodyweight',
          type: c[headers['exercise_type']]?.v || 'strength',
          description: c[headers['description_en']]?.v || '',
          instructions,
          tips,
          difficulty: c[headers['difficulty']]?.v || 'intermediate',
          isPopular: c[headers['is_popular']]?.v === true,
          image: c[headers['image_url']]?.v || '',
          gif: c[headers['gif_url']]?.v || undefined,
        });
      }
      
      updateExercisesFile(exercises);
      
    } catch (err) {
      console.error('Error parsing JSON:', err);
    }
  });
}).on('error', (e) => {
  console.error('Network error:', e);
});

function updateExercisesFile(exercises) {
  const currentContent = fs.readFileSync(OUT_FILE, 'utf8');
  
  // Find where EXERCISES array starts and ends
  // It starts with `const _EXERCISES: RawExercise[] = [`
  // and ends before `export const LOCAL_EXERCISES`
  
  const startIndex = currentContent.indexOf('const _EXERCISES: RawExercise[] = [');
  if (startIndex === -1) {
    console.error('Could not find _EXERCISES array in lib/exercises.ts');
    return;
  }
  
  const endIndex = currentContent.indexOf('export const EXERCISES: Exercise[] =', startIndex);
  if (endIndex === -1) {
    console.error('Could not find end of _EXERCISES array');
    return;
  }
  
  // We need to carefully replace the array content
  const head = currentContent.substring(0, startIndex);
  const tail = currentContent.substring(endIndex);
  
  // Format the exercises array as a string
  const exercisesStr = 'const _EXERCISES: RawExercise[] = ' + JSON.stringify(exercises, null, 2)
    .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
    + ';\n\n';
    
  const newContent = head + exercisesStr + tail;
  
  fs.writeFileSync(OUT_FILE, newContent, 'utf8');
  console.log(`Successfully updated lib/exercises.ts with ${exercises.length} exercises from Google Sheets.`);
}
