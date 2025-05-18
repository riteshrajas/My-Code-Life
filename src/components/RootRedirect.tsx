import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

const RootRedirect: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    // Optional: Listen for auth changes if needed, though for a one-time redirect it might be overkill
    // const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    //   setSession(session);
    //   if (!loading) { // Only navigate if initial load is done
    //     if (session) {
    //       navigate('/dashboard', { replace: true });
    //     } else {
    //       navigate('/login', { replace: true });
    //     }
    //   }
    // });

    // return () => {
    //   authListener?.subscription.unsubscribe();
    // };
  }, [navigate, loading]);

  if (loading) {
    return <div>Loading...</div>; // Or a global loading indicator
  }

  return session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default RootRedirect;
