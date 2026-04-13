'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { signupAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PhoneInput from '@/components/PhoneInput';
import { useState } from 'react';

export default function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { phone: '' },
  });

  async function onSubmit(data: SignupInput) {
    setServerError(null);
    setIsSubmitting(true);
    const formData = new FormData();
    formData.set('email', data.email);
    formData.set('password', data.password);
    formData.set('phone', data.phone);

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
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
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
              data-testid="signup-email-input"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive" data-testid="email-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Phone number</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  testId="signup-phone"
                />
              )}
            />
            {errors.phone && (
              <p className="text-xs text-destructive" data-testid="phone-error">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">
              Password{' '}
              <span className="text-xs text-muted-foreground">(min 6 characters)</span>
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              data-testid="signup-password-input"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive" data-testid="password-error">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            data-testid="signup-submit-button"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
