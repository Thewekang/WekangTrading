'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { LoginInput, loginSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    // Check database connection on mount
    fetch('/api/debug/db-status')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(err => setDbStatus({ status: 'error', error: err.message }));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        // Fetch session to check role
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        // Redirect based on role
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin/overview');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <span className="text-4xl">🏍️💰</span>
        </div>
        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your WekangTradingJournal account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Database Status Debug Info */}
          {dbStatus && (
            <div className={`p-3 rounded-md text-xs font-mono ${
              dbStatus.status === 'connected' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="font-bold mb-2">🔍 Database Debug Info:</div>
              <div className="space-y-1">
                <div>Status: <span className={dbStatus.database_working ? 'text-green-600' : 'text-red-600'}>
                  {dbStatus.database_working ? '✅ Connected' : '❌ Failed'}
                </span></div>
                {dbStatus.total_users !== undefined && (
                  <div>Total Users: {dbStatus.total_users}</div>
                )}
                {dbStatus.admin_exists !== undefined && (
                  <div>Admin Exists: {dbStatus.admin_exists ? '✅ Yes' : '❌ No'}</div>
                )}
                {dbStatus.admin_details && (
                  <div className="text-[10px] mt-1">
                    Admin: {dbStatus.admin_details.email} ({dbStatus.admin_details.role})
                  </div>
                )}
                {dbStatus.error && (
                  <div className="text-red-600 mt-1">Error: {dbStatus.error}</div>
                )}
                {dbStatus.env && (
                  <div className="text-[10px] mt-2 pt-2 border-t border-gray-300">
                    <div>DB URL: {dbStatus.env.DATABASE_URL_set ? '✅ Set' : '❌ Missing'}</div>
                    <div>NEXTAUTH_URL: {dbStatus.env.NEXTAUTH_URL || 'Not set'}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
