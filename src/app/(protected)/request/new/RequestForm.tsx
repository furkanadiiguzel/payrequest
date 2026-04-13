'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createRequestSchema, type CreateRequestInput } from '@/lib/validations/request';
import { createRequest } from '@/actions/requests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PhoneInput from '@/components/PhoneInput';
import SuccessScreen from './SuccessScreen';

interface RequestFormProps {
  userEmail: string;
}

const PARTICLES = [
  { delay: '0ms',   left: '20%', color: 'oklch(0.61 0.22 264)' },
  { delay: '80ms',  left: '40%', color: 'oklch(0.70 0.20 264)' },
  { delay: '160ms', left: '60%', color: 'oklch(0.61 0.22 264)' },
  { delay: '40ms',  left: '80%', color: 'oklch(0.55 0.22 264)' },
  { delay: '120ms', left: '10%', color: 'oklch(0.70 0.20 264)' },
];

type RecipientMode = 'email' | 'phone';

export default function RequestForm({ userEmail }: RequestFormProps) {
  const [successRequestId, setSuccessRequestId] = useState<string | null>(null);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('email');

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: { note: '', recipient: '' },
  });

  function switchMode(mode: RecipientMode) {
    setRecipientMode(mode);
    setValue('recipient', '');
    clearErrors('recipient');
  }

  // Format amount to 2 decimal places on blur
  const amountRegistration = register('amount');
  function handleAmountBlur(e: React.FocusEvent<HTMLInputElement>) {
    const raw = e.target.value.trim();
    if (raw && /^\d+(\.\d*)?$/.test(raw)) {
      const n = parseFloat(raw);
      if (!isNaN(n)) setValue('amount', n.toFixed(2), { shouldValidate: false });
    }
    amountRegistration.onBlur(e);
  }

  const noteValue = watch('note') ?? '';

  if (successRequestId) {
    return (
      <SuccessScreen
        requestId={successRequestId}
        onSendAnother={() => {
          setSuccessRequestId(null);
          reset();
          setRecipientMode('email');
        }}
      />
    );
  }

  async function onSubmit(data: CreateRequestInput) {
    if (data.recipient.toLowerCase() === userEmail.toLowerCase()) {
      setError('recipient', { message: 'You cannot request money from yourself' });
      return;
    }

    const formData = new FormData();
    formData.set('recipient', data.recipient);
    formData.set('amount', data.amount);
    if (data.note) formData.set('note', data.note);

    try {
      const result = await createRequest(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSuccessRequestId(result.requestId);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="max-w-lg mx-auto" style={{ animation: 'slide-in-up 0.3s ease-out both' }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-primary">↗</span>
            New Payment Request
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Send a request to anyone via email or phone
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="request-form">

            {/* Recipient */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Recipient</Label>
                {/* Email / Phone toggle */}
                <div className="flex rounded-md border border-border overflow-hidden text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => switchMode('email')}
                    className={`px-3 py-1 transition-colors ${
                      recipientMode === 'email'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="recipient-mode-email"
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('phone')}
                    className={`px-3 py-1 transition-colors ${
                      recipientMode === 'phone'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="recipient-mode-phone"
                  >
                    Phone
                  </button>
                </div>
              </div>

              {recipientMode === 'email' ? (
                <Input
                  placeholder="recipient@example.com"
                  data-testid="request-recipient-input"
                  {...register('recipient')}
                />
              ) : (
                <Controller
                  name="recipient"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      testId="request-recipient"
                    />
                  )}
                />
              )}

              {errors.recipient && (
                <p className="text-xs text-destructive" data-testid="recipient-error">
                  {errors.recipient.message}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                  $
                </span>
                <Input
                  id="amount"
                  placeholder="0.00"
                  inputMode="decimal"
                  className="pl-7"
                  data-testid="request-amount-input"
                  {...amountRegistration}
                  onBlur={handleAmountBlur}
                  onChange={(e) => {
                    const val = e.target.value;
                    const dotIdx = val.indexOf('.');
                    if (dotIdx !== -1 && val.length - dotIdx > 3) {
                      e.target.value = val.slice(0, dotIdx + 3);
                    }
                    amountRegistration.onChange(e);
                  }}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive" data-testid="amount-error">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="note">Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <span
                  className={`text-xs tabular-nums transition-colors ${
                    noteValue.length > 260
                      ? noteValue.length > 280
                        ? 'text-destructive font-semibold'
                        : 'text-amber-400 font-medium'
                      : 'text-muted-foreground'
                  }`}
                  data-testid="note-counter"
                >
                  {noteValue.length}/280
                </span>
              </div>
              <textarea
                id="note"
                rows={3}
                placeholder="What is this request for?"
                data-testid="request-note-input"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-colors"
                {...register('note')}
              />
              {errors.note && (
                <p className="text-xs text-destructive" data-testid="note-error">
                  {errors.note.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="relative">
              {isSubmitting && (
                <div className="absolute inset-x-0 -top-1 flex justify-around pointer-events-none">
                  {PARTICLES.map((p, i) => (
                    <span
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{
                        left: p.left,
                        bottom: '0',
                        background: p.color,
                        animation: `particle-float 0.7s ease-out ${p.delay} forwards`,
                      }}
                    />
                  ))}
                </div>
              )}
              <Button
                type="submit"
                className="w-full relative overflow-hidden transition-all"
                disabled={isSubmitting || noteValue.length > 280}
                style={isSubmitting ? { animation: 'glow-pulse 1.2s ease-in-out infinite' } : undefined}
                data-testid="request-submit-button"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
                          style={{ animation: `particle-float 0.8s ease-in-out ${i * 150}ms infinite` }}
                        />
                      ))}
                    </span>
                    Sending…
                  </span>
                ) : (
                  'Send Request →'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
