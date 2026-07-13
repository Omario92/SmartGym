import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Exercises from './pages/Exercises';
import ExerciseForm from './pages/ExerciseForm';
import Routines from './pages/Routines';
import RoutineForm from './pages/RoutineForm';
import Settings from './pages/Settings';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const profileRef = useRef<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);

  const setProfile = (newProfile: UserProfile | null) => {
    profileRef.current = newProfile;
    setProfileState(newProfile);
  };

  useEffect(() => {
    // 1. Initial Session Get
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const isSameUser = profileRef.current?.id === session.user.id;
        checkAdminStatus(session.user.id, session.user.email || '', isSameUser);
      } else {
        setLoading(false);
      }
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const isSameUser = profileRef.current?.id === session.user.id;
        checkAdminStatus(session.user.id, session.user.email || '', isSameUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string, email: string, silent = false) => {
    if (!silent) {
      setVerifyingAdmin(true);
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, is_admin')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data && data.is_admin) {
        setProfile({
          id: data.id,
          email: data.email || email,
          display_name: data.display_name,
          is_admin: data.is_admin,
        });
      } else {
        // Not an admin
        setProfile({
          id: userId,
          email: email,
          display_name: data?.display_name || null,
          is_admin: false,
        });
      }
    } catch (err) {
      console.error('Error verifying admin status:', err);
      // Fallback: check metadata or defaults
      setProfile({
        id: userId,
        email: email,
        display_name: null,
        is_admin: false,
      });
    } finally {
      setVerifyingAdmin(false);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading || verifyingAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', backgroundColor: 'var(--bg-primary)', color: 'white' }}>
        <Loader2 className="animate-spin text-accent" size={32} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Verifying admin credentials...</span>
      </div>
    );
  }

  // Admin access denied page
  if (session && profile && !profile.is_admin) {
    return (
      <div className="modal-overlay" style={{ background: 'var(--bg-primary)' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <ShieldAlert size={48} className="text-danger" />
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>Access Denied</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Your account <strong>{profile.email}</strong> is not authorized to access this admin panel. Please contact the administrator.
          </p>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%' }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public login page */}
        <Route 
          path="/login" 
          element={session ? <Navigate to="/" replace /> : <Login />} 
        />

        {/* Protected Dashboard Route Layout */}
        <Route
          path="/*"
          element={
            session ? (
              <div className="admin-layout">
                <Sidebar userEmail={profile?.email || ''} onLogout={handleLogout} />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Overview />} />
                    <Route path="/exercises" element={<Exercises />} />
                    <Route path="/exercises/new" element={<ExerciseForm />} />
                    <Route path="/exercises/edit/:id" element={<ExerciseForm />} />
                    <Route path="/routines" element={<Routines />} />
                    <Route path="/routines/new" element={<RoutineForm />} />
                    <Route path="/routines/edit/:id" element={<RoutineForm />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all global redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
