'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage } from '@/lib/auth-errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const address = email.trim();
    if (!EMAIL_PATTERN.test(address)) {
      setError('That email address does not look right.');
      return;
    }

    setPending(true);
    const { error: sendError } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setPending(false);

    if (sendError) {
      setError(authErrorMessage(sendError.code, sendError.message));
      return;
    }

    // Supabase deliberately does not reveal whether the address exists.
    setSent(true);
  };

  if (sent) {
    return (
      <div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-h1">Check your inbox</h1>
        <p className="mt-1.5 text-body-sm text-muted-foreground">
          If <span className="font-medium text-foreground">{email.trim()}</span> has an account, a reset link is on
          its way. It works once and expires after an hour.
        </p>
        <Button asChild variant="outline" className="mt-6 h-11 w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-h1">Reset your password</h1>
        <p className="mt-1.5 text-body-sm text-muted-foreground">
          Enter the email you signed up with and we will send a one-time link.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-body-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@desk.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={pending}
          />
        </div>

        <Button
          type="submit"
          disabled={pending || !email}
          className="h-11 w-full bg-brand text-brand-foreground hover:opacity-90"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {pending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
