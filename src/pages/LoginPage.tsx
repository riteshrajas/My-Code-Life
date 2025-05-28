// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import supabase  from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-xl rounded-lg">
        <h1 className="text-2xl font-bold text-center text-foreground">Login to My Life Code</h1>
        <p className="text-center text-muted-foreground">
          Login with Passkey (biometrics) or fallback credentials.<br />
          <span className="text-xs">Email: <b>testing@test.com</b> | Password: <b>test</b></span>
        </p>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-focus))' // Or a slightly darker/lighter shade of primary
                }
              }
            }
          }}
          providers={[]} // Passkeys are enabled by default if set up in Supabase
          // view="sign_in" // Can be 'sign_in' or 'sign_up'
          // magicLink // Enable if you want magic link login
          // showLinks={false} // Hide links to sign up / reset password if you want a cleaner UI
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
                button_label: 'Sign in',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: 'Already have an account? Sign in',
              },
              sign_up: {
                email_label: 'Email address',
                password_label: 'Password',
                button_label: 'Sign up',
                social_provider_text: 'Sign up with {{provider}}',
                link_text: 'Don\'t have an account? Sign up',
              },
              forgotten_password: {
                email_label: 'Email address',
                password_label: 'Password',
                button_label: 'Send reset instructions',
                link_text: 'Forgot your password?',
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;
