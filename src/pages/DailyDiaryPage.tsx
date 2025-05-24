import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Calendar, Save, Plus, Edit2, PenTool } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';
import '../styles/notebook.css';

interface DiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const DailyDiaryPage = () => {
  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        await fetchEntries(user.id);
      }
    };
    getCurrentUser();
  }, []);
  useEffect(() => {
    if (currentUser && entries.length > 0) {
      loadEntryForDate(selectedDate);
    }
  }, [selectedDate, currentUser, entries]);
  const fetchEntries = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false });

      if (error) {
        console.error('Error fetching diary entries:', error);
        toast({
          title: 'Error',
          description: 'Failed to load diary entries',
          variant: 'destructive'
        });
        return;
      }

      setEntries(data || []);
      // Load the entry for the selected date after fetching entries
      if (data && data.length > 0) {
        const existingEntry = data.find(entry => entry.entry_date === selectedDate);
        if (existingEntry) {
          setCurrentEntry(existingEntry.content);
          setEditingEntry(existingEntry);
        } else {
          setCurrentEntry('');
          setEditingEntry(null);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntryForDate = (date: string) => {
    const existingEntry = entries.find(entry => entry.entry_date === date);
    if (existingEntry) {
      setCurrentEntry(existingEntry.content);
      setEditingEntry(existingEntry);
    } else {
      setCurrentEntry('');
      setEditingEntry(null);
    }
  };

  const handleSaveEntry = async () => {
    if (!currentEntry.trim() || !currentUser) return;
    
    setIsSaving(true);
    
    try {
      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('diary_entries')
          .update({ 
            content: currentEntry,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEntry.id);

        if (error) {
          throw error;
        }

        // Update local state
        setEntries(prev => prev.map(entry => 
          entry.id === editingEntry.id 
            ? { ...entry, content: currentEntry, updated_at: new Date().toISOString() }
            : entry
        ));

        toast({
          title: 'Success',
          description: 'Diary entry updated successfully'
        });
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('diary_entries')
          .insert({
            user_id: currentUser.id,
            entry_date: selectedDate,
            content: currentEntry
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Update local state
        setEntries(prev => [data, ...prev.filter(e => e.entry_date !== selectedDate)]);
        setEditingEntry(data);

        toast({
          title: 'Success',
          description: 'Diary entry saved successfully'
        });
      }
    } catch (error) {
      console.error('Error saving diary entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save diary entry',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const handleEntryClick = (entry: DiaryEntry) => {
    setSelectedDate(entry.entry_date);
  };
  const formatDate = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    const date = new Date(dateString);
    
    if (dateString === today) {
      return 'Today';
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const sortedEntries = entries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link to="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center">
          <BookOpen className="h-8 w-8 mr-3 text-purple-500" />
          Daily Diary
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Editor Section */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  {selectedDate === new Date().toISOString().split('T')[0] 
                    ? "Today's Entry" 
                    : `Entry for ${formatDate(selectedDate)}`}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={handleDateChange}
                    className="p-2 border rounded-md bg-background text-foreground shadow-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-6">
              <Textarea
                placeholder="What's on your mind today? Share your thoughts, experiences, and reflections..."
                value={currentEntry}
                onChange={(e) => setCurrentEntry(e.target.value)}
                className="flex-1 text-base resize-none border-none shadow-none focus:ring-0 p-0 min-h-[400px]"
                style={{ 
                  lineHeight: '1.6',
                  fontFamily: 'ui-serif, Georgia, Cambria, serif'
                }}
              />
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {currentEntry.length} characters
                </div>
                <Button 
                  onClick={handleSaveEntry} 
                  disabled={isSaving || !currentEntry.trim()} 
                  className="px-6"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Past Entries Section */}
        <div className="flex flex-col">
          <Card className="flex-1 shadow-lg">            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  Your Diary Entries
                </div>
                <div className="text-sm text-muted-foreground">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading entries...</p>
                </div>
              ) : sortedEntries.length === 0 ? (
                <div className="p-6 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No diary entries yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Start writing to create your first entry!</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">                  {sortedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-4 border-b cursor-pointer transition-all hover:bg-muted/50 ${
                        entry.entry_date === selectedDate ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                      }`}
                      onClick={() => handleEntryClick(entry)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">
                          {formatDate(entry.entry_date)}
                        </h4>
                        {entry.entry_date === selectedDate && (
                          <Edit2 className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {entry.content}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {entry.content.length} characters
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
            <div className="mt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setSelectedDate(today);
                // Force load entry for today
                const todayEntry = entries.find(entry => entry.entry_date === today);
                if (todayEntry) {
                  setCurrentEntry(todayEntry.content);
                  setEditingEntry(todayEntry);
                } else {
                  setCurrentEntry('');
                  setEditingEntry(null);
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Entry for Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyDiaryPage;

