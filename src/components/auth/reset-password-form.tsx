'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/auth/password-input';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage } from '@/lib/auth-errors';
import type { User } from '@supabase/supabase-js';

const MIN_PASSWORD = 8;

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (active) setHasSession(Boolean(data.user));
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError(authErrorMessage(updateError.code, updateError.message));
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-h1">Password updated</h1>
        <p className="mt-1.5 text-body-sm text-muted-foreground">
          You are signed in on this device. Other devices keep their old session until it expires.
        </p>
        <Button
          onClick={() => window.location.assign('/dashboard')}
          className="mt-6 h-11 w-full bg-brand text-brand-foreground hover:opacity-90"
        >
          Go to the board
        </Button>
      </div>
    );
  }

  if (hasSession === false) {
    return (
      <div>
        <h1 className="text-h1">Link expired</h1>
        <p className="mt-1.5 text-body-sm text-muted-foreground">
          This reset link has already been used or has timed out. Request a fresh one and it will work.
        </p>
        <Button asChild className="mt-6 h-11 w-full bg-brand text-brand-foreground hover:opacity-90">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-h1">Choose a new password</h1>
        <p className="mt-1.5 text-body-sm text-muted-foreground">
          Pick something you have not used elsewhere. You stay signed in afterwards.
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
        <PasswordInput
          id="reset-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD} characters`}
          hint={`${MIN_PASSWORD}+ characters. A passphrase beats a clever word.`}
          disabled={pending}
        />
        <PasswordInput
          id="reset-confirm"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          placeholder="Repeat it"
          disabled={pending}
        />

        <Button
          type="submit"
          disabled={pending || !password || !confirm || hasSession === null}
          className="h-11 w-full bg-brand text-brand-foreground hover:opacity-90"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {pending ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </div>
  );
}
