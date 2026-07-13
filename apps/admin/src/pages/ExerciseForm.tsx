import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { ArrowLeft, Save, Plus, Trash2, Loader2, Upload, ExternalLink } from 'lucide-react';

// Upload limits (bytes)
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;   // 8 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;  // 50 MB
const STORAGE_BUCKET = 'exercise-media';

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'arms',
  'legs', 'core', 'glutes', 'cardio', 'full_body'
];

const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'machine', 'cable',
  'bodyweight', 'kettlebell', 'resistance_band', 'smith_machine', 'other'
];

export default function ExerciseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('chest');
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [equipment, setEquipment] = useState('dumbbell');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [type, setType] = useState('strength');
  const [caloriesPerMinute, setCaloriesPerMinute] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [tips, setTips] = useState<string[]>([]);

  // Media upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Toast notifications
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
    if (isEditMode) {
      fetchExerciseDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchExerciseDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('catalog_exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name || '');
        setSlug(data.slug || '');
        setDescription(data.description || '');
        setMuscleGroup(data.muscle_group || 'chest');
        setSecondaryMuscles(data.secondary_muscles || []);
        setEquipment(data.equipment || 'dumbbell');
        setDifficulty(data.difficulty || 'intermediate');
        setType(data.type || 'strength');
        setCaloriesPerMinute(data.calories_per_minute ? data.calories_per_minute.toString() : '');
        setIsPopular(!!data.is_popular);
        setIsActive(!!data.is_active);
        setImageUrl(data.image_url || '');
        setVideoUrl(data.video_url || '');
        setInstructions(data.instructions?.length > 0 ? data.instructions : ['']);
        setTips(data.tips || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load exercise details');
    } finally {
      setLoading(false);
    }
  };

  // Generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditMode) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric/spaces/hyphens
        .replace(/\s+/g, '-'); // replace spaces with hyphens
      setSlug(generatedSlug);
    }
  };

  const handleSecondaryMuscleToggle = (muscle: string) => {
    setSecondaryMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  // Instructions CRUD
  const handleInstructionChange = (index: number, val: string) => {
    const updated = [...instructions];
    updated[index] = val;
    setInstructions(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index);
    setInstructions(updated.length === 0 ? [''] : updated);
  };

  // Tips CRUD
  const handleTipChange = (index: number, val: string) => {
    const updated = [...tips];
    updated[index] = val;
    setTips(updated);
  };

  const addTip = () => {
    setTips([...tips, '']);
  };

  const removeTip = (index: number) => {
    const updated = tips.filter((_, i) => i !== index);
    setTips(updated);
  };

  // Upload an image/video file to Supabase Storage and fill the URL field.
  // Path must start with the signed-in user's id to satisfy the storage RLS policy.
  const uploadMedia = async (file: File, kind: 'image' | 'video') => {
    const setBusy = kind === 'image' ? setUploadingImage : setUploadingVideo;
    try {
      // Client-side validation
      const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
      if (file.size > maxBytes) {
        throw new Error(`File too large (max ${kind === 'image' ? '8' : '50'} MB).`);
      }
      if (kind === 'video' && !/^video\//.test(file.type)) {
        throw new Error('Please choose a video file (MP4 / H.264 recommended).');
      }
      if (kind === 'image' && !/^image\//.test(file.type)) {
        throw new Error('Please choose an image file.');
      }
      if (kind === 'video' && file.type !== 'video/mp4') {
        showToast('Tip: MP4 (H.264) plays most reliably on iOS/Android.', 'success');
      }

      setBusy(true);

      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error('Session expired — please sign in again.');

      const ext = (file.name.split('.').pop() || (kind === 'video' ? 'mp4' : 'jpg')).toLowerCase();
      const safeSlug = (slug || name || 'exercise')
        .trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'exercise';
      const path = `${uid}/catalog/${safeSlug}/${kind}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const url = pub.publicUrl;
      if (kind === 'image') setImageUrl(url);
      else setVideoUrl(url);

      showToast(`${kind === 'image' ? 'Image' : 'Video'} uploaded — remember to Save.`);
    } catch (err: any) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    // Clean lists
    const cleanInstructions = instructions.map((i) => i.trim()).filter((i) => i !== '');
    const cleanTips = tips.map((t) => t.trim()).filter((t) => t !== '');

    const exerciseData = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim() || null,
      muscle_group: muscleGroup,
      secondary_muscles: secondaryMuscles,
      equipment: equipment,
      difficulty: difficulty,
      type: type,
      calories_per_minute: caloriesPerMinute ? parseFloat(caloriesPerMinute) : null,
      is_popular: isPopular,
      is_active: isActive,
      instructions: cleanInstructions,
      tips: cleanTips,
      image_url: imageUrl.trim() || null,
      video_url: videoUrl.trim() || null,
    };

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('catalog_exercises')
          .update(exerciseData)
          .eq('id', id);

        if (error) throw error;
        showToast('Exercise updated successfully!');
      } else {
        const { error } = await supabase
          .from('catalog_exercises')
          .insert([exerciseData]);

        if (error) throw error;
        showToast('Exercise created successfully!');
      }
      setTimeout(() => navigate('/exercises'), 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
      setSaving(false);
    }
  };

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
        <Link to="/exercises" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Catalog
        </Link>
        <h1 style={{ fontSize: '1.75rem' }}>
          {isEditMode ? `Edit Exercise: ${name}` : 'Create New Exercise'}
        </h1>
      </div>

      {errorMsg && (
        <div className="badge badge-danger" style={styles.errorAlert}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ gap: '2rem', display: 'flex', flexDirection: 'column' }}>
        <div style={styles.sectionRow}>
          {/* Column 1: Core Fields */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={styles.sectionTitle}>Basic Info</h3>

            <div className="form-group">
              <label className="form-label">Exercise Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Incline Bench Press"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug (URL identifier)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. incline-bench-press"
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
                rows={4}
                placeholder="Brief summary of how the exercise works..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-control-row">
              <div className="form-group">
                <label className="form-label">Primary Muscle</label>
                <select
                  className="form-control"
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value)}
                  disabled={saving}
                >
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Equipment</label>
                <select
                  className="form-control"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  disabled={saving}
                >
                  {EQUIPMENT_TYPES.map((eq) => (
                    <option key={eq} value={eq}>{eq.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-control-row">
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

              <div className="form-group">
                <label className="form-label">Exercise Type</label>
                <select
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={saving}
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="flexibility">Flexibility</option>
                </select>
              </div>
            </div>

            <div className="form-control-row">
              <div className="form-group">
                <label className="form-label">Calories/Min (Est.)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  placeholder="e.g. 6.5"
                  value={caloriesPerMinute}
                  onChange={(e) => setCaloriesPerMinute(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    disabled={saving}
                  />
                  <span>Popular Flag</span>
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

          {/* Column 2: Secondary Muscles, Media & Lists */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={styles.sectionTitle}>Secondary Muscles</h3>
            <div style={styles.musclesSelection}>
              {MUSCLE_GROUPS.map((m) => (
                <label 
                  key={m} 
                  style={{
                    ...styles.muscleTag,
                    ...(secondaryMuscles.includes(m) ? styles.muscleTagActive : {})
                  }}
                >
                  <input
                    type="checkbox"
                    checked={secondaryMuscles.includes(m)}
                    onChange={() => handleSecondaryMuscleToggle(m)}
                    style={{ display: 'none' }}
                    disabled={saving}
                  />
                  {m.replace('_', ' ')}
                </label>
              ))}
            </div>

            <h3 style={{ ...styles.sectionTitle, marginTop: '1rem' }}>Media Assets</h3>

            {/* Image */}
            <div className="form-group">
              <label className="form-label">Image (upload or paste URL)</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://…  or upload a file below"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={saving || uploadingImage}
              />
              <div style={styles.mediaRow}>
                <label className="btn btn-secondary btn-sm" style={styles.uploadBtn}>
                  {uploadingImage ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                  <span>{uploadingImage ? 'Uploading…' : 'Upload image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={saving || uploadingImage}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadMedia(f, 'image');
                      e.target.value = '';
                    }}
                  />
                </label>
                {imageUrl && (
                  <a href={imageUrl} target="_blank" rel="noreferrer" style={styles.previewLink}>
                    <ExternalLink size={12} /> open
                  </a>
                )}
              </div>
              {imageUrl && (
                <img src={imageUrl} alt="preview" style={styles.imgPreview}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              )}
            </div>

            {/* Video */}
            <div className="form-group">
              <label className="form-label">Video Demonstration (upload or paste URL)</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://…  MP4 (H.264) recommended"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={saving || uploadingVideo}
              />
              <div style={styles.mediaRow}>
                <label className="btn btn-secondary btn-sm" style={styles.uploadBtn}>
                  {uploadingVideo ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                  <span>{uploadingVideo ? 'Uploading…' : 'Upload video'}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/*"
                    style={{ display: 'none' }}
                    disabled={saving || uploadingVideo}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadMedia(f, 'video');
                      e.target.value = '';
                    }}
                  />
                </label>
                {videoUrl && (
                  <a href={videoUrl} target="_blank" rel="noreferrer" style={styles.previewLink}>
                    <ExternalLink size={12} /> open
                  </a>
                )}
              </div>
              {videoUrl && (
                <video src={videoUrl} controls muted style={styles.videoPreview} />
              )}
              <p style={styles.mediaHint}>
                Uploads go to Supabase Storage. Google Drive links are not supported by the app.
              </p>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        {/* Dynamic Lists Section (Instructions & Tips) */}
        <div style={styles.listsGrid}>
          {/* Instructions */}
          <div style={{ flex: 1 }}>
            <div style={styles.listHeader}>
              <h3 style={styles.sectionTitle}>Step-by-Step Instructions</h3>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={addInstruction}
                disabled={saving}
              >
                <Plus size={14} /> Add Step
              </button>
            </div>
            
            <div style={styles.dynamicList}>
              {instructions.map((inst, index) => (
                <div key={index} style={styles.listItemRow}>
                  <span style={styles.listItemNumber}>{index + 1}</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Step ${index + 1} details...`}
                    value={inst}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    required
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.625rem' }}
                    onClick={() => removeInstruction(index)}
                    disabled={saving}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ flex: 1 }}>
            <div style={styles.listHeader}>
              <h3 style={styles.sectionTitle}>Coach Pro Tips</h3>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={addTip}
                disabled={saving}
              >
                <Plus size={14} /> Add Tip
              </button>
            </div>
            
            <div style={styles.dynamicList}>
              {tips.map((tip, index) => (
                <div key={index} style={styles.listItemRow}>
                  <span style={styles.listItemNumber}>•</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Keep your core engaged and pull your shoulders back..."
                    value={tip}
                    onChange={(e) => handleTipChange(index, e.target.value)}
                    required
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.625rem' }}
                    onClick={() => removeTip(index)}
                    disabled={saving}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {tips.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
                  No pro tips added yet. Click "Add Tip" to supply training guidance.
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.formActions}>
          <Link to="/exercises" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{isEditMode ? 'Update Catalog' : 'Create Exercise'}</span>
              </>
            )}
          </button>
        </div>
      </form>
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
  sectionRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '2.5rem',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    justifyContent: 'center',
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  musclesSelection: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  mediaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  uploadBtn: {
    cursor: 'pointer',
    margin: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  previewLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: 'var(--accent)',
    textDecoration: 'none',
  },
  imgPreview: {
    marginTop: '0.625rem',
    width: '160px',
    height: '96px',
    objectFit: 'cover' as const,
    borderRadius: '6px',
    border: '1px solid var(--border)',
    display: 'block',
  },
  videoPreview: {
    marginTop: '0.625rem',
    width: '220px',
    maxHeight: '150px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    backgroundColor: '#000',
    display: 'block',
  },
  mediaHint: {
    marginTop: '0.4rem',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  muscleTag: {
    display: 'inline-block',
    padding: '0.375rem 0.75rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    fontSize: '0.8125rem',
    textTransform: 'capitalize' as const,
    cursor: 'pointer',
    backgroundColor: 'var(--bg-tertiary)',
    transition: 'all 0.2s',
  },
  muscleTagActive: {
    borderColor: 'var(--accent)',
    backgroundColor: 'rgba(0, 255, 157, 0.08)',
    color: 'var(--accent)',
  },
  listsGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '2.5rem',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  dynamicList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  listItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  listItemNumber: {
    width: '24px',
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontWeight: '600',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1.25rem',
    borderTop: '1px solid var(--border)',
    paddingTop: '1.5rem',
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
};
