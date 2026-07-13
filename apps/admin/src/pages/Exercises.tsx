import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Search, Plus, Copy, Archive, RotateCcw, Edit, 
  Download, Upload, Loader2, Dumbbell
} from 'lucide-react';

interface CatalogExercise {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  is_popular: boolean;
  is_active: boolean;
  calories_per_minute: number | null;
  instructions: string[];
  tips: string[];
  image_url: string | null;
  video_url: string | null;
}

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'arms',
  'legs', 'core', 'glutes', 'cardio', 'full_body'
];

const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'machine', 'cable',
  'bodyweight', 'kettlebell', 'resistance_band', 'smith_machine', 'other'
];

export default function Exercises() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<CatalogExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [equipFilter, setEquipFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'archived'
  
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
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      // Fetch all public exercises including inactive ones since we are admin
      const { data, error } = await supabase
        .from('catalog_exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setExercises(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch exercises', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (exercise: CatalogExercise) => {
    try {
      const nextActive = !exercise.is_active;
      const { error } = await supabase
        .from('catalog_exercises')
        .update({ is_active: nextActive })
        .eq('id', exercise.id);

      if (error) throw error;

      setExercises((prev) =>
        prev.map((ex) => (ex.id === exercise.id ? { ...ex, is_active: nextActive } : ex))
      );
      showToast(`${exercise.name} ${nextActive ? 'unarchived' : 'archived'} successfully`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update exercise status', 'error');
    }
  };

  const handleDuplicate = async (exercise: CatalogExercise) => {
    try {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const duplicatedExercise = {
        name: `${exercise.name} (Copy)`,
        slug: `${exercise.slug}-copy-${uniqueSuffix}`,
        description: exercise.description,
        muscle_group: exercise.muscle_group,
        secondary_muscles: (exercise as any).secondary_muscles || [],
        equipment: exercise.equipment,
        type: (exercise as any).type || 'strength',
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        tips: exercise.tips,
        image_url: exercise.image_url,
        video_url: exercise.video_url,
        calories_per_minute: exercise.calories_per_minute,
        is_popular: false,
        is_active: false, // Start as inactive/draft
      };

      const { data, error } = await supabase
        .from('catalog_exercises')
        .insert([duplicatedExercise])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setExercises((prev) => [data, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
        showToast(`Duplicated into draft: "${data.name}"`);
        navigate(`/exercises/edit/${data.id}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate exercise', 'error');
    }
  };

  // CSV/JSON Export
  const handleExport = (format: 'json' | 'csv') => {
    const dataToExport = filteredExercises;
    if (dataToExport.length === 0) {
      showToast('No exercises to export', 'error');
      return;
    }

    let fileContent = '';
    let mimeType = '';
    let fileName = `smartgym-exercises-${Date.now()}`;

    if (format === 'json') {
      fileContent = JSON.stringify(dataToExport, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      // CSV
      const headers = [
        'name', 'slug', 'description', 'muscle_group', 'equipment', 
        'difficulty', 'calories_per_minute', 'is_popular', 'is_active', 
        'instructions', 'tips', 'image_url', 'video_url'
      ];
      
      const csvRows = [headers.join(',')];
      
      dataToExport.forEach((ex) => {
        const values = headers.map((header) => {
          let val = (ex as any)[header];
          if (val === null || val === undefined) {
            return '';
          }
          if (Array.isArray(val)) {
            // Instructions/Tips array joined by semicolons
            return `"${val.join(';').replace(/"/g, '""')}"`;
          }
          if (typeof val === 'string') {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        csvRows.push(values.join(','));
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
    showToast(`Exported ${dataToExport.length} exercises successfully`);
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
        let exercisesToInsert: any[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          exercisesToInsert = Array.isArray(parsed) ? parsed : [parsed];
        } else if (file.name.endsWith('.csv')) {
          // Basic CSV Parser
          const lines = text.split('\n').filter(l => l.trim() !== '');
          if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          
          exercisesToInsert = lines.slice(1).map((line) => {
            // Split by comma but respect quotes
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
            const values = matches.map(v => v.replace(/^"|"$/g, '').trim());
            const obj: any = {};
            
            headers.forEach((header, idx) => {
              let val: any = values[idx] || '';
              if (header === 'instructions' || header === 'tips') {
                val = val ? val.split(';').filter((item: string) => item.trim() !== '') : [];
              } else if (header === 'is_popular' || header === 'is_active') {
                val = val.toLowerCase() === 'true';
              } else if (header === 'calories_per_minute') {
                val = val ? parseFloat(val) : null;
              }
              obj[header] = val;
            });
            return obj;
          });
        } else {
          throw new Error('Unsupported file format. Please upload JSON or CSV.');
        }

        // Clean up data for insert
        const sanitized = exercisesToInsert.map((item) => {
          const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
          return {
            name: item.name || 'Imported Exercise',
            slug: item.slug ? item.slug.toLowerCase().replace(/[^a-z0-9-]/g, '') : `imported-exercise-${uniqueSuffix}`,
            description: item.description || null,
            muscle_group: MUSCLE_GROUPS.includes(item.muscle_group) ? item.muscle_group : 'chest',
            equipment: EQUIPMENT_TYPES.includes(item.equipment) ? item.equipment : 'other',
            difficulty: ['beginner', 'intermediate', 'advanced'].includes(item.difficulty) ? item.difficulty : 'intermediate',
            calories_per_minute: item.calories_per_minute || null,
            is_popular: !!item.is_popular,
            is_active: item.is_active !== undefined ? !!item.is_active : true,
            instructions: Array.isArray(item.instructions) ? item.instructions : [],
            tips: Array.isArray(item.tips) ? item.tips : [],
            image_url: item.image_url || null,
            video_url: item.video_url || null,
            secondary_muscles: Array.isArray(item.secondary_muscles) ? item.secondary_muscles : [],
            type: item.type || 'strength'
          };
        });

        // Insert into Supabase
        const { data, error } = await supabase
          .from('catalog_exercises')
          .insert(sanitized)
          .select();

        if (error) throw error;

        showToast(`Imported ${data?.length || sanitized.length} exercises successfully`);
        fetchExercises();
      } catch (err: any) {
        showToast(err.message || 'Failed to parse file or insert data', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = 
      ex.name.toLowerCase().includes(search.toLowerCase()) || 
      ex.slug.toLowerCase().includes(search.toLowerCase());
    
    const matchesMuscle = muscleFilter ? ex.muscle_group === muscleFilter : true;
    const matchesEquip = equipFilter ? ex.equipment === equipFilter : true;
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = ex.is_active;
    else if (statusFilter === 'archived') matchesStatus = !ex.is_active;

    return matchesSearch && matchesMuscle && matchesEquip && matchesStatus;
  });

  return (
    <div>
      {/* Toast Notification HUD */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'toast-danger' : ''}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div style={styles.header}>
        <h1 style={{ fontSize: '2rem' }}>Exercise Catalog</h1>
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
          <Link to="/exercises/new" className="btn btn-primary">
            <Plus size={16} /> Add Exercise
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon-pos" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search exercises by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '180px' }}
          value={muscleFilter}
          onChange={(e) => setMuscleFilter(e.target.value)}
        >
          <option value="">All Muscles</option>
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>{m.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: '180px' }}
          value={equipFilter}
          onChange={(e) => setEquipFilter(e.target.value)}
        >
          <option value="">All Equipment</option>
          {EQUIPMENT_TYPES.map((eq) => (
            <option key={eq} value={eq}>{eq.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: '140px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="archived">Archived Only</option>
        </select>
      </div>

      {/* Catalog Table */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="empty-state">
          <Dumbbell size={48} />
          <h3>No exercises found</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
            Try clearing filters or add a new exercise to get started.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Exercise Name</th>
                  <th>Slug</th>
                  <th>Primary Muscle</th>
                  <th>Equipment</th>
                  <th>Difficulty</th>
                  <th>Popular</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExercises.map((ex) => (
                  <tr key={ex.id}>
                    <td style={{ fontWeight: '500' }}>{ex.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{ex.slug}</td>
                    <td>
                      <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                        {ex.muscle_group.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                        {ex.equipment.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{ex.difficulty}</span>
                    </td>
                    <td>
                      {ex.is_popular ? (
                        <span className="badge badge-accent">Yes</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No</span>
                      )}
                    </td>
                    <td>
                      {ex.is_active ? (
                        <span className="badge badge-accent">Active</span>
                      ) : (
                        <span className="badge badge-danger">Archived</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={styles.actionColumn}>
                        <Link to={`/exercises/edit/${ex.id}`} className="btn-text" title="Edit Exercise">
                          <Edit size={16} />
                        </Link>
                        <button className="btn-text" onClick={() => handleDuplicate(ex)} title="Duplicate Exercise">
                          <Copy size={16} />
                        </button>
                        <button 
                          className="btn-text" 
                          onClick={() => handleToggleActive(ex)} 
                          title={ex.is_active ? 'Archive Exercise' : 'Unarchive Exercise'}
                          style={{ color: ex.is_active ? 'var(--text-muted)' : 'var(--accent)' }}
                        >
                          {ex.is_active ? <Archive size={16} /> : <RotateCcw size={16} />}
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
  actionColumn: {
    display: 'inline-flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
};
