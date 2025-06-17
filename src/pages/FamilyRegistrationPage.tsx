import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import supabase from '@/lib/supabaseClient';
import { registerFamilyMember, FamilyMemberRegistrationData } from '@/lib/familyService';

const FamilyRegistrationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const navigate = useNavigate();

  // Get contact ID and pre-fill data if coming from contact invitation
  const contactId = searchParams.get('contactId');
  const inviteToken = searchParams.get('token');

  useEffect(() => {
    if (contactId) {
      // Pre-fill data from contact
      loadContactInfo(contactId);
    }
    
    // Pre-fill name if provided in URL
    const nameParam = searchParams.get('name');
    if (nameParam) {
      setName(nameParam);
    }
  }, [contactId, searchParams]);

  const loadContactInfo = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading contact:', error);
        return;
      }

      setContactInfo(data);
      if (data.name) setName(data.name);
    } catch (error) {
      console.error('Error loading contact info:', error);
    }  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!name || !relationship || !username) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const registrationData: FamilyMemberRegistrationData = {
        username,
        name,
        relationship,
        contact_id: contactId || undefined,
        grade: grade || undefined,
        age: age ? parseInt(age) : undefined,
        school: school || undefined,
        bio: bio || undefined,
      };
      
      const result = await registerFamilyMember(registrationData, password);
      
      if (result.success && result.familyMember) {
        toast({
          title: 'Registration Successful! 🎉',
          description: `Welcome to the family, ${result.familyMember.name}! You can now log in.`,
        });
        
        // Redirect to login page
        navigate('/ritesh');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-100 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-sm sm:max-w-lg mx-auto my-4 sm:my-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-3 sm:mb-4">
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl sm:text-3xl font-bold">🎉</span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 px-2">
            Join Ritesh's Family Portal
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            {contactInfo ? `Hi ${contactInfo.name}! ` : ''}Create your profile to connect with the family
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mx-2 sm:mx-0">
          <CardHeader className="text-center pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">
              Create Your Family Profile
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              Fill in your details below to join the family network
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Your Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Aunt Maya Sharma"
                  required
                  disabled={loading}
                  className="h-11 sm:h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship" className="text-sm font-medium">Your Relationship to Ritesh *</Label>
                <Select 
                  onValueChange={setRelationship} 
                  value={relationship}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11 sm:h-12 text-base">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sister">Sister</SelectItem>
                    <SelectItem value="brother">Brother</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="aunt">Aunt</SelectItem>
                    <SelectItem value="uncle">Uncle</SelectItem>
                    <SelectItem value="cousin">Cousin</SelectItem>
                    <SelectItem value="grandmother">Grandmother</SelectItem>
                    <SelectItem value="grandfather">Grandfather</SelectItem>
                    <SelectItem value="friend">Family Friend</SelectItem>
                    <SelectItem value="neighbor">Neighbor</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Choose a Username *</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g., maya_aunt"
                  required
                  disabled={loading}
                  className="h-11 sm:h-12 text-base"
                />
                <p className="text-xs text-gray-500">Only lowercase letters, numbers, and underscores allowed</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-medium">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    disabled={loading}
                    className="h-11 sm:h-12 text-base"
                    min="1"
                    max="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-sm font-medium">Grade/Class</Label>
                  <Input
                    id="grade"
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g., 12th Grade, College, Working"
                    disabled={loading}
                    className="h-11 sm:h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school" className="text-sm font-medium">School/College/Work</Label>
                <Input
                  id="school"
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g., Delhi University, Microsoft, Freelancer"
                  disabled={loading}
                  className="h-11 sm:h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Create Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  disabled={loading}
                  className="h-11 sm:h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                  className="h-11 sm:h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">Tell us about yourself</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your hobbies, interests, or anything you'd like the family to know..."
                  disabled={loading}
                  className="text-base resize-none"
                  rows={3}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 sm:h-13 text-base font-medium bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Profile...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>✨</span>
                    Create My Family Profile
                  </div>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <a href="/ritesh" className="font-medium text-green-600 hover:text-green-500">
                  Sign In
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 px-4">
          <p className="text-xs text-gray-500">
            🏡 Connecting families, one profile at a time 💚
          </p>
        </div>
      </div>
    </div>
  );
};

export default FamilyRegistrationPage;
