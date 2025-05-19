import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from '@/components/Layouts/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ContactsPage from '@/pages/ContactsPage';
import HierarchyPage from '@/pages/HierarchyPage';
import supabase  from '@/lib/supabaseClient';
import { GeminiAdvisorPanel } from '@/components/gemini-advisor';
import RootRedirect from '@/components/RootRedirect';

// ProtectedRoute component to handle authentication
const ProtectedRoute = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener?.subscription.unsubscribe(); // Corrected: unsubscribe is on the subscription object
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  // Add this fix for react-beautiful-dnd in React 18
  useEffect(() => {
    // Fix for react-beautiful-dnd in React 18 StrictMode
    const strictModeFixForReactBeautifulDnd = () => {
      const draggables = document.querySelectorAll('[data-rbd-draggable-id]');
      draggables.forEach((el) => {
        // Force a reflow
        void (el as HTMLElement).offsetHeight;
      });
    };
    
    // Run it on mount and window resize
    strictModeFixForReactBeautifulDnd();
    window.addEventListener('resize', strictModeFixForReactBeautifulDnd);
    return () => window.removeEventListener('resize', strictModeFixForReactBeautifulDnd);
  }, []);

  return (
    <Router>
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
              <Route path="/dashboard/contacts" element={<DashboardLayout><ContactsPage /></DashboardLayout>} />
              <Route path="/dashboard/hierarchy" element={<DashboardLayout><HierarchyPage /></DashboardLayout>} />
            </Route>
            {/* Default route: uses RootRedirect to determine where to go */}
            <Route 
              path="*" 
              element={<RootRedirect />} 
            />
          </Routes>
        </div>
        <GeminiAdvisorPanel />
      </div>
    </Router>
  );
}

export default App;
