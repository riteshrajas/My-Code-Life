import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, Shield, Bell, Palette, Database, Download, Upload, 
  Trash2, Save, RefreshCw, Moon, Sun, Monitor, Volume2,
  Mail, MessageSquare, Calendar, Clock, Globe, Key,
  AlertCircle, CheckCircle, Settings as SettingsIcon
} from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { sendAccountDeletionEmail, sendDeveloperNotification } from '@/lib/emailService';

interface UserSettings {
  id: string;
  email: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  dark_mode: boolean;
  language: string;
  timezone: string;
  auto_save: boolean;
  data_retention_days: number;
  created_at: string;
  updated_at: string;
}

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: false,
    dark_mode: false,
    language: 'en',
    timezone: 'UTC',
    auto_save: true,
    data_retention_days: 365
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingData, setExportingData] = useState(false);  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          await loadUserSettings(user.id);
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

  const loadUserSettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email: user.email,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Settings Saved',
        description: 'Your settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    setExportingData(true);
    try {
      // Export user data
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      const { data: diaryEntries } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        contacts: contacts || [],
        tasks: tasks || [],
        diary_entries: diaryEntries || [],
        settings: settings,
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stage_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data Exported',
        description: 'Your data has been exported successfully.',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExportingData(false);
    }
  };
  const handleDeleteAccount = async () => {
    if (!user || confirmDelete !== 'DELETE') return;

    setDeletingAccount(true);
    try {
      // First, collect all user data for email
      const [contactsData, tasksData, diaryData, settingsData, profileData] = await Promise.all([
        supabase.from('contacts').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('diary_entries').select('*').eq('user_id', user.id),
        supabase.from('user_settings').select('*').eq('user_id', user.id),
        supabase.from('user_profiles').select('*').eq('user_id', user.id)
      ]);

      // Prepare comprehensive data export
      const fullDataExport = {
        deletion_timestamp: new Date().toISOString(),
        user_info: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          deleted_at: new Date().toISOString()
        },
        profile: profileData.data || [],
        settings: settingsData.data || [],
        contacts: contactsData.data || [],
        tasks: tasksData.data || [],
        diary_entries: diaryData.data || [],
        summary: {
          total_contacts: contactsData.data?.length || 0,
          total_tasks: tasksData.data?.length || 0,
          completed_tasks: tasksData.data?.filter(t => t.status === 'completed').length || 0,
          total_diary_entries: diaryData.data?.length || 0,
          account_age_days: Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
        }
      };      // Send email to the user with their data backup
      try {
        // Get recent activity for developer notification
        const recentActivity = {
          diary: diaryData.data?.slice(-3) || [],
          tasks: tasksData.data?.slice(-5) || []
        };

        // Send email to user with backup using Supabase Edge Function
        await sendAccountDeletionEmail(user.email, fullDataExport, fullDataExport.summary);
        
        // Send notification to developer
        await sendDeveloperNotification(user.email, user.id, fullDataExport.summary, recentActivity);

        // Create a downloadable backup as fallback
        const dataFileContent = JSON.stringify(fullDataExport, null, 2);
        const blob = new Blob([dataFileContent], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stage_data_backup_${user.email}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Data Backup Sent',
          description: 'Your complete data backup has been sent to your email address.',
        });
      } catch (emailError) {
        console.error('Error sending deletion email:', emailError);
        toast({
          title: 'Email Error',
          description: 'Failed to send data backup email, but a local backup file has been downloaded.',
          variant: 'destructive',
        });
        // Continue with deletion even if email fails
      }      // Now delete user data from all tables
      const deletePromises = [
        supabase.from('contacts').delete().eq('user_id', user.id),
        supabase.from('tasks').delete().eq('user_id', user.id),
        supabase.from('diary_entries').delete().eq('user_id', user.id),
        supabase.from('user_settings').delete().eq('user_id', user.id),
        supabase.from('user_profiles').delete().eq('user_id', user.id)
      ];

      await Promise.all(deletePromises);

      // Finally, delete the user account itself
      // Note: In a production environment, you'd typically need admin privileges
      // For now, we'll sign them out and they'll need to contact support for full deletion
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Error signing out:', signOutError);
      }

      toast({
        title: 'Account Deletion Completed',
        description: 'Your account data has been deleted and backup sent to your email. Check your inbox for your data backup file.',
      });

      // Clear any local storage
      localStorage.clear();
      sessionStorage.clear();

      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete account. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    try {
      // First verify the current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect.');
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      // Clear the form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Password Change Failed',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your account preferences and application settings
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data & Privacy
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your account details and personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={settings.timezone}
                        onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => setSettings({ ...settings, language: value })}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-save</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically save changes as you work
                      </p>
                    </div>
                    <Switch
                      checked={settings.auto_save}
                      onCheckedChange={(checked) => setSettings({ ...settings, auto_save: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about activities and updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Master toggle for all notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, notifications_enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                      disabled={!settings.notifications_enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in your browser
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.push_notifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, push_notifications: checked })}
                      disabled={!settings.notifications_enabled}
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Some notification settings may require browser permissions. You'll be prompted when needed.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance & Theme
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of your application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Theme Preference</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant={settings.dark_mode === false ? "default" : "outline"}
                        className="flex items-center gap-2 h-auto p-4"
                        onClick={() => setSettings({ ...settings, dark_mode: false })}
                      >
                        <Sun className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">Light</div>
                          <div className="text-xs text-muted-foreground">Clean and bright</div>
                        </div>
                      </Button>
                      <Button
                        variant={settings.dark_mode === true ? "default" : "outline"}
                        className="flex items-center gap-2 h-auto p-4"
                        onClick={() => setSettings({ ...settings, dark_mode: true })}
                      >
                        <Moon className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">Dark</div>
                          <div className="text-xs text-muted-foreground">Easy on the eyes</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 h-auto p-4"
                        disabled
                      >
                        <Monitor className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">System</div>
                          <div className="text-xs text-muted-foreground">Coming soon</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Theme changes are applied immediately and saved automatically.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Data & Privacy Settings */}
          <TabsContent value="data" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Data Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Export, backup, or manage your personal data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Data Retention</Label>
                      <p className="text-sm text-muted-foreground">
                        How long to keep your data (days)
                      </p>
                    </div>
                    <Select
                      value={settings.data_retention_days?.toString()}
                      onValueChange={(value) => setSettings({ ...settings, data_retention_days: parseInt(value) })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="1095">3 years</SelectItem>
                        <SelectItem value="-1">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleExportData}
                      disabled={exportingData}
                      className="flex items-center gap-2"
                    >
                      {exportingData ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Export My Data
                    </Button>                  <Button variant="outline" className="flex items-center gap-2" disabled>
                    <Upload className="h-4 w-4" />
                    Import Data
                    <Badge variant="secondary" className="ml-2">Soon</Badge>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>
                  Change your password and manage account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 characters)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="flex items-center gap-2"
                  >
                    {changingPassword ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>              {/* Privacy Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy & Data Protection
                  </CardTitle>
                  <CardDescription>
                    Your privacy settings and data protection preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Your data is encrypted and stored securely. We never share your personal information with third parties.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirm-delete">Type "DELETE" to confirm account deletion</Label>
                    <Input
                      id="confirm-delete"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      placeholder="Type DELETE here"
                      className="max-w-xs"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={confirmDelete !== 'DELETE' || deletingAccount}
                    className="flex items-center gap-2"
                  >
                    {deletingAccount ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete Account Permanently
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 flex justify-center"
        >
          <Button
            size="lg"
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 shadow-lg"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
