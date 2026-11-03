import { useIsMobile } from '@/hooks/use-mobile';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '@/lib/supabase';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { hardResetAuth } from '@/utils/hardResetAuth';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Login = () => {
  const isMobile = useIsMobile();
  const heroImage = isMobile ? '/hero-mobile-3.webp' : '/hero-desktop-3.webp';
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const mode = searchParams.get('mode');

  const { session, loading } = useAuth();

  // Custom sign-in form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Handle hard reset
  useEffect(() => {
    if (new URL(location.href).searchParams.get("reset") === "1") {
      hardResetAuth();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bloom">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    if (inviteToken) {
      return <Navigate to={`/accept-invite?invite=${inviteToken}`} replace />;
    }
    return <Navigate to="/home" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setIsSigningIn(false);
      return;
    }

    // If "remember me" is NOT checked, clear the persisted session from
    // localStorage so the browser won't restore it after the tab is closed.
    if (!rememberMe) {
      const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (storageKey) {
        const token = localStorage.getItem(storageKey);
        localStorage.removeItem(storageKey);
        if (token) sessionStorage.setItem(storageKey, token);
      }
    }

    // Navigation handled by AuthProvider session change
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `url('${heroImage}')` }}
    >
      <div className="absolute inset-0 bg-bloom opacity-50" />

      <div className="relative z-10 flex flex-col items-center w-full">
        <img src="/blom-academy.png" alt="BLOM Academy Logo" className="w-40 mb-8" />

        <div className="w-full max-w-md bg-white/80 dark:bg-card/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ink tracking-tight">Welcome Back</h1>
            <p className="text-body-text mt-1">Please sign in to your account.</p>
          </div>

          {mode === 'signup' ? (
            // Sign-up mode: keep the Supabase Auth UI
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(340 95% 70%)',
                      brandAccent: 'hsl(340 95% 60%)',
                    },
                    radii: {
                      inputBorderRadius: '1rem',
                      buttonBorderRadius: '9999px',
                    }
                  },
                },
              }}
              providers={[]}
              theme="light"
              view="sign_up"
              showLinks={false}
              redirectTo={inviteToken ? `${window.location.origin}/accept-invite?invite=${inviteToken}` : `${window.location.origin}/account-setup`}
              localization={{
                variables: {
                  sign_up: {
                    email_label: 'Email Address',
                    password_label: 'Password',
                  },
                },
              }}
            />
          ) : (
            // Sign-in mode: custom form with Remember Me
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="rounded-2xl"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={checked => setRememberMe(checked === true)}
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full rounded-full"
                disabled={isSigningIn}
              >
                {isSigningIn ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          )}

          <div className="text-center text-sm">
            <Link to="/forgot-password" className="underline text-body-text/80 hover:text-primary">
              Forgot your password?
            </Link>
          </div>
          <div className="text-center text-sm text-body-text/80">
            By signing in, you agree to our{' '}
            <Link to="/terms" target="_blank" className="underline hover:text-primary">
              Terms & Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" className="underline hover:text-primary">
              Privacy Policy
            </Link>
            .
          </div>
          <div className="text-center mt-4">
            <button
              onClick={() => hardResetAuth()}
              className="text-xs text-gray-500 underline hover:text-gray-700"
              type="button"
            >
              Having trouble? Reset login state
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
