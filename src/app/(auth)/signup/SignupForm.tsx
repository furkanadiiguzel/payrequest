'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { signupAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupInput) {
    setServerError(null);
    setIsSubmitting(true);
    const formData = new FormData();
    formData.set('email', data.email);
    formData.set('password', data.password);

    const result = await signupAction(formData);
    if (result?.error) {
      setServerError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="signup-form">
          {serverError && (
            <div
              className="rounded-md bg-red-50 p-3 text-sm text-red-700"
              data-testid="signup-error"
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
              data-testid="signup-email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-600" data-testid="email-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">
              Password{' '}
              <span className="text-xs text-gray-400">(min 6 characters)</span>
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              data-testid="signup-password"
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
            data-testid="signup-submit"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
