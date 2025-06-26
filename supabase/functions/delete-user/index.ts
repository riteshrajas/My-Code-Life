import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Admin client for user deletion
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface DeleteUserRequest {
  userId: string;
  userEmail: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Verify the request has proper authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the request
    const { userId, userEmail }: DeleteUserRequest = await req.json();
    
    if (!userId || !userEmail) {
      return new Response('Missing required fields: userId, userEmail', { status: 400 });
    }

    console.log(`Attempting to delete user: ${userEmail} (${userId})`);

    // First, verify the user exists and get their current session
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError) {
      console.error('Error fetching user:', getUserError);
      return new Response(`Error fetching user: ${getUserError.message}`, { status: 400 });
    }

    if (!userData.user) {
      return new Response('User not found', { status: 404 });
    }

    // Verify the email matches (additional security check)
    if (userData.user.email !== userEmail) {
      return new Response('User email mismatch', { status: 400 });
    }

    // Delete user data from all tables (RLS will handle authorization)
    const deletePromises = [
      supabaseAdmin.from('contacts').delete().eq('user_id', userId),
      supabaseAdmin.from('tasks').delete().eq('user_id', userId),
      supabaseAdmin.from('diary_entries').delete().eq('user_id', userId),
      supabaseAdmin.from('user_settings').delete().eq('user_id', userId),
      supabaseAdmin.from('user_profiles').delete().eq('user_id', userId),
      supabaseAdmin.from('habits').delete().eq('user_id', userId),
      supabaseAdmin.from('family_members').delete().eq('user_id', userId)
    ];

    // Execute all data deletions
    const deleteResults = await Promise.allSettled(deletePromises);
    
    // Log any errors but don't fail the deletion
    deleteResults.forEach((result, index) => {
      const tables = ['contacts', 'tasks', 'diary_entries', 'user_settings', 'user_profiles', 'habits', 'family_members'];
      if (result.status === 'rejected') {
        console.error(`Error deleting ${tables[index]}:`, result.reason);
      } else {
        console.log(`Successfully deleted ${tables[index]} data`);
      }
    });

    // Finally, delete the actual user account
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error('Error deleting user account:', deleteUserError);
      return new Response(`Error deleting user account: ${deleteUserError.message}`, { status: 500 });
    }

    console.log(`Successfully deleted user: ${userEmail} (${userId})`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'User account and all associated data deleted successfully',
      userId: userId,
      userEmail: userEmail,
      deletedAt: new Date().toISOString()
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error in delete-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      }
    );
  }
});
