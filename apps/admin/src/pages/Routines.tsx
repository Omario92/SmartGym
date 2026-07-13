import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  FileText, Search, Plus, Archive, Edit, 
  Trash2, Download, Upload, Loader2, Eye, CheckCircle 
} from 'lucide-react';

interface RoutineTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string;
  category: string | null;
  goal: string | null;
  difficulty: string | null;
  estimated_duration: number | null;
  estimated_calories: number | null;
  emoji: string | null;
  is_featured: boolean;
  is_active: boolean;
  is_premium: boolean;
}

interface TemplateExercise {
  id: string;
  exercise_id: string;
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

export default function Routines() {
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [goalFilter, setGoalFilter] = useState('');
  const [premiumFilter, setPremiumFilter] = useState('all'); // 'all', 'premium', 'free'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Preview Modal state
  const [previewTemplate, setPreviewTemplate] = useState<RoutineTemplate | null>(null);
  const [previewExercises, setPreviewExercises] = useState<TemplateExercise[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const toastIdRef = useRef(0);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Fetch all public routine templates including inactive ones since we are admin
      const { data, error } = await supabase
        .from('routine_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template: RoutineTemplate) => {
    try {
      const nextActive = !template.is_active;
      const { error } = await supabase
        .from('routine_templates')
        .update({ is_active: nextActive })
        .eq('id', template.id);

      if (error) throw error;

      setTemplates((prev) =>
        prev.map((temp) => (temp.id === template.id ? { ...temp, is_active: nextActive } : temp))
      );
      showToast(`"${template.name}" ${nextActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update routine status', 'error');
    }
  };

  const handleDelete = async (template: RoutineTemplate) => {
    if (!window.confirm(`Are you sure you want to permanently delete routine template "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('routine_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      showToast(`Deleted template "${template.name}"`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete template', 'error');
    }
  };

  const handlePreview = async (template: RoutineTemplate) => {
    setPreviewTemplate(template);
    setLoadingPreview(true);
    try {
      // Fetch exercises for this template
      const { data, error } = await supabase
        .from('routine_template_exercises')
        .select('*')
        .eq('template_id', template.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPreviewExercises(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load preview details', 'error');
      setPreviewTemplate(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // CSV/JSON Export
  const handleExport = async (format: 'json' | 'csv') => {
    const dataToExport = filteredTemplates;
    if (dataToExport.length === 0) {
      showToast('No templates to export', 'error');
      return;
    }

    try {
      setLoading(true);
      // Fetch all exercises for these templates
      const { data: allExercises, error } = await supabase
        .from('routine_template_exercises')
        .select('*')
        .in('template_id', dataToExport.map(t => t.id));

      if (error) throw error;

      // Group exercises by template ID
      const templatesWithExercises = dataToExport.map((t) => {
        const exercises = (allExercises || [])
          .filter((ex) => ex.template_id === t.id)
          .sort((a, b) => a.display_order - b.display_order);
        return {
          ...t,
          exercises: exercises.map((ex) => ({
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            display_order: ex.display_order,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            rest_seconds: ex.rest_seconds,
            tempo: ex.tempo,
            rpe: ex.rpe,
            note: ex.note
          }))
        };
      });

      let fileContent = '';
      let mimeType = '';
      let fileName = `smartgym-routines-${Date.now()}`;

      if (format === 'json') {
        fileContent = JSON.stringify(templatesWithExercises, null, 2);
        mimeType = 'application/json';
        fileName += '.json';
      } else {
        // CSV: export templates and exercises as flat join rows
        const headers = [
          'template_slug', 'template_name', 'description', 'color', 'category', 'goal', 
          'difficulty', 'estimated_duration', 'estimated_calories', 'emoji', 'is_featured', 
          'is_active', 'is_premium', 'exercise_id', 'exercise_name', 'display_order', 
          'sets', 'reps', 'weight', 'rest_seconds', 'tempo', 'rpe', 'note'
        ];
        
        const csvRows = [headers.join(',')];
        
        templatesWithExercises.forEach((t) => {
          if (t.exercises.length === 0) {
            // Template with no exercises
            const values = headers.map(h => {
              if (h.startsWith('template_')) {
                const fieldName = h.replace('template_', '');
                return `"${((t as any)[fieldName] || '').toString().replace(/"/g, '""')}"`;
              }
              const val = (t as any)[h];
              if (val === null || val === undefined) return '';
              return `"${val.toString().replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
          } else {
            t.exercises.forEach((ex) => {
              const values = headers.map((h) => {
                if (h === 'template_slug') return `"${t.slug.replace(/"/g, '""')}"`;
                if (h === 'template_name') return `"${t.name.replace(/"/g, '""')}"`;
                if (h in t) {
                  const val = (t as any)[h];
                  if (val === null || val === undefined) return '';
                  return `"${val.toString().replace(/"/g, '""')}"`;
                }
                if (h in ex) {
                  const val = (ex as any)[h];
                  if (val === null || val === undefined) return '';
                  return `"${val.toString().replace(/"/g, '""')}"`;
                }
                return '';
              });
              csvRows.push(values.join(','));
            });
          }
        });
        
        fileContent = csvRows.join('\n');
        mimeType = 'text/csv';
        fileName += '.csv';
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Exported ${dataToExport.length} routines successfully`);
    } catch (err: any) {
      showToast(err.message || 'Failed to export templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  // CSV/JSON Import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let templatesToImport: any[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          templatesToImport = Array.isArray(parsed) ? parsed : [parsed];
        } else if (file.name.endsWith('.csv')) {
          // Flattened CSV Parser
          const lines = text.split('\n').filter(l => l.trim() !== '');
          if (lines.length < 2) throw new Error('CSV must have a header row.');
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          
          // Group rows by template slug
          const tempMap = new Map<string, any>();
          
          lines.slice(1).forEach((line) => {
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
            const values = matches.map(v => v.replace(/^"|"$/g, '').trim());
            const row: any = {};
            headers.forEach((header, idx) => {
              row[header] = values[idx] || '';
            });

            const slug = row.template_slug || row.slug;
            if (!slug) return;

            if (!tempMap.has(slug)) {
              tempMap.set(slug, {
                slug,
                name: row.template_name || row.name || 'Imported Template',
                description: row.description || null,
                color: row.color || '#00FF9D',
                category: row.category || null,
                goal: row.goal || null,
                difficulty: row.difficulty || null,
                estimated_duration: row.estimated_duration ? parseInt(row.estimated_duration) : null,
                estimated_calories: row.estimated_calories ? parseInt(row.estimated_calories) : null,
                emoji: row.emoji || null,
                is_featured: row.is_featured === 'true',
                is_active: row.is_active !== 'false',
                is_premium: row.is_premium === 'true',
                exercises: []
              });
            }

            if (row.exercise_id) {
              tempMap.get(slug).exercises.push({
                exercise_id: row.exercise_id,
                exercise_name: row.exercise_name || 'Exercise',
                display_order: parseInt(row.display_order || '0'),
                sets: parseInt(row.sets || '3'),
                reps: row.reps ? parseInt(row.reps) : null,
                weight: row.weight ? parseFloat(row.weight) : null,
                rest_seconds: row.rest_seconds ? parseInt(row.rest_seconds) : null,
                tempo: row.tempo || null,
                rpe: row.rpe ? parseInt(row.rpe) : null,
                note: row.note || null
              });
            }
          });
          
          templatesToImport = Array.from(tempMap.values());
        }

        // Apply insertions
        let successCount = 0;
        for (const temp of templatesToImport) {
          const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
          const templateData = {
            slug: temp.slug ? temp.slug.toLowerCase().replace(/[^a-z0-9-]/g, '') : `imported-routine-${uniqueSuffix}`,
            name: temp.name || 'Imported Routine',
            description: temp.description || null,
            color: temp.color || '#00FF9D',
            category: temp.category || null,
            goal: temp.goal || null,
            difficulty: temp.difficulty || null,
            estimated_duration: temp.estimated_duration || null,
            estimated_calories: temp.estimated_calories || null,
            emoji: temp.emoji || null,
            is_featured: !!temp.is_featured,
            is_active: temp.is_active !== undefined ? !!temp.is_active : true,
            is_premium: !!temp.is_premium,
          };

          // Save Template Metadata
          const { data: savedTemp, error: tempError } = await supabase
            .from('routine_templates')
            .insert([templateData])
            .select()
            .single();

          if (tempError) {
            console.error('Error importing template metadata:', tempError);
            continue;
          }

          if (savedTemp && temp.exercises?.length > 0) {
            // Save Exercises
            const exercisesData = temp.exercises.map((ex: any, idx: number) => ({
              template_id: savedTemp.id,
              exercise_id: ex.exercise_id,
              exercise_name: ex.exercise_name || 'Exercise',
              display_order: ex.display_order !== undefined ? ex.display_order : idx,
              sets: ex.sets || 3,
              reps: ex.reps || null,
              weight: ex.weight || null,
              rest_seconds: ex.rest_seconds || null,
              tempo: ex.tempo || null,
              rpe: ex.rpe || null,
              note: ex.note || null
            }));

            const { error: exercisesError } = await supabase
              .from('routine_template_exercises')
              .insert(exercisesData);

            if (exercisesError) {
              console.error('Error importing template exercises:', exercisesError);
            }
          }
          successCount++;
        }

        showToast(`Imported ${successCount} routine templates successfully`);
        fetchTemplates();
      } catch (err: any) {
        showToast(err.message || 'Failed to parse file or insert data', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = 
      t.name.toLowerCase().includes(search.toLowerCase()) || 
      t.slug.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter ? t.category === categoryFilter : true;
    const matchesGoal = goalFilter ? t.goal === goalFilter : true;
    
    let matchesPremium = true;
    if (premiumFilter === 'premium') matchesPremium = t.is_premium;
    else if (premiumFilter === 'free') matchesPremium = !t.is_premium;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = t.is_active;
    else if (statusFilter === 'inactive') matchesStatus = !t.is_active;

    return matchesSearch && matchesCategory && matchesGoal && matchesPremium && matchesStatus;
  });

  // Extract unique categories for filter dropdown
  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean))) as string[];

  return (
    <div>
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'toast-danger' : ''}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div style={styles.header}>
        <h1 style={{ fontSize: '2rem' }}>Routine Templates</h1>
        <div style={styles.headerActions}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,.csv"
            style={{ display: 'none' }}
          />
          <button className="btn btn-secondary" onClick={handleImportClick}>
            <Upload size={16} /> Import
          </button>
          <div style={styles.exportGroup}>
            <button className="btn btn-secondary" onClick={() => handleExport('json')}>
              <Download size={16} /> Export JSON
            </button>
            <button className="btn btn-secondary" onClick={() => handleExport('csv')}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          <Link to="/routines/new" className="btn btn-primary">
            <Plus size={16} /> Add Template
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon-pos" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search templates by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '180px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: '160px' }}
          value={goalFilter}
          onChange={(e) => setGoalFilter(e.target.value)}
        >
          <option value="">All Goals</option>
          <option value="strength">Strength</option>
          <option value="hypertrophy">Hypertrophy</option>
          <option value="endurance">Endurance</option>
          <option value="fat_loss">Fat Loss</option>
          <option value="mobility">Mobility</option>
          <option value="general">General</option>
        </select>

        <select
          className="form-control"
          style={{ width: '150px' }}
          value={premiumFilter}
          onChange={(e) => setPremiumFilter(e.target.value)}
        >
          <option value="all">Free & Premium</option>
          <option value="free">Free Programs</option>
          <option value="premium">Premium Only</option>
        </select>

        <select
          className="form-control"
          style={{ width: '140px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active / Live</option>
          <option value="inactive">Inactive / Draft</option>
        </select>
      </div>

      {/* Routine Templates Table */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No routine templates found</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
            Try adjusting filters or create a new routine template builder to start.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Emoji</th>
                  <th>Template Name</th>
                  <th>Category</th>
                  <th>Goal</th>
                  <th>Difficulty</th>
                  <th>Duration</th>
                  <th>Premium</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '1.25rem', textAlign: 'center' }}>{t.emoji || '💪'}</td>
                    <td>
                      <div style={styles.nameCol}>
                        <span style={{ fontWeight: '600', color: t.color || 'var(--accent)' }}>{t.name}</span>
                        <span style={styles.slugText}>{t.slug}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                        {t.category || 'N/A'}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{t.goal?.replace('_', ' ') || 'N/A'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{t.difficulty || 'N/A'}</td>
                    <td>{t.estimated_duration ? `${t.estimated_duration} mins` : 'N/A'}</td>
                    <td>
                      {t.is_premium ? (
                        <span className="badge badge-gold">Premium</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Free</span>
                      )}
                    </td>
                    <td>
                      {t.is_featured ? (
                        <span className="badge badge-accent">Featured</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No</span>
                      )}
                    </td>
                    <td>
                      {t.is_active ? (
                        <span className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={10} /> Active
                        </span>
                      ) : (
                        <span className="badge badge-secondary">Inactive</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={styles.actionColumn}>
                        <button className="btn-text" onClick={() => handlePreview(t)} title="Preview Routine">
                          <Eye size={16} />
                        </button>
                        <Link to={`/routines/edit/${t.id}`} className="btn-text" title="Edit Template">
                          <Edit size={16} />
                        </Link>
                        <button 
                          className="btn-text" 
                          onClick={() => handleToggleActive(t)} 
                          title={t.is_active ? 'Deactivate Template' : 'Activate Template'}
                          style={{ color: t.is_active ? 'var(--text-muted)' : 'var(--accent)' }}
                        >
                          <Archive size={16} />
                        </button>
                        <button 
                          className="btn-text" 
                          onClick={() => handleDelete(t)} 
                          title="Delete Template"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Routine Preview Modal */}
      {previewTemplate && (
        <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: previewTemplate.color }}>
                <span>{previewTemplate.emoji || '💪'}</span>
                <span>{previewTemplate.name}</span>
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewTemplate(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div style={styles.modalMetaGrid}>
                <div>
                  <span style={styles.metaLabel}>Goal:</span>
                  <span style={styles.metaValue}>{previewTemplate.goal?.replace('_', ' ') || 'N/A'}</span>
                </div>
                <div>
                  <span style={styles.metaLabel}>Difficulty:</span>
                  <span style={styles.metaValue}>{previewTemplate.difficulty || 'N/A'}</span>
                </div>
                <div>
                  <span style={styles.metaLabel}>Est. Duration:</span>
                  <span style={styles.metaValue}>{previewTemplate.estimated_duration ? `${previewTemplate.estimated_duration} mins` : 'N/A'}</span>
                </div>
                <div>
                  <span style={styles.metaLabel}>Est. Calories:</span>
                  <span style={styles.metaValue}>{previewTemplate.estimated_calories ? `${previewTemplate.estimated_calories} kcal` : 'N/A'}</span>
                </div>
              </div>

              {previewTemplate.description && (
                <p style={styles.modalDesc}>{previewTemplate.description}</p>
              )}

              <h3 style={styles.modalSubTitle}>Exercises Programmed</h3>
              {loadingPreview ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader2 className="animate-spin text-accent" size={24} />
                </div>
              ) : previewExercises.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
                  No exercises added to this template yet.
                </div>
              ) : (
                <div style={styles.modalExercisesList}>
                  {previewExercises.map((ex, index) => (
                    <div key={ex.id} style={styles.modalExerciseCard}>
                      <div style={styles.modalExerciseHeader}>
                        <span style={styles.modalExerciseIndex}>{index + 1}</span>
                        <span style={styles.modalExerciseName}>{ex.exercise_name}</span>
                        <span className="badge badge-secondary" style={{ fontSize: '0.675rem' }}>
                          {ex.sets} Sets
                        </span>
                      </div>
                      <div style={styles.modalExerciseDetails}>
                        {ex.reps && <span>{ex.reps} Reps</span>}
                        {ex.weight && <span>{ex.weight} kg</span>}
                        {ex.rest_seconds && <span>{ex.rest_seconds}s Rest</span>}
                        {ex.tempo && <span>Tempo: {ex.tempo}</span>}
                        {ex.rpe && <span>RPE {ex.rpe}</span>}
                      </div>
                      {ex.note && (
                        <div style={styles.modalExerciseNote}>
                          <strong>Note:</strong> {ex.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <Link to={`/routines/edit/${previewTemplate.id}`} className="btn btn-primary btn-sm">
                Edit Program
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  exportGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  nameCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  slugText: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
  },
  actionColumn: {
    display: 'inline-flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  modalMetaGrid: {
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
  modalDesc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
  },
  modalSubTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '1rem',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0.5rem',
  },
  modalExercisesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  modalExerciseCard: {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
  },
  modalExerciseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  modalExerciseIndex: {
    fontSize: '0.8125rem',
    color: 'var(--text-muted)',
    fontWeight: '700',
  },
  modalExerciseName: {
    fontWeight: '600',
    fontSize: '0.875rem',
    flex: 1,
  },
  modalExerciseDetails: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  modalExerciseNote: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed var(--border)',
  },
};
