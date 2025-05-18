// filepath: p:/PERSONAL/Stage/stage/src/components/Layouts/DashboardLayout.tsx

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { 
  Book, Users, LibrarySquare, PanelLeft, 
  Settings, LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { DailyReflectionModal } from '@/components/DailyReflectionModal';
import { UserMenu } from '@/components/UserMenu'; // Import UserMenu

const NavItem = ({ to, label, children, active }: { 
  to: string; 
  label: string; 
  children: React.ReactNode;
  active: boolean;
}) => (
  <Link
    to={to}
    className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors
      ${active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
  >
    <div className="w-6 h-6 mb-1">{children}</div>
    <span className="text-xs">{label}</span>
  </Link>
);

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const location = useLocation(); 
  const navigate = useNavigate(); 
  const [user, setUser] = useState<any>(null); 
  const [showReflection, setShowReflection] = useState(false);
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate('/login');
        }
      }
    );
    // Fetch initial user
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        navigate('/login');
      }
    })();

    return () => {
      authListener?.subscription.unsubscribe(); // Corrected: unsubscribe is on the subscription object
    };
  }, [navigate]);
  
  useEffect(() => {
    const now = new Date();
    if (now.getHours() >= 20) { // 8 PM
      const hasShownToday = localStorage.getItem(`reflection-${now.toDateString()}`);
      if (!hasShownToday && user) {
        setShowReflection(true);
      }
    }
  }, [user]);

  const getActiveTab = () => {
    if (location.pathname.includes('/dashboard/contacts')) return 'contacts';
    if (location.pathname.includes('/dashboard/hierarchy')) return 'hierarchy';
    return 'rules';
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login'); 
  };

  if (!user) {
    // Optionally, return a loading spinner or null while checking auth state
    return null; // Or <LoadingSpinner />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center px-4 lg:px-6 border-b">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <div className="grid gap-4 py-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
                <Book className="h-5 w-5" />
                <span>My Life Code</span>
              </Link>
              <div className="grid gap-2">
                <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Book className="h-5 w-5" />
                  <span>My Rules</span>
                </Link>
                <Link to="/dashboard/contacts" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Users className="h-5 w-5" />
                  <span>Contacts & Notes</span>
                </Link>
                <Link to="/dashboard/hierarchy" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <LibrarySquare className="h-5 w-5" />
                  <span>Hierarchy Builder</span>
                </Link>
              </div>
              <div className="border-t pt-4">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="hidden md:flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <Book className="h-5 w-5" />
            <span>My Life Code</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className={`text-sm ${location.pathname === '/dashboard' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              My Rules
            </Link>
            <Link to="/dashboard/contacts" className={`text-sm ${location.pathname.includes('/dashboard/contacts') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Contacts & Notes
            </Link>
            <Link to="/dashboard/hierarchy" className={`text-sm ${location.pathname.includes('/dashboard/hierarchy') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Hierarchy Builder
            </Link>
          </nav>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {/* Replace Sign Out and Settings buttons with UserMenu */}
          {user && <UserMenu  />}
        </div>
      </header>
      
      <div className="md:hidden flex border-b">
        <Tabs value={getActiveTab()} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="rules" asChild>
              <Link to="/dashboard" className="flex flex-col items-center py-2">
                <Book className="h-4 w-4 mb-1" />
                <span className="text-xs">Rules</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="contacts" asChild>
              <Link to="/dashboard/contacts" className="flex flex-col items-center py-2">
                <Users className="h-4 w-4 mb-1" />
                <span className="text-xs">Contacts</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="hierarchy" asChild>
              <Link to="/dashboard/hierarchy" className="flex flex-col items-center py-2">
                <LibrarySquare className="h-4 w-4 mb-1" />
                <span className="text-xs">Hierarchy</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 overflow-auto h-[calc(100vh-3.5rem)]"
      >
        {children}
      </motion.main>
      
      {showReflection && (
        <DailyReflectionModal 
          open={showReflection} 
          onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
            setShowReflection(open);
            if (!open) {
              localStorage.setItem(`reflection-${new Date().toDateString()}`, 'true');
            }
          }} 
        />
      )}
    </div>
  );
}
