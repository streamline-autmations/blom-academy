import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { debugLog } from '@/lib/debugLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    // The PASSWORD_RECOVERY event fires during AuthProvider initialization —
    // before this component even mounts — so we can never catch it here.
    //
    // Instead: check if Supabase already has a session (meaning the recovery
    // token was successfully exchanged). If yes, show the form immediately.
    // If not, listen for PASSWORD_RECOVERY / SIGNED_IN in case the user
    // arrived here before the exchange completed.

    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      debugLog('UpdatePassword: existing session check:', !!session);
      if (session) {
        setSessionReady(true);
      }
    };

    checkExistingSession();

    // Also listen in case the token exchange hasn't happened yet
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      debugLog('UpdatePassword auth event:', event);
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true);
      }
    });

    // Fallback: if after 5s we still have nothing, the link is invalid
    const fallback = setTimeout(() => {
      setSessionReady(prev => {
        if (!prev) {
          toast.error("Invalid or expired reset link. Please request a new one.");
          navigate('/forgot-password');
        }
        return prev;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigate]);

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully! Please log in with your new password.');
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bloom p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Update Your Password</CardTitle>
          <CardDescription>
            {sessionReady
              ? 'Enter a new password for your account.'
              : 'Verifying your reset link…'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sessionReady ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Updating…' : 'Update Password'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;
