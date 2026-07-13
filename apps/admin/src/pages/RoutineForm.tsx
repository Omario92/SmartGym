import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  ArrowLeft, Save, Plus, Trash2, Loader2, Search, 
  Menu, Eye, Check, X, Award
} from 'lucide-react';

interface CatalogExercise {
  slug: string;
  name: string;
  muscle_group: string;
}

// Flat Exercise Structure
interface FlatExercise {
  id?: string;
  exercise_id: string; // catalog slug
  exercise_name: string;
  display_order: number;
  sets: number;
  reps: number | null;
  weight: number | null;
  rest_seconds: number | null;
  tempo: string | null;
  rpe: number | null;
  note: string | null;
}

// Day-based structures
interface DayItem {
  id: string; // temporary local UUID or db UUID
  name: string;
  day_order: number;
}

interface DayExercise {
  id?: string;
  day_id: string; // temp local or db UUID
  exercise_id: string; // catalog slug
  exercise_name: string;
  display_order: number;
  sets: number;
  reps: number | null;
  weight: number | null;
  rest_seconds: number | null;
  tempo: string | null;
  rpe: number | null;
  note: string | null;
}

export default function RoutineForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Catalog for exercise picker
  const [catalog, setCatalog] = useState<CatalogExercise[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showPickerForType, setShowPickerForType] = useState<boolean>(false); // Open exercise search popup

  // Metadata Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#00FF9D');
  const [category, setCategory] = useState('beginner');
  const [goal, setGoal] = useState('hypertrophy');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [estimatedCalories, setEstimatedCalories] = useState('');
  const [emoji, setEmoji] = useState('💪');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Program Type: 'flat' or 'multiday'
  const [programType, setProgramType] = useState<'flat' | 'multiday'>('flat');

  // Flat exercises list
  const [flatExercises, setFlatExercises] = useState<FlatExercise[]>([]);

  // Multiday days & exercises
  const [days, setDays] = useState<DayItem[]>([]);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [dayExercises, setDayExercises] = useState<DayExercise[]>([]);

  // Drag and Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<'day' | 'exercise' | null>(null);

  // Preview Modal
  const [showPreview, setShowPreview] = useState(false);

  // Toast HUD
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const toastIdRef = useRef(0);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toastId = toastIdRef.current++;
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4000);
  };

  useEffect(() => {
    fetchCatalog();
    if (isEditMode) {
      fetchRoutineDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('catalog_exercises')
        .select('slug, name, muscle_group')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setCatalog(data || []);
    } catch (err) {
      console.error('Failed to fetch catalog for builder:', err);
    }
  };

  const fetchRoutineDetails = async () => {
    try {
      setLoading(true);
      // 1. Fetch Metadata
      const { data: temp, error: tempError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (tempError) throw tempError;

      if (temp) {
        setName(temp.name);
        setSlug(temp.slug);
        setDescription(temp.description || '');
        setColor(temp.color || '#00FF9D');
        setCategory(temp.category || '');
        setGoal(temp.goal || 'hypertrophy');
        setDifficulty(temp.difficulty || 'intermediate');
        setEstimatedDuration(temp.estimated_duration ? temp.estimated_duration.toString() : '');
        setEstimatedCalories(temp.estimated_calories ? temp.estimated_calories.toString() : '');
        setEmoji(temp.emoji || '💪');
        setIsFeatured(!!temp.is_featured);
        setIsActive(!!temp.is_active);
        setIsPremium(!!temp.is_premium);

        // 2. Fetch Days
        const { data: daysData, error: daysError } = await supabase
          .from('routine_template_days')
          .select('*')
          .eq('template_id', id)
          .order('day_order', { ascending: true });

        if (daysError) throw daysError;

        if (daysData && daysData.length > 0) {
          setProgramType('multiday');
          setDays(daysData);
          setActiveDayId(daysData[0].id);

          // 3. Fetch Day Exercises
          const { data: dayExercisesData, error: dayExError } = await supabase
            .from('routine_template_day_exercises')
            .select('*')
            .eq('template_id', id)
            .order('display_order', { ascending: true });

          if (dayExError) throw dayExError;
          setDayExercises(dayExercisesData || []);
        } else {
          // Flat exercises
          setProgramType('flat');
          const { data: flatData, error: flatError } = await supabase
            .from('routine_template_exercises')
            .select('*')
            .eq('template_id', id)
            .order('display_order', { ascending: true });

          if (flatError) throw flatError;
          setFlatExercises(flatData || []);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch routine templates details');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditMode) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
      );
    }
  };

  // Add Exercise to currently selected day or flat routine
  const handleAddExerciseFromCatalog = (ex: CatalogExercise) => {
    if (programType === 'flat') {
      const newEx: FlatExercise = {
        exercise_id: ex.slug,
        exercise_name: ex.name,
        display_order: flatExercises.length,
        sets: 3,
        reps: 10,
        weight: null,
        rest_seconds: 60,
        tempo: null,
        rpe: null,
        note: '',
      };
      setFlatExercises([...flatExercises, newEx]);
    } else {
      if (!activeDayId) {
        showToast('Please create and select a day first', 'error');
        return;
      }
      const exercisesForCurrentDay = dayExercises.filter((e) => e.day_id === activeDayId);
      const newEx: DayExercise = {
        day_id: activeDayId,
        exercise_id: ex.slug,
        exercise_name: ex.name,
        display_order: exercisesForCurrentDay.length,
        sets: 3,
        reps: 10,
        weight: null,
        rest_seconds: 60,
        tempo: null,
        rpe: null,
        note: '',
      };
      setDayExercises([...dayExercises, newEx]);
    }
    showToast(`Added exercise: "${ex.name}"`);
    setShowPickerForType(false);
  };

  // Days Builder Operations
  const handleAddDay = () => {
    const tempId = `temp-day-${Date.now()}`;
    const newDay: DayItem = {
      id: tempId,
      name: `Day ${days.length + 1}`,
      day_order: days.length,
    };
    setDays([...days, newDay]);
    setActiveDayId(tempId);
  };

  const handleRemoveDay = (dayId: string) => {
    const updatedDays = days.filter((d) => d.id !== dayId);
    // Reorder day orders
    const reorderedDays = updatedDays.map((d, index) => ({ ...d, day_order: index }));
    setDays(reorderedDays);
    
    // Clear exercises for that day
    setDayExercises(dayExercises.filter((ex) => ex.day_id !== dayId));

    if (activeDayId === dayId) {
      setActiveDayId(reorderedDays.length > 0 ? reorderedDays[0].id : null);
    }
  };

  const handleRenameDay = (dayId: string, newName: string) => {
    setDays(days.map((d) => (d.id === dayId ? { ...d, name: newName } : d)));
  };

  // Exercise fields editing
  const handleUpdateFlatExercise = (index: number, key: keyof FlatExercise, value: any) => {
    setFlatExercises(
      flatExercises.map((ex, i) => (i === index ? { ...ex, [key]: value } : ex))
    );
  };

  const handleRemoveFlatExercise = (index: number) => {
    const filtered = flatExercises.filter((_, i) => i !== index);
    setFlatExercises(filtered.map((ex, idx) => ({ ...ex, display_order: idx })));
  };

  const handleUpdateDayExercise = (_idKey: string | undefined, index: number, key: keyof DayExercise, value: any) => {
    setDayExercises(
      dayExercises.map((ex) => {
        if (ex.day_id === activeDayId && ex.display_order === index) {
          return { ...ex, [key]: value };
        }
        return ex;
      })
    );
  };

  const handleRemoveDayExercise = (index: number) => {
    // Filter active day exercises

    // Remove exercise
    const filtered = dayExercises.filter((ex) => !(ex.day_id === activeDayId && ex.display_order === index));
    
    // Reorder remaining exercises for active day
    const updated = filtered.map((ex) => {
      if (ex.day_id === activeDayId && ex.display_order > index) {
        return { ...ex, display_order: ex.display_order - 1 };
      }
      return ex;
    });

    setDayExercises(updated);
  };

  // Drag & Drop Days
  const handleDayDragStart = (e: React.DragEvent, index: number) => {
    setDraggedType('day');
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDayDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedType !== 'day' || draggedItemIndex === null || draggedItemIndex === targetIndex) return;

    const reordered = [...days];
    const [removed] = reordered.splice(draggedItemIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update day orders
    const updated = reordered.map((d, idx) => ({ ...d, day_order: idx }));
    setDays(updated);
    setDraggedItemIndex(null);
    setDraggedType(null);
  };

  // Drag & Drop Exercises
  const handleExerciseDragStart = (e: React.DragEvent, index: number) => {
    setDraggedType('exercise');
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleExerciseDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedType !== 'exercise' || draggedItemIndex === null || draggedItemIndex === targetIndex) return;

    if (programType === 'flat') {
      const reordered = [...flatExercises];
      const [removed] = reordered.splice(draggedItemIndex, 1);
      reordered.splice(targetIndex, 0, removed);

      const updated = reordered.map((ex, idx) => ({ ...ex, display_order: idx }));
      setFlatExercises(updated);
    } else {
      if (!activeDayId) return;
      const activeExs = dayExercises.filter((e) => e.day_id === activeDayId);
      const [removed] = activeExs.splice(draggedItemIndex, 1);
      activeExs.splice(targetIndex, 0, removed);

      // Re-map display_order for active day exercises
      const updatedActiveExs = activeExs.map((ex, idx) => ({ ...ex, display_order: idx }));

      // Merge back into global day exercises list
      const otherExs = dayExercises.filter((e) => e.day_id !== activeDayId);
      setDayExercises([...otherExs, ...updatedActiveExs]);
    }
    setDraggedItemIndex(null);
    setDraggedType(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Submit form data
  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Routine name is required');
      return;
    }
    if (!slug.trim()) {
      setErrorMsg('Slug is required');
      return;
    }

    setErrorMsg(null);
    setSaving(true);

    const templateData = {
      slug: slug.trim().toLowerCase(),
      name: name.trim(),
      description: description.trim() || null,
      color: color,
      category: category.trim() || null,
      goal: goal,
      difficulty: difficulty,
      estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
      estimated_calories: estimatedCalories ? parseInt(estimatedCalories) : null,
      emoji: emoji.trim() || null,
      is_featured: isFeatured,
      is_active: isActive,
      is_premium: isPremium,
    };

    try {
      let templateId = id;

      // 1. Save or Update Routine Template
      if (isEditMode) {
        const { error } = await supabase
          .from('routine_templates')
          .update(templateData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('routine_templates')
          .insert([templateData])
          .select()
          .single();

        if (error) throw error;
        templateId = data.id;
      }

      if (!templateId) throw new Error('Missing Template ID after save');

      // 2. Clear out older exercises and days if in edit mode (we overwrite completely for safety)
      if (isEditMode) {
        await supabase.from('routine_template_exercises').delete().eq('template_id', templateId);
        await supabase.from('routine_template_days').delete().eq('template_id', templateId);
        // Cascading deletion on database automatically drops routine_template_day_exercises
      }

      // 3. Save new Exercises based on routine type
      if (programType === 'flat') {
        if (flatExercises.length > 0) {
          const insertData = flatExercises.map((ex, index) => ({
            template_id: templateId,
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            display_order: index,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            rest_seconds: ex.rest_seconds,
            tempo: ex.tempo || null,
            rpe: ex.rpe || null,
            note: ex.note || null,
          }));

          const { error } = await supabase.from('routine_template_exercises').insert(insertData);
          if (error) throw error;
        }
      } else {
        // Multi-day
        if (days.length > 0) {
          // Loop and insert days one by one or bulk to get their database IDs
          const dayIdMapping: Record<string, string> = {};

          for (const d of days) {
            const dayInsert = {
              template_id: templateId,
              name: d.name,
              day_order: d.day_order,
            };

            const { data: savedDay, error: dayError } = await supabase
              .from('routine_template_days')
              .insert([dayInsert])
              .select()
              .single();

            if (dayError) throw dayError;
            dayIdMapping[d.id] = savedDay.id;
          }

          // Insert all day exercises with mapped day IDs
          if (dayExercises.length > 0) {
            const insertData = dayExercises.map((ex) => ({
              day_id: dayIdMapping[ex.day_id] || ex.day_id, // map local temp day UUID to db UUID
              template_id: templateId,
              exercise_id: ex.exercise_id,
              exercise_name: ex.exercise_name,
              display_order: ex.display_order,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
              rest_seconds: ex.rest_seconds,
              tempo: ex.tempo || null,
              rpe: ex.rpe || null,
              note: ex.note || null,
            }));

            const { error: exercisesError } = await supabase
              .from('routine_template_day_exercises')
              .insert(insertData);

            if (exercisesError) throw exercisesError;
          }
        }
      }

      showToast('Routine template saved successfully!');
      setTimeout(() => navigate('/routines'), 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
      setSaving(false);
    }
  };

  const filteredCatalog = catalog.filter((ex) =>
    ex.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    ex.muscle_group.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const activeDayExercises = dayExercises
    .filter((ex) => ex.day_id === activeDayId)
    .sort((a, b) => a.display_order - b.display_order);

  const activeDayName = days.find((d) => d.id === activeDayId)?.name || 'Day';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'white' }}>
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'toast-danger' : ''}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div style={styles.topBar}>
        <Link to="/routines" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Templates
        </Link>
        <h1 style={{ fontSize: '1.75rem' }}>
          {isEditMode ? `Edit Template: ${name}` : 'Create Routine Template'}
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowPreview(true)} type="button">
            <Eye size={16} /> Preview Program
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} type="button">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span>Save Template</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="badge badge-danger" style={styles.errorAlert}>
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Form Left, Builder Right */}
      <div style={styles.grid}>
        {/* Left Side: Metadata Forms */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
          <h3 style={styles.sectionTitle}>Routine Metadata</h3>

          <div className="form-group">
            <label className="form-label">Program Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 3-Day Push Pull Legs"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Slug</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. push-pull-legs"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              disabled={saving}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Provide a description detailing target goals, structure..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-control-row">
            <div className="form-group">
              <label className="form-label">Emoji Icon</label>
              <input
                type="text"
                className="form-control"
                placeholder="💪"
                maxLength={2}
                value={emoji || ''}
                onChange={(e) => setEmoji(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Theme Color</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="color"
                  className="form-control"
                  style={{ width: '48px', padding: '0.25rem' }}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={saving}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ fontFamily: 'monospace' }}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="form-control-row">
            <div className="form-group">
              <label className="form-label">Goal</label>
              <select
                className="form-control"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={saving}
              >
                <option value="strength">Strength</option>
                <option value="hypertrophy">Hypertrophy</option>
                <option value="endurance">Endurance</option>
                <option value="fat_loss">Fat Loss</option>
                <option value="mobility">Mobility</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                className="form-control"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={saving}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-control-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Beginner, Strength, Hyper"
                value={category || ''}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Mins)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 60"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-control-row">
            <div className="form-group">
              <label className="form-label">Calories (Est.)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 400"
                value={estimatedCalories}
                onChange={(e) => setEstimatedCalories(e.target.value)}
                disabled={saving}
              />
            </div>

            <div style={styles.metadataFlags}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  disabled={saving}
                />
                <span className="text-gold" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Award size={14} /> Premium Lock
                </span>
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  disabled={saving}
                />
                <span>Featured Program</span>
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={saving}
                />
                <span>Published / Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side: Builder Area */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '60vh' }}>
          <div style={styles.builderToggleBar}>
            <h3 style={styles.sectionTitle}>Routine Layout</h3>
            <div style={styles.typeToggleGroup}>
              <button
                type="button"
                className={`btn btn-sm ${programType === 'flat' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setProgramType('flat')}
                disabled={isEditMode} // Prevent changing structure during edits to avoid db mismatches
              >
                Flat Workout
              </button>
              <button
                type="button"
                className={`btn btn-sm ${programType === 'multiday' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setProgramType('multiday');
                  if (days.length === 0) handleAddDay();
                }}
                disabled={isEditMode}
              >
                Multi-Day Program
              </button>
            </div>
          </div>

          {programType === 'flat' ? (
            /* Flat Workout Layout */
            <div style={styles.flatExercisesContainer}>
              <div style={styles.builderDayHeader}>
                <h4 style={{ fontSize: '1.125rem' }}>Exercises</h4>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPickerForType(true)}>
                  <Plus size={14} /> Add Exercise
                </button>
              </div>

              <div className="exercises-drag-list">
                {flatExercises.map((ex, index) => (
                  <div
                    key={index}
                    className="exercise-drag-card"
                    draggable
                    onDragStart={(e) => handleExerciseDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleExerciseDrop(e, index)}
                  >
                    <div className="exercise-drag-card-header">
                      <div className="exercise-drag-title">
                        <Menu size={16} style={{ color: 'var(--text-muted)', cursor: 'grab' }} />
                        <span>{ex.exercise_name}</span>
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>({ex.exercise_id})</span>
                      </div>
                      <button 
                        type="button" 
                        className="btn-text" 
                        onClick={() => handleRemoveFlatExercise(index)}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="exercise-drag-params">
                      <div className="param-input-col">
                        <span className="param-input-label">Sets</span>
                        <input
                          type="number"
                          className="param-input"
                          value={ex.sets}
                          onChange={(e) => handleUpdateFlatExercise(index, 'sets', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="param-input-col">
                        <span className="param-input-label">Reps</span>
                        <input
                          type="number"
                          className="param-input"
                          value={ex.reps || ''}
                          placeholder="None"
                          onChange={(e) => handleUpdateFlatExercise(index, 'reps', parseInt(e.target.value) || null)}
                        />
                      </div>
                      <div className="param-input-col">
                        <span className="param-input-label">Weight (kg)</span>
                        <input
                          type="number"
                          step="0.5"
                          className="param-input"
                          value={ex.weight || ''}
                          placeholder="None"
                          onChange={(e) => handleUpdateFlatExercise(index, 'weight', parseFloat(e.target.value) || null)}
                        />
                      </div>
                      <div className="param-input-col">
                        <span className="param-input-label">Rest (s)</span>
                        <input
                          type="number"
                          className="param-input"
                          value={ex.rest_seconds || ''}
                          placeholder="None"
                          onChange={(e) => handleUpdateFlatExercise(index, 'rest_seconds', parseInt(e.target.value) || null)}
                        />
                      </div>
                      <div className="param-input-col">
                        <span className="param-input-label">Tempo</span>
                        <input
                          type="text"
                          className="param-input"
                          value={ex.tempo || ''}
                          placeholder="e.g. 3010"
                          onChange={(e) => handleUpdateFlatExercise(index, 'tempo', e.target.value || null)}
                        />
                      </div>
                      <div className="param-input-col">
                        <span className="param-input-label">RPE (1-10)</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className="param-input"
                          value={ex.rpe || ''}
                          placeholder="None"
                          onChange={(e) => handleUpdateFlatExercise(index, 'rpe', parseInt(e.target.value) || null)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <span className="param-input-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Exercise Notes</span>
                      <input
                        type="text"
                        className="form-control"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                        placeholder="Add training cues or secondary target notes..."
                        value={ex.note || ''}
                        onChange={(e) => handleUpdateFlatExercise(index, 'note', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                {flatExercises.length === 0 && (
                  <div className="empty-state">
                    <Check size={32} />
                    <h4>Add exercise catalog items</h4>
                    <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      Click "Add Exercise" to fill this routine template with catalog movements.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Multi-Day Program Layout */
            <div className="routine-builder">
              {/* Left Column: Days Navigation & Reordering */}
              <div>
                <div style={styles.daysListHeader}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Training Days</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddDay} style={{ padding: '0.25rem 0.5rem' }}>
                    <Plus size={12} /> Add Day
                  </button>
                </div>

                <div className="builder-days-list">
                  {days.map((d, index) => (
                    <div
                      key={d.id}
                      className={`day-item ${activeDayId === d.id ? 'active' : ''}`}
                      onClick={() => setActiveDayId(d.id)}
                      draggable
                      onDragStart={(e) => handleDayDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDayDrop(e, index)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <Menu size={12} style={{ color: 'var(--text-muted)', cursor: 'grab' }} />
                        <input
                          type="text"
                          value={d.name}
                          onChange={(e) => handleRenameDay(d.id, e.target.value)}
                          style={styles.dayNameInput}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {days.length > 1 && (
                        <button
                          type="button"
                          className="btn-text"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDay(d.id);
                          }}
                          style={{ color: 'var(--danger)', padding: '0.25rem' }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Exercises programmed for active day */}
              <div className="builder-exercises-section">
                <div className="builder-day-header">
                  <h4 style={{ fontSize: '1.125rem' }}>{activeDayName} Movements</h4>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowPickerForType(true)}
                    disabled={!activeDayId}
                  >
                    <Plus size={14} /> Add Exercise
                  </button>
                </div>

                <div className="exercises-drag-list">
                  {activeDayExercises.map((ex, index) => (
                    <div
                      key={index}
                      className="exercise-drag-card"
                      draggable
                      onDragStart={(e) => handleExerciseDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleExerciseDrop(e, index)}
                    >
                      <div className="exercise-drag-card-header">
                        <div className="exercise-drag-title">
                          <Menu size={16} style={{ color: 'var(--text-muted)', cursor: 'grab' }} />
                          <span>{ex.exercise_name}</span>
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>({ex.exercise_id})</span>
                        </div>
                        <button 
                          type="button" 
                          className="btn-text" 
                          onClick={() => handleRemoveDayExercise(index)}
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="exercise-drag-params">
                        <div className="param-input-col">
                          <span className="param-input-label">Sets</span>
                          <input
                            type="number"
                            className="param-input"
                            value={ex.sets}
                            onChange={(e) => handleUpdateDayExercise(ex.id, index, 'sets', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="param-input-col">
                          <span className="param-input-label">Reps</span>
                          <input
                            type="number"
                            className="param-input"
                            value={ex.reps || ''}
                            placeholder="None"
                            onChange={(e) => handleUpdateDayExercise(ex.id, index, 'reps', parseInt(e.target.value) || null)}
                          />
                        </div>
                        <div className="param-input-col">
                          <span className="param-input-label">Weight (kg)</span>
                          <input
                            type="number"
                            step="0.5"
                            className="param-input"
                            value={ex.weight || ''}
                            placeholder="None"
                            onChange={(e) => handleUpdateDayExercise(ex.id, index, 'weight', parseFloat(e.target.value) || null)}
                          />
                        </div>
                        <div className="param-input-col">
                          <span className="param-input-label">Rest (s)</span>
                          <input
                            type="number"
                            className="param-input"
                            value={ex.rest_seconds || ''}
                            placeholder="None"
                            onChange={(e) => handleUpdateDayExercise(ex.id, index, 'rest_seconds', parseInt(e.target.value) || null)}
                          />
                        </div>
                        <div className="param-input-col">
                          <span className="param-input-label">Tempo</span>
                          <input
                            type="text"
                            className="param-input"
                            value={ex.tempo || ''}
                            placeholder="e.g. 2011"
                            onChange={(e) => handleUpdateDayExercise(ex.id, index, 'tempo', e.target.value || null)}
                          />
                        </div>
                        <div className="param-input-col">
                          <span className="param-input-label">RPE (1-10)</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            className="param-input"
                            value={ex.rpe || ''}
                            placeholder="None"
                            onChange={(e) => handleUpdateDayExercise(ex.id, index, 'rpe', parseInt(e.target.value) || null)}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <span className="param-input-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Exercise Notes</span>
                        <input
                          type="text"
                          className="form-control"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                          placeholder="Add day-specific cues..."
                          value={ex.note || ''}
                          onChange={(e) => handleUpdateDayExercise(ex.id, index, 'note', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}

                  {activeDayExercises.length === 0 && (
                    <div className="empty-state">
                      <Check size={32} />
                      <h4>Empty Day Program</h4>
                      <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                        Click "Add Exercise" to assign exercises to {activeDayName}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Catalog Exercise Picker Modal */}
      {showPickerForType && (
        <div className="modal-overlay" onClick={() => setShowPickerForType(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Select Catalog Exercise</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPickerForType(false)}>
                Close
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh' }}>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon-pos" />
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search by name or muscle group..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={styles.catalogListScroll}>
                {filteredCatalog.map((ex) => (
                  <button
                    key={ex.slug}
                    type="button"
                    style={styles.catalogItemRow}
                    onClick={() => handleAddExerciseFromCatalog(ex)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{ex.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {ex.slug}
                      </span>
                    </div>
                    <span className="badge badge-secondary" style={{ fontSize: '0.675rem', textTransform: 'capitalize' }}>
                      {ex.muscle_group.replace('_', ' ')}
                    </span>
                  </button>
                ))}
                {filteredCatalog.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No active catalog exercises found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal before publishing */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: color }}>
                <span>{emoji || '💪'}</span>
                <span>{name || 'New Routine Template'}</span>
                {isPremium && <span className="badge badge-gold" style={{ fontSize: '0.675rem' }}>Premium</span>}
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPreview(false)}>
                Close Preview
              </button>
            </div>
            <div className="modal-body">
              <div style={styles.previewMetaGrid}>
                <div>
                  <span style={styles.metaLabel}>Goal</span>
                  <span style={styles.metaValue}>{goal}</span>
                </div>
                <div>
                  <span style={styles.metaLabel}>Difficulty</span>
                  <span style={styles.metaValue}>{difficulty}</span>
                </div>
                <div>
                  <span style={styles.metaLabel}>Duration</span>
                  <span style={styles.metaValue}>{estimatedDuration ? `${estimatedDuration} mins` : 'N/A'}</span>
                </div>
                <div>
                  <span style={styles.metaLabel}>Calories</span>
                  <span style={styles.metaValue}>{estimatedCalories ? `${estimatedCalories} kcal` : 'N/A'}</span>
                </div>
              </div>

              {description && (
                <p style={styles.previewDesc}>{description}</p>
              )}

              {programType === 'flat' ? (
                /* Flat Preview list */
                <div>
                  <h3 style={styles.previewSectionTitle}>Exercises</h3>
                  <div style={styles.previewExercisesList}>
                    {flatExercises.map((ex, index) => (
                      <div key={index} style={styles.previewExerciseRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={styles.previewIndex}>{index + 1}</span>
                          <span style={{ fontWeight: '600' }}>{ex.exercise_name}</span>
                          <span className="badge badge-secondary" style={{ fontSize: '0.675rem' }}>{ex.sets} Sets</span>
                        </div>
                        <div style={styles.previewParams}>
                          {ex.reps && <span>{ex.reps} Reps</span>}
                          {ex.weight && <span>{ex.weight} kg</span>}
                          {ex.rest_seconds && <span>{ex.rest_seconds}s Rest</span>}
                          {ex.tempo && <span>Tempo: {ex.tempo}</span>}
                          {ex.rpe && <span>RPE {ex.rpe}</span>}
                        </div>
                        {ex.note && <p style={styles.previewNote}>Note: {ex.note}</p>}
                      </div>
                    ))}
                    {flatExercises.length === 0 && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No exercises added yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Multi-Day Preview list */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {days.map((day) => {
                    const dayExs = dayExercises
                      .filter((ex) => ex.day_id === day.id)
                      .sort((a, b) => a.display_order - b.display_order);

                    return (
                      <div key={day.id} style={styles.previewDaySection}>
                        <h4 style={styles.previewDayTitle}>{day.name}</h4>
                        <div style={styles.previewExercisesList}>
                          {dayExs.map((ex, index) => (
                            <div key={index} style={styles.previewExerciseRow}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={styles.previewIndex}>{index + 1}</span>
                                <span style={{ fontWeight: '600' }}>{ex.exercise_name}</span>
                                <span className="badge badge-secondary" style={{ fontSize: '0.675rem' }}>{ex.sets} Sets</span>
                              </div>
                              <div style={styles.previewParams}>
                                {ex.reps && <span>{ex.reps} Reps</span>}
                                {ex.weight && <span>{ex.weight} kg</span>}
                                {ex.rest_seconds && <span>{ex.rest_seconds}s Rest</span>}
                                {ex.tempo && <span>Tempo: {ex.tempo}</span>}
                                {ex.rpe && <span>RPE {ex.rpe}</span>}
                              </div>
                              {ex.note && <p style={styles.previewNote}>Note: {ex.note}</p>}
                            </div>
                          ))}
                          {dayExs.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', paddingLeft: '1rem' }}>
                              No exercises programmed for this day.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setShowPreview(false)}>
                Resume Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    textTransform: 'uppercase' as const,
    color: 'var(--accent)',
    letterSpacing: '0.05em',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.3fr',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  metadataFlags: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    justifyContent: 'center',
    paddingLeft: '0.5rem',
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  builderToggleBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '1rem',
  },
  typeToggleGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  flatExercisesContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  builderDayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  dayNameInput: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    outline: 'none',
    flex: 1,
  },
  catalogListScroll: {
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    maxHeight: '40vh',
  },
  catalogItemRow: {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
    transition: 'all 0.2s',
  },
  errorAlert: {
    width: '100%',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    display: 'block',
    whiteSpace: 'normal' as const,
    lineHeight: '1.4',
  },
  previewMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '1rem',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    marginBottom: '1.5rem',
  },
  metaLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    marginBottom: '0.25rem',
  },
  metaValue: {
    fontWeight: '600',
    fontSize: '0.875rem',
    textTransform: 'capitalize' as const,
  },
  previewDesc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
  },
  previewSectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '1rem',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0.5rem',
  },
  previewExercisesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  previewExerciseRow: {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
  },
  previewIndex: {
    fontSize: '0.8125rem',
    color: 'var(--text-muted)',
    fontWeight: '700',
  },
  previewParams: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  previewNote: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed var(--border)',
  },
  previewDaySection: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1rem',
  },
  previewDayTitle: {
    fontSize: '1rem',
    color: 'var(--accent)',
    marginBottom: '0.75rem',
    fontWeight: '600',
  },
};
