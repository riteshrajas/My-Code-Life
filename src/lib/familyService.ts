import supabase from './supabaseClient';
import { sendCallRequestEmail, sendStatusUpdateEmail, sendGoodVibesEmail } from './emailService';

// Replace with actual Ritesh's user ID from Supabase auth
const RITESH_USER_ID = 'your-user-id-here'; // TODO: Replace with actual user ID

export interface FamilyMember {
  id: string;
  username: string;
  name: string;
  profile_picture_url?: string;
  grade?: string;
  age?: number;
  school?: string;
  hobbies?: string[];
  favorite_color?: string;
  bio?: string;
  relationship: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface FamilyMemberStatus {
  id: string;
  family_member_id: string;
  status: 'available' | 'busy' | 'do_not_disturb';
  status_message?: string;
  updated_at: string;
}

export interface CallRequest {
  id: string;
  from_family_member_id: string;
  to_user_id: string;
  requested_time: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  created_at: string;
  updated_at: string;
}

// Registration interface
export interface FamilyMemberRegistrationData {
  username: string;
  name: string;
  relationship: string;
  contact_id?: string;
  grade?: string;
  age?: number;
  school?: string;
  hobbies?: string[];
  bio?: string;
}

// Family member authentication
export async function authenticateFamilyMember(
  username: string, 
  password: string
): Promise<FamilyMember | null> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Authentication error:', error);
      return null;
    }    // In a real app, you'd verify the password hash here
    // For now, we'll do a simple comparison (you should implement proper bcrypt)
    // const isValidPassword = await bcrypt.compare(password, data.password_hash);
    
    // For demo purposes, let's use simple password check that matches our registration
    // This checks if the password matches our simple hashing scheme
    const expectedHash = `hashed_${password}`;
    const isValidPassword = data.password_hash === expectedHash || password === 'family123'; // Keep demo accounts working
    
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await supabase
      .from('family_members')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Get family member by ID
export async function getFamilyMember(id: string): Promise<FamilyMember | null> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching family member:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching family member:', error);
    return null;
  }
}

// Get all family members
export async function getAllFamilyMembers(): Promise<FamilyMember[]> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching family members:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching family members:', error);
    return [];
  }
}

// Get family member status
export async function getFamilyMemberStatus(familyMemberId: string): Promise<FamilyMemberStatus | null> {
  try {
    const { data, error } = await supabase
      .from('family_member_status')
      .select('*')
      .eq('family_member_id', familyMemberId)
      .single();

    if (error) {
      console.error('Error fetching status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching status:', error);
    return null;
  }
}

// Update family member status
export async function updateFamilyMemberStatus(
  familyMemberId: string,
  status: 'available' | 'busy' | 'do_not_disturb',
  statusMessage?: string
): Promise<boolean> {
  try {
    // Get family member info for email notification
    const familyMember = await getFamilyMember(familyMemberId);
    
    const { error } = await supabase
      .from('family_member_status')
      .upsert({
        family_member_id: familyMemberId,
        status,
        status_message: statusMessage,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating status:', error);
      return false;
    }

    // Send email notification to Ritesh
    if (familyMember) {
      await sendStatusUpdateEmail(familyMember.name, status, statusMessage);
    }

    return true;
  } catch (error) {
    console.error('Error updating status:', error);
    return false;
  }
}

// Get Ritesh's status (you'll need to implement this based on your user system)
export async function getRiteshStatus(): Promise<{ status: string; message?: string }> {
  // This is a placeholder - you can implement this based on your main user system
  // For now, return a mock status
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 9 && hour <= 17) {
    return { status: 'busy', message: 'Working hours - might be busy' };
  } else if (hour >= 22 || hour <= 6) {
    return { status: 'do_not_disturb', message: 'Sleeping time' };
  } else {
    return { status: 'available', message: 'Available for calls' };
  }
}

// Create call request
export async function createCallRequest(
  fromFamilyMemberId: string,
  requestedTime: Date,
  message?: string
): Promise<boolean> {
  try {
    // Get Ritesh's user ID (you'll need to replace this with the actual user ID)
    const RITESH_USER_ID = 'your-user-id-here'; // Replace with actual user ID
    
    // Get family member info for email notification
    const familyMember = await getFamilyMember(fromFamilyMemberId);
    
    const { error } = await supabase
      .from('call_requests')
      .insert({
        from_family_member_id: fromFamilyMemberId,
        to_user_id: RITESH_USER_ID,
        requested_time: requestedTime.toISOString(),
        message,
        status: 'pending'
      });

    if (error) {
      console.error('Error creating call request:', error);
      return false;
    }

    // Send email notification to Ritesh
    if (familyMember) {
      await sendCallRequestEmail(
        familyMember.name,
        requestedTime,
        message,
        familyMember.relationship
      );
    }

    return true;
  } catch (error) {
    console.error('Error creating call request:', error);
    return false;
  }
}

// Get call requests for a family member
export async function getCallRequestsForFamilyMember(familyMemberId: string): Promise<CallRequest[]> {
  try {
    const { data, error } = await supabase
      .from('call_requests')
      .select('*')
      .eq('from_family_member_id', familyMemberId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching call requests:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching call requests:', error);
    return [];
  }
}

// Update family member profile
export async function updateFamilyMemberProfile(
  familyMemberId: string,
  updates: Partial<FamilyMember>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('family_members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', familyMemberId);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}

// Send quick message (you can extend this to integrate with a messaging system)
export async function sendQuickMessage(
  fromFamilyMemberId: string,
  message: string
): Promise<boolean> {
  try {
    // For now, we'll create a call request with immediate time as a "message"
    const { error } = await supabase
      .from('call_requests')
      .insert({
        from_family_member_id: fromFamilyMemberId,
        to_user_id: RITESH_USER_ID,
        requested_time: new Date().toISOString(),
        message: `📱 Quick Message: ${message}`,
        status: 'pending'
      });

    if (error) {
      console.error('Error sending quick message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending quick message:', error);
    return false;
  }
}

// Get family member statistics
export async function getFamilyMemberStats(familyMemberId: string) {
  try {
    const { data: callRequests, error: callError } = await supabase
      .from('call_requests')
      .select('*')
      .eq('from_family_member_id', familyMemberId);

    if (callError) {
      console.error('Error fetching stats:', callError);
      return null;
    }

    const totalCalls = callRequests?.length || 0;
    const acceptedCalls = callRequests?.filter(r => r.status === 'accepted').length || 0;
    const completedCalls = callRequests?.filter(r => r.status === 'completed').length || 0;

    return {
      totalCallRequests: totalCalls,
      acceptedCalls,
      completedCalls,
      responseRate: totalCalls > 0 ? Math.round((acceptedCalls / totalCalls) * 100) : 0
    };
  } catch (error) {
    console.error('Error fetching family member stats:', error);
    return null;
  }
}

// Send good vibes/reaction
export async function sendGoodVibes(
  fromFamilyMemberId: string,
  vibeType: string = '✨'
): Promise<boolean> {
  try {
    const vibeMessages = {
      '✨': 'Sending you some sparkles and good energy!',
      '❤️': 'Sending love your way!',
      '🎉': 'Hope you\'re having an amazing day!',
      '🌟': 'You\'re a star! Keep shining!',
      '🤗': 'Sending you a big virtual hug!',
      '💪': 'You\'ve got this! Believe in yourself!'
    };

    const message = vibeMessages[vibeType as keyof typeof vibeMessages] || vibeMessages['✨'];

    const { error } = await supabase
      .from('call_requests')
      .insert({
        from_family_member_id: fromFamilyMemberId,
        to_user_id: RITESH_USER_ID,
        requested_time: new Date().toISOString(),
        message: `${vibeType} ${message}`,
        status: 'pending'
      });

    if (error) {
      console.error('Error sending good vibes:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending good vibes:', error);
    return false;
  }
}

// Register new family member
export async function registerFamilyMember(
  data: FamilyMemberRegistrationData,
  passwordPlainText: string
): Promise<{ success: boolean; error?: string; familyMember?: FamilyMember }> {
  try {
    // Simple password hashing (in production, use proper bcrypt)
    const password_hash = `hashed_${passwordPlainText}`;

    const { data: newMember, error } = await supabase
      .from('family_members')
      .insert({
        username: data.username,
        password_hash,
        name: data.name,
        relationship: data.relationship,
        grade: data.grade,
        age: data.age,
        school: data.school,
        bio: data.bio,
        hobbies: data.hobbies || [],
        is_active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Username already taken. Please choose a different one.' };
      }
      return { success: false, error: error.message };
    }

    // Create default status for the family member
    await supabase
      .from('family_member_status')
      .insert({
        family_member_id: newMember.id,
        status: 'available',
        status_message: 'Just joined the family portal!'
      });

    // If this registration is linked to a contact, update the contact
    if (data.contact_id) {
      await supabase
        .from('contacts')
        .update({
          family_member_id: newMember.id,
          family_access_enabled: true
        })
        .eq('id', data.contact_id);
    }

    return { success: true, familyMember: newMember };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'An unexpected error occurred during registration.' };
  }
}
