// Test script to delete a user via the Supabase edge function
const userId = "b6c6b21a-340d-4816-b185-e9fa89286f49";
const userEmail = "code.ritesh@gmail.com";

// Supabase configuration
const supabaseUrl = 'https://tjpaxrhqikqlhhvbzzyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcGF4cmhxaWtxbGhodmJ6enl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODczMDMsImV4cCI6MjA2MzE2MzMwM30.MfNDGS-GnfQq6nVMZ_cCsOqMiQHRgYdtOU7oteGastI';

async function testDeleteUser() {
  try {
    console.log(`🚀 Testing user deletion for: ${userEmail} (${userId})`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`, // Using anon key for testing
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        userId,
        userEmail
      })
    });

    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error response: ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log('✅ Success response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error calling delete-user function:', error);
  }
}

// Run the test
testDeleteUser();
