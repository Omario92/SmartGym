import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Key, User, Loader2, Check } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI Messages
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Profile Edit fields
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setDisplayName(data?.display_name || '');
      }
    } catch (err) {
      console.error('Error loading admin profile:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user session found');

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (error) throw error;

      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      fetchProfile();
    } catch (err: any) {
      setProfileMsg({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (password !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setPasswordMsg({ text: 'Password changed successfully!', type: 'success' });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 className="page-title">Admin Settings</h1>

      <div style={styles.grid}>
        {/* Profile Card */}
        <div className="card" style={{ flex: 1 }}>
          <div style={styles.sectionHeader}>
            <User size={18} className="text-accent" />
            <h3 style={styles.sectionTitle}>Profile Details</h3>
          </div>

          {profileMsg && (
            <div className={`badge ${profileMsg.type === 'error' ? 'badge-danger' : 'badge-accent'}`} style={styles.alert}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={profile?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span style={styles.inputHelp}>Email cannot be changed from the admin panel.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Master Trainer"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Admin Role</label>
              <span className="badge badge-accent" style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                System Admin
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              <span>Save Profile</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card" style={{ flex: 1 }}>
          <div style={styles.sectionHeader}>
            <Key size={18} className="text-accent" />
            <h3 style={styles.sectionTitle}>Security & Credentials</h3>
          </div>

          {passwordMsg && (
            <div className={`badge ${passwordMsg.type === 'error' ? 'badge-danger' : 'badge-accent'}`} style={styles.alert}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} style={styles.form}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              <span>Change Password</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0.75rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    textTransform: 'uppercase' as const,
    fontWeight: '600',
    letterSpacing: '0.05em',
  },
  alert: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1.25rem',
    display: 'block',
    whiteSpace: 'normal' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  inputHelp: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.375rem',
    display: 'block',
  },
};
