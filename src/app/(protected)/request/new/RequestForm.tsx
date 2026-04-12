'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createRequestSchema, type CreateRequestInput } from '@/lib/validations/request';
import { createRequest } from '@/actions/requests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuccessScreen from './SuccessScreen';

interface RequestFormProps {
  userEmail: string;
}

export default function RequestForm({ userEmail }: RequestFormProps) {
  const [successRequestId, setSuccessRequestId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: { note: '' },
  });

  const noteValue = watch('note') ?? '';

  if (successRequestId) {
    return (
      <SuccessScreen
        requestId={successRequestId}
        onSendAnother={() => {
          setSuccessRequestId(null);
          reset();
        }}
      />
    );
  }

  async function onSubmit(data: CreateRequestInput) {
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
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>New Payment Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="request-form">
            <div className="space-y-1">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                placeholder="Email or US phone number"
                data-testid="recipient-input"
                {...register('recipient')}
              />
              {errors.recipient && (
                <p className="text-xs text-red-600" data-testid="recipient-error">
                  {errors.recipient.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                placeholder="0.00"
                inputMode="decimal"
                data-testid="amount-input"
                {...register('amount')}
              />
              {errors.amount && (
                <p className="text-xs text-red-600" data-testid="amount-error">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="note">Note (optional)</Label>
                <span
                  className={`text-xs ${noteValue.length > 280 ? 'text-red-600 font-medium' : 'text-gray-400'}`}
                  data-testid="note-counter"
                >
                  {noteValue.length}/280
                </span>
              </div>
              <textarea
                id="note"
                rows={3}
                placeholder="What is this request for?"
                data-testid="note-input"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                {...register('note')}
              />
              {errors.note && (
                <p className="text-xs text-red-600" data-testid="note-error">
                  {errors.note.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || noteValue.length > 280}
              data-testid="request-submit"
            >
              {isSubmitting ? 'Sending…' : 'Send Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
