import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Calendar, Phone, MessageCircle, LogOut, Settings, Heart, Book, Palette } from 'lucide-react';
import { 
  FamilyMember, 
  FamilyMemberStatus, 
  getRiteshStatus, 
  getFamilyMemberStatus,
  updateFamilyMemberStatus,
  createCallRequest,
  getCallRequestsForFamilyMember,
  CallRequest
} from '@/lib/familyService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const FamilyProfilePage: React.FC = () => {
  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null);
  const [memberStatus, setMemberStatus] = useState<FamilyMemberStatus | null>(null);
  const [riteshStatus, setRiteshStatus] = useState<{ status: string; message?: string }>({ status: 'available' });
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callMessage, setCallMessage] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get family member from localStorage
    const storedMember = localStorage.getItem('familyMember');
    if (!storedMember) {
      navigate('/ritesh');
      return;
    }

    const member = JSON.parse(storedMember);
    setFamilyMember(member);
    
    // Load data
    loadMemberStatus(member.id);
    loadRiteshStatus();
    loadCallRequests(member.id);
  }, [navigate]);

  const loadMemberStatus = async (memberId: string) => {
    const status = await getFamilyMemberStatus(memberId);
    setMemberStatus(status);
  };

  const loadRiteshStatus = async () => {
    const status = await getRiteshStatus();
    setRiteshStatus(status);
  };

  const loadCallRequests = async (memberId: string) => {
    const requests = await getCallRequestsForFamilyMember(memberId);
    setCallRequests(requests);
  };

  const handleLogout = () => {
    localStorage.removeItem('familyMember');
    navigate('/ritesh');
  };

  const handleStatusChange = async (newStatus: 'available' | 'busy' | 'do_not_disturb') => {
    if (!familyMember) return;
    
    const success = await updateFamilyMemberStatus(familyMember.id, newStatus);
    if (success) {
      loadMemberStatus(familyMember.id);
      toast({
        title: 'Status Updated',
        description: 'Your status has been updated successfully.',
      });
    }
  };

  const handleScheduleCall = async () => {
    if (!familyMember || !selectedDateTime) return;

    const requestedTime = new Date(selectedDateTime);
    const success = await createCallRequest(familyMember.id, requestedTime, callMessage);
    
    if (success) {
      setShowCallDialog(false);
      setCallMessage('');
      setSelectedDateTime('');
      loadCallRequests(familyMember.id);
      toast({
        title: 'Call Request Sent!',
        description: 'Ritesh will be notified of your call request.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to send call request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'do_not_disturb': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'busy': return 'Busy';
      case 'do_not_disturb': return 'Do Not Disturb';
      default: return 'Unknown';
    }
  };

  if (!familyMember) {
    return <div>Loading...</div>;
  }  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-2 sm:p-4 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-4">
        {/* Header with better design */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg space-y-3 sm:space-y-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg sm:text-2xl font-bold">{familyMember.name.charAt(0)}</span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 sm:border-3 border-white ${getStatusColor(memberStatus?.status || 'available')}`}></div>
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Welcome back, {familyMember.name}! 👋</h1>
              <p className="text-sm sm:text-base text-gray-600 capitalize">Family member • {familyMember.relationship}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all text-sm sm:text-base self-start sm:self-auto">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Enhanced Profile Card */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-3 sm:ring-4 ring-white shadow-lg">
                    {familyMember.profile_picture_url ? (
                      <img 
                        src={familyMember.profile_picture_url} 
                        alt={familyMember.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg sm:text-xl rounded-full">
                        {familyMember.name.charAt(0)}
                      </div>
                    )}
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 sm:border-3 border-white ${getStatusColor(memberStatus?.status || 'available')}`}></div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{familyMember.name}</h2>
                  <p className="text-xs sm:text-sm text-gray-600 capitalize flex items-center gap-2">
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                    {familyMember.relationship} in the family
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Academic Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-100">
                  <Label className="text-xs sm:text-sm font-medium text-purple-600 flex items-center gap-2">
                    <Book className="w-3 h-3 sm:w-4 sm:h-4" />
                    Grade
                  </Label>
                  <p className="text-lg sm:text-xl font-bold text-purple-900">{familyMember.grade || 'Not specified'}</p>
                </div>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                  <Label className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    Age
                  </Label>
                  <p className="text-lg sm:text-xl font-bold text-blue-900">{familyMember.age || 'Not specified'} years</p>
                </div>
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-100 sm:col-span-2 lg:col-span-1">
                  <Label className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-2">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                    Your Status
                  </Label>
                  <Select 
                    value={memberStatus?.status || 'available'} 
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-full mt-2 bg-white border-green-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">🟢 Available</SelectItem>
                      <SelectItem value="busy">🟡 Busy</SelectItem>
                      <SelectItem value="do_not_disturb">🔴 Do Not Disturb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {familyMember.school && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
                  <Label className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Book className="w-3 h-3 sm:w-4 sm:h-4" />
                    School
                  </Label>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">{familyMember.school}</p>
                </div>
              )}

              {familyMember.bio && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 sm:p-4 rounded-lg border border-purple-100">
                  <Label className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    About Me
                  </Label>
                  <p className="text-sm sm:text-base text-gray-700 mt-2 leading-relaxed">{familyMember.bio}</p>
                </div>
              )}

              {familyMember.hobbies && familyMember.hobbies.length > 0 && (
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2 mb-2 sm:mb-3">
                    <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                    My Hobbies & Interests
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {familyMember.hobbies.map((hobby, index) => (
                      <Badge key={`${hobby}-${index}`} variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                        <Heart className="w-2 h-2 sm:w-3 sm:h-3" />
                        {hobby}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>          {/* Enhanced Ritesh Status & Actions Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Ritesh Status Card */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg p-3 sm:p-4">
                <CardTitle className="flex items-center gap-2 sm:gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 sm:ring-3 ring-white shadow-lg">
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm sm:text-base rounded-full">
                        R
                      </div>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${getStatusColor(riteshStatus.status)}`}></div>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Ritesh</h3>
                    <p className="text-xs text-gray-600">Your brother</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Badge className={`${getStatusColor(riteshStatus.status)} text-white px-2 sm:px-3 py-1 text-xs`}>
                      {getStatusText(riteshStatus.status)}
                    </Badge>
                    <div className="text-xs text-gray-600">
                      {riteshStatus.status === 'available' && <span className="text-green-600">✓ Ready to chat!</span>}
                      {riteshStatus.status === 'busy' && <span className="text-yellow-600">⏰ May respond later</span>}
                      {riteshStatus.status === 'do_not_disturb' && <span className="text-red-600">🔕 Please don't disturb</span>}
                    </div>
                  </div>
                  {riteshStatus.message && (
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border">
                      <p className="text-xs sm:text-sm text-gray-700 italic">"{riteshStatus.message}"</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg p-3 sm:p-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-xs sm:text-sm h-8 sm:h-10"
                      disabled={riteshStatus.status === 'do_not_disturb'}
                    >
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                      {riteshStatus.status === 'do_not_disturb' ? 'Ritesh is unavailable' : 'Schedule Call'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm sm:max-w-md mx-2">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        Schedule a Call with Ritesh
                      </DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm">
                        Choose a time and add a message for your call request. Ritesh will get notified instantly!
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Label htmlFor="datetime" className="flex items-center gap-2 text-xs sm:text-sm">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          Preferred Date & Time
                        </Label>
                        <Input
                          id="datetime"
                          type="datetime-local"
                          value={selectedDateTime}
                          onChange={(e) => setSelectedDateTime(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className="mt-2 text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="message" className="flex items-center gap-2 text-xs sm:text-sm">
                          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          Message (Optional)
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="What would you like to talk about? (e.g., homework help, chat about games, etc.)"
                          value={callMessage}
                          onChange={(e) => setCallMessage(e.target.value)}
                          className="mt-2 text-xs sm:text-sm"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleScheduleCall} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-xs sm:text-sm h-8 sm:h-10">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Send Call Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full flex items-center gap-2 hover:bg-blue-50 border-blue-200 text-blue-700 text-xs sm:text-sm h-8 sm:h-10">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  Send Quick Message
                </Button>
                
                <Button variant="outline" className="w-full flex items-center gap-2 hover:bg-purple-50 border-purple-200 text-purple-700 text-xs sm:text-sm h-8 sm:h-10">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  View Family Calendar
                </Button>

                <Button variant="outline" className="w-full flex items-center gap-2 hover:bg-orange-50 border-orange-200 text-orange-700 text-xs sm:text-sm h-8 sm:h-10">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                  Send Good Vibes ✨
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced Call Requests History */}
            {callRequests.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg p-3 sm:p-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    Recent Call Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {callRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-medium">{new Date(request.requested_time).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">{new Date(request.requested_time).toLocaleTimeString()}</span>
                        </div>
                        <Badge variant={
                          request.status === 'pending' ? 'default' :
                          request.status === 'accepted' ? 'secondary' :
                          request.status === 'declined' ? 'destructive' : 'outline'
                        } className="capitalize text-xs">
                          {request.status === 'pending' && '⏳'}
                          {request.status === 'accepted' && '✅'}
                          {request.status === 'declined' && '❌'}
                          {request.status === 'completed' && '🎉'}
                          {' ' + request.status}
                        </Badge>
                      </div>
                    ))}
                    {callRequests.length > 3 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        And {callRequests.length - 3} more requests...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Family Stats Card */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg p-3 sm:p-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  Family Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3 text-center">
                  <div className="text-2xl sm:text-3xl">🏠</div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    You've been connected as family for{' '}
                    <span className="font-bold text-purple-600">
                      {Math.floor((new Date().getTime() - new Date(familyMember.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </p>
                  <div className="flex justify-center gap-1 sm:gap-2 text-base sm:text-lg">
                    💜 💙 💚 💛 🧡
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyProfilePage;
