import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Dumbbell, FileText, Star, Trophy, Loader2, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalExercises: number;
  activeExercises: number;
  totalTemplates: number;
  activeTemplates: number;
  featuredTemplates: number;
  premiumTemplates: number;
}

export default function Overview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalExercises: 0,
    activeExercises: 0,
    totalTemplates: 0,
    activeTemplates: 0,
    featuredTemplates: 0,
    premiumTemplates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [
        exRes, 
        exActiveRes, 
        tempRes, 
        tempActiveRes, 
        tempFeaturedRes, 
        tempPremiumRes
      ] = await Promise.all([
        supabase.from('catalog_exercises').select('id', { count: 'exact', head: true }),
        supabase.from('catalog_exercises').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('routine_templates').select('id', { count: 'exact', head: true }),
        supabase.from('routine_templates').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('routine_templates').select('id', { count: 'exact', head: true }).eq('is_featured', true),
        supabase.from('routine_templates').select('id', { count: 'exact', head: true }).eq('is_premium', true),
      ]);

      setStats({
        totalExercises: exRes.count || 0,
        activeExercises: exActiveRes.count || 0,
        totalTemplates: tempRes.count || 0,
        activeTemplates: tempActiveRes.count || 0,
        featuredTemplates: tempFeaturedRes.count || 0,
        premiumTemplates: tempPremiumRes.count || 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
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
      <h1 className="page-title">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="card-grid">
        <div className="card">
          <div style={styles.cardHeader}>
            <span className="card-title">Catalog Exercises</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(0, 255, 157, 0.05)' }}>
              <Dumbbell size={20} className="text-accent" />
            </div>
          </div>
          <div className="card-value">{stats.totalExercises}</div>
          <div style={styles.cardFooter}>
            <span className="badge badge-accent">{stats.activeExercises} Active</span>
            <span style={styles.cardFooterText}>{stats.totalExercises - stats.activeExercises} Archived</span>
          </div>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span className="card-title">Routine Templates</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(77, 166, 255, 0.05)' }}>
              <FileText size={20} style={{ color: '#4DA6FF' }} />
            </div>
          </div>
          <div className="card-value">{stats.totalTemplates}</div>
          <div style={styles.cardFooter}>
            <span className="badge badge-secondary" style={{ borderColor: 'rgba(77, 166, 255, 0.2)', color: '#4DA6FF', backgroundColor: 'rgba(77, 166, 255, 0.05)' }}>
              {stats.activeTemplates} Active
            </span>
            <span style={styles.cardFooterText}>{stats.totalTemplates - stats.activeTemplates} Inactive</span>
          </div>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span className="card-title">Featured Programs</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(255, 211, 106, 0.05)' }}>
              <Star size={20} className="text-gold" />
            </div>
          </div>
          <div className="card-value">{stats.featuredTemplates}</div>
          <div style={styles.cardFooter}>
            <span className="badge badge-gold">Featured</span>
            <span style={styles.cardFooterText}>On explore tab</span>
          </div>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span className="card-title">Premium Templates</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(255, 211, 106, 0.05)' }}>
              <Trophy size={20} className="text-gold" />
            </div>
          </div>
          <div className="card-value">{stats.premiumTemplates}</div>
          <div style={styles.cardFooter}>
            <span className="badge badge-gold">Premium Locked</span>
            <span style={styles.cardFooterText}>Requires premium status</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Shortcut Grid */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', marginTop: '2.5rem' }}>Quick Actions</h2>
      <div style={styles.actionGrid}>
        <div className="card" style={styles.actionCard}>
          <h3 style={styles.actionCardTitle}>Manage Exercises</h3>
          <p style={styles.actionCardDesc}>Create, update, archive public exercise definitions and media URLs in the catalog.</p>
          <div style={styles.actionCardButtons}>
            <Link to="/exercises/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Exercise
            </Link>
            <Link to="/exercises" className="btn btn-secondary btn-sm">
              View Catalog <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div className="card" style={styles.actionCard}>
          <h3 style={styles.actionCardTitle}>Manage Routine Templates</h3>
          <p style={styles.actionCardDesc}>Create multiday workout routine templates with the drag-and-drop builder.</p>
          <div style={styles.actionCardButtons}>
            <Link to="/routines/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> Create Template
            </Link>
            <Link to="/routines" className="btn btn-secondary btn-sm">
              View Templates <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  iconBg: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border)',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem',
  },
  cardFooterText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  actionCardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
  },
  actionCardDesc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    flex: 1,
  },
  actionCardButtons: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
};
