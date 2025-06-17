import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authenticateFamilyMember } from '@/lib/familyService';

const FamilyLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const familyMember = localStorage.getItem('familyMember');
    if (familyMember) {
      navigate('/ritesh/profile');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const familyMember = await authenticateFamilyMember(username, password);
      
      if (familyMember) {
        // Store family member session
        localStorage.setItem('familyMember', JSON.stringify(familyMember));
        navigate('/ritesh/profile');
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-sm sm:max-w-md mx-auto my-4 sm:my-8">
        {/* Welcome Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-3 sm:mb-4">
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl sm:text-3xl font-bold">R</span>
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-2 sm:border-4 border-white flex items-center justify-center">
              <span className="text-white text-xs">👋</span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 px-2">Ritesh's Family Portal</h1>
          <p className="text-sm sm:text-base text-gray-600 px-2">Connect, chat, and stay in touch</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mx-2 sm:mx-0">
          <CardHeader className="text-center pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">
              Welcome Back!
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              Sign in to your family account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                  className="h-11 sm:h-12 text-base border-2 focus:border-purple-400 focus:ring-purple-200 transition-all duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="h-11 sm:h-12 text-base border-2 focus:border-purple-400 focus:ring-purple-200 transition-all duration-200"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 sm:h-13 text-base font-medium bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>🚀</span>
                    Sign In
                  </div>
                )}
              </Button>            </form>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Invited to join the family?{' '}
                <a href="/family/register" className="font-medium text-green-600 hover:text-green-500">
                  Create your family profile
                </a>
              </p>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
              <p className="text-sm text-gray-700 mb-3 font-medium flex items-center gap-2">
                <span>🎯</span>
                Demo Accounts:
              </p>
              <div className="text-xs text-gray-600 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-white rounded border hover:bg-gray-50 transition-colors">
                  <span className="font-medium">👧 Sister (Priya)</span>
                  <div className="flex flex-col sm:flex-row gap-1 mt-1 sm:mt-0">
                    <code className="bg-purple-100 px-2 py-1 rounded text-purple-700 text-xs">sister123</code>
                    <code className="bg-blue-100 px-2 py-1 rounded text-blue-700 text-xs">family123</code>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-white rounded border hover:bg-gray-50 transition-colors">
                  <span className="font-medium">👦 Brother (Arjun)</span>
                  <div className="flex flex-col sm:flex-row gap-1 mt-1 sm:mt-0">
                    <code className="bg-purple-100 px-2 py-1 rounded text-purple-700 text-xs">bro_cool</code>
                    <code className="bg-blue-100 px-2 py-1 rounded text-blue-700 text-xs">family123</code>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-white rounded border hover:bg-gray-50 transition-colors">
                  <span className="font-medium">👩 Cousin (Samira)</span>
                  <div className="flex flex-col sm:flex-row gap-1 mt-1 sm:mt-0">
                    <code className="bg-purple-100 px-2 py-1 rounded text-purple-700 text-xs">cousin_sam</code>
                    <code className="bg-blue-100 px-2 py-1 rounded text-blue-700 text-xs">family123</code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Mobile-friendly footer */}
        <div className="text-center mt-6 px-4">
          <p className="text-xs text-gray-500">
            Made with 💜 for family connections
          </p>
        </div>
      </div>
    </div>
  );
};

export default FamilyLoginPage;