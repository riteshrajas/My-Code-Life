import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, Edit3, Save, Camera, Calendar, MapPin,
  Heart, Users, Target, BarChart3, CheckCircle,
  Zap, Brain, Shield, RefreshCw, Github, Linkedin,
  Twitter, Star, Trophy, TrendingUp, Activity
} from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  occupation?: string;
  company?: string;
  education?: string;
  interests?: string[];
  goals?: string[];
  avatar_url?: string;
  phone?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  created_at: string;
  updated_at?: string;
}

interface UserStats {
  total_tasks: number;
  completed_tasks: number;
  diary_entries: number;
  contacts: number;
  days_active: number;
  longest_streak: number;
  current_streak: number;
  rule_alignment: {
    rule_1: number;
    rule_2: number;
    rule_3: number;
  };
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    full_name: '',
    bio: '',
    location: '',
    website: '',
    occupation: '',
    company: '',
    education: '',
    interests: [],
    goals: [],
    phone: '',
    linkedin: '',
    twitter: '',
    github: ''
  });
  const [stats, setStats] = useState<UserStats>({
    total_tasks: 0,
    completed_tasks: 0,
    diary_entries: 0,
    contacts: 0,
    days_active: 0,
    longest_streak: 0,
    current_streak: 0,
    rule_alignment: { rule_1: 0, rule_2: 0, rule_3: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          await Promise.all([
            loadUserProfile(user.id),
            loadUserStats(user.id)
          ]);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error getting user:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, [navigate]);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile({
          ...data,
          interests: data.interests || [],
          goals: data.goals || []
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserStats = async (userId: string) => {
    try {
      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      // Fetch diary entries
      const { data: diaryEntries } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId);

      // Fetch contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId);

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const totalDiaryEntries = diaryEntries?.length || 0;
      const totalContacts = contacts?.length || 0;

      // Calculate rule alignment
      const ruleAlignment = {
        rule_1: tasks?.filter(t => t.rule_id === 1).length || 0,
        rule_2: tasks?.filter(t => t.rule_id === 2).length || 0,
        rule_3: tasks?.filter(t => t.rule_id === 3).length || 0
      };

      // Calculate streaks (simplified)
      const daysActive = new Set(diaryEntries?.map(d => d.entry_date) || []).size;

      setStats({
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        diary_entries: totalDiaryEntries,
        contacts: totalContacts,
        days_active: daysActive,
        longest_streak: Math.min(daysActive, 30), // Simplified
        current_streak: Math.min(daysActive, 7), // Simplified
        rule_alignment: ruleAlignment
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      setEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile({ ...profile, avatar_url: data.publicUrl });

      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !profile.interests?.includes(newInterest.trim())) {
      setProfile({
        ...profile,
        interests: [...(profile.interests || []), newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests?.filter(i => i !== interest) || []
    });
  };

  const addGoal = () => {
    if (newGoal.trim() && !profile.goals?.includes(newGoal.trim())) {
      setProfile({
        ...profile,
        goals: [...(profile.goals || []), newGoal.trim()]
      });
      setNewGoal('');
    }
  };

  const removeGoal = (goal: string) => {
    setProfile({
      ...profile,
      goals: profile.goals?.filter(g => g !== goal) || []
    });
  };

  const getCompletionRate = () => {
    return stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;
  };

  const getRuleProgress = (ruleId: number) => {
    const total = stats.rule_alignment.rule_1 + stats.rule_alignment.rule_2 + stats.rule_alignment.rule_3;
    if (total === 0) return 0;
    
    switch (ruleId) {
      case 1: return Math.round((stats.rule_alignment.rule_1 / total) * 100);
      case 2: return Math.round((stats.rule_alignment.rule_2 / total) * 100);
      case 3: return Math.round((stats.rule_alignment.rule_3 / total) * 100);
      default: return 0;
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Profile</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your personal information and track your progress
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Your personal details and contact information
                    </CardDescription>
                  </div>
                  <Button
                    variant={editing ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditing(!editing)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    {editing ? 'Cancel' : 'Edit'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-lg">
                          {getInitials(profile.full_name, user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      {editing && (
                        <label className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full cursor-pointer">
                          <Camera className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploadingAvatar}
                          />
                        </label>
                      )}
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{profile.full_name || 'Your Name'}</h3>
                      <p className="text-muted-foreground">{user?.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Joined {new Date(user?.created_at).toLocaleDateString()}
                        </div>
                        {profile.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {profile.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name || ''}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        disabled={!editing}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        disabled={!editing}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profile.location || ''}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        disabled={!editing}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      disabled={!editing}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  {/* Professional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        value={profile.occupation || ''}
                        onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                        disabled={!editing}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profile.company || ''}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        disabled={!editing}
                        placeholder="Acme Corp"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Input
                      id="education"
                      value={profile.education || ''}
                      onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                      disabled={!editing}
                      placeholder="University of Example, Computer Science"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <Label>Social Links</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4" />
                          <Label htmlFor="linkedin">LinkedIn</Label>
                        </div>
                        <Input
                          id="linkedin"
                          value={profile.linkedin || ''}
                          onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                          disabled={!editing}
                          placeholder="linkedin.com/in/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Twitter className="h-4 w-4" />
                          <Label htmlFor="twitter">Twitter</Label>
                        </div>
                        <Input
                          id="twitter"
                          value={profile.twitter || ''}
                          onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                          disabled={!editing}
                          placeholder="@username"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4" />
                          <Label htmlFor="github">GitHub</Label>
                        </div>
                        <Input
                          id="github"
                          value={profile.github || ''}
                          onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                          disabled={!editing}
                          placeholder="github.com/username"
                        />
                      </div>
                    </div>
                  </div>

                  {editing && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        {saving ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Interests and Goals */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Interests & Goals
                  </CardTitle>
                  <CardDescription>
                    Things you love and aspirations you're working towards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Interests */}
                  <div className="space-y-3">
                    <Label>Interests</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests?.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {interest}
                          {editing && (
                            <button
                              onClick={() => removeInterest(interest)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {editing && (
                      <div className="flex gap-2">
                        <Input
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          placeholder="Add an interest"
                          onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                        />
                        <Button onClick={addInterest} size="sm">Add</Button>
                      </div>
                    )}
                  </div>

                  {/* Goals */}
                  <div className="space-y-3">
                    <Label>Goals</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.goals?.map((goal, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {goal}
                          {editing && (
                            <button
                              onClick={() => removeGoal(goal)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {editing && (
                      <div className="flex gap-2">
                        <Input
                          value={newGoal}
                          onChange={(e) => setNewGoal(e.target.value)}
                          placeholder="Add a goal"
                          onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                        />
                        <Button onClick={addGoal} size="sm">Add</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Stats and Progress */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{stats.total_tasks}</div>
                      <div className="text-sm text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.completed_tasks}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.diary_entries}</div>
                      <div className="text-sm text-muted-foreground">Diary Entries</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.contacts}</div>
                      <div className="text-sm text-muted-foreground">Contacts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Progress Tracking */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progress Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Task Completion Rate</span>
                      <span className="text-sm text-muted-foreground">{getCompletionRate()}%</span>
                    </div>
                    <Progress value={getCompletionRate()} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Current Streak</span>
                      <span className="text-sm text-muted-foreground">{stats.current_streak} days</span>
                    </div>
                    <Progress value={(stats.current_streak / 30) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Days Active</span>
                      <span className="text-sm text-muted-foreground">{stats.days_active} days</span>
                    </div>
                    <Progress value={(stats.days_active / 100) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Life Rules Alignment */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Life Rules Alignment
                  </CardTitle>
                  <CardDescription>
                    How your activities align with your core principles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Truth & Curiosity</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{getRuleProgress(1)}%</span>
                      </div>
                      <Progress value={getRuleProgress(1)} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Integrity</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{getRuleProgress(2)}%</span>
                      </div>
                      <Progress value={getRuleProgress(2)} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium">Antifragile Growth</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{getRuleProgress(3)}%</span>
                      </div>
                      <Progress value={getRuleProgress(3)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.completed_tasks > 0 && (
                      <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                          <div className="font-medium">First Task Completed</div>
                          <div className="text-sm text-muted-foreground">You completed your first task!</div>
                        </div>
                      </div>
                    )}
                    
                    {stats.diary_entries > 0 && (
                      <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        <Activity className="h-8 w-8 text-blue-500" />
                        <div>
                          <div className="font-medium">Journal Keeper</div>
                          <div className="text-sm text-muted-foreground">You started journaling!</div>
                        </div>
                      </div>
                    )}

                    {stats.contacts > 0 && (
                      <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        <Users className="h-8 w-8 text-purple-500" />
                        <div>
                          <div className="font-medium">Networker</div>
                          <div className="text-sm text-muted-foreground">You added your first contact!</div>
                        </div>
                      </div>
                    )}

                    {stats.completed_tasks === 0 && stats.diary_entries === 0 && stats.contacts === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start using Stage to unlock achievements!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
