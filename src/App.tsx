import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from '@/components/Layouts/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ContactsPage from '@/pages/ContactsPage';
import HierarchyPage from '@/pages/HierarchyPage';
import DailyDiaryPage from '@/pages/DailyDiaryPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import FamilyLoginPage from '@/pages/FamilyLoginPage';
import FamilyProfilePage from '@/pages/FamilyProfilePage';
import FamilyRegistrationPage from '@/pages/FamilyRegistrationPage';
import FamilyProtectedRoute from '@/components/FamilyProtectedRoute';
import supabase  from '@/lib/supabaseClient';
import { GeminiAdvisorPanel } from '@/components/gemini-advisor';
import RootRedirect from '@/components/RootRedirect';
import CalendarTimelinePage from '@/pages/CalendarTimelinePage';
// ProtectedRoute component to handle authentication
const ProtectedRoute = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  console.log('Environment variables loaded:', {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? '✅ Loaded' : '❌ Missing',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing',
    baseUrl: import.meta.env.VITE_BACKEND_URL ? '✅ Loaded' : '❌ Missing',
    geminiapiKey: import.meta.env.VITE_GEMINI_API_KEY ? '✅ Loaded' : '❌ Missing',
  });

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
            {/* Family Portal Routes */}
            <Route path="/ritesh" element={<FamilyLoginPage />} />
            <Route path="/family/register" element={<FamilyRegistrationPage />} />
            <Route element={<FamilyProtectedRoute />}>
              <Route path="/family-profile" element={<FamilyProfilePage />} />
            </Route>
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
              <Route path="/dashboard/daily-diary" element={<DashboardLayout><DailyDiaryPage /></DashboardLayout>} />
              <Route path="/dashboard/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
              <Route path="/profile" element={<DashboardLayout><ProfilePage /></DashboardLayout>} />
              <Route path="/contacts" element={<DashboardLayout><ContactsPage /></DashboardLayout>} />
              <Route path="/hierarchy" element={<DashboardLayout><HierarchyPage /></DashboardLayout>} />
              <Route path="/calendar-timeline" element={<DashboardLayout><CalendarTimelinePage /></DashboardLayout>} />
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
