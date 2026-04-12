'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { loginAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

interface LoginFormProps {
  returnUrl?: string;
}

export default function LoginForm({ returnUrl }: LoginFormProps) {
  const searchParams = useSearchParams();
  const effectiveReturnUrl = returnUrl ?? searchParams.get('returnUrl') ?? undefined;
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    setIsSubmitting(true);
    const formData = new FormData();
    formData.set('email', data.email);
    formData.set('password', data.password);
    if (effectiveReturnUrl) formData.set('returnUrl', effectiveReturnUrl);

    const result = await loginAction(formData);
    if (result?.error) {
      setServerError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
          {serverError && (
            <div
              className="rounded-md bg-red-50 p-3 text-sm text-red-700"
              data-testid="login-error"
            >
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              data-testid="login-email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-600" data-testid="email-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              data-testid="login-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-600" data-testid="password-error">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            data-testid="login-submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
