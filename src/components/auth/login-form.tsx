'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/auth/password-input';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage } from '@/lib/auth-errors';

interface LoginFormProps {
  next: string;
  initialError?: string;
  initialMessage?: string;
}

export function LoginForm({ next, initialError, initialMessage }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(initialMessage ?? null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resent, setResent] = useState(false);

  const supabase = createClient();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    setNeedsConfirm(false);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(authErrorMessage(signInError.code, signInError.message));
      if (
        signInError.code === 'email_not_confirmed' ||
        signInError.message.toLowerCase().includes('email not confirmed')
      ) {
        setNeedsConfirm(true);
      }
      setPending(false);
      return;
    }

    // Full navigation so the new session cookie is sent with the request.
    window.location.assign(next);
  };

  const resend = async () => {
    setResent(false);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (resendError) {
      setError(authErrorMessage(resendError.code, resendError.message));
      return;
    }
    setResent(true);
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-h1">Welcome back</h1>
        <p className="mt-1.5 text-body-sm text-muted-foreground">
          Sign in to keep your watchlist, alerts and plan history in one place.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-body-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p>{error}</p>
            {needsConfirm ? (
              <button
                type="button"
                onClick={resend}
                disabled={resent || !email}
                className="mt-1.5 font-semibold underline underline-offset-4 disabled:no-underline disabled:opacity-60"
              >
                {resent ? 'Confirmation sent — check your inbox' : 'Resend confirmation email'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="mb-4 flex items-start gap-2 rounded-lg border border-brand/30 bg-brand/5 p-3 text-body-sm text-foreground"
        >
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
          <p>{notice}</p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
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

        <div>
          <PasswordInput
            id="login-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={pending}
          />
          <div className="mt-1.5 text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          disabled={pending || !email || !password}
          className="h-11 w-full bg-brand text-brand-foreground hover:opacity-90"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-muted-foreground">
        New here?{' '}
        <Link
          href={
            next !== '/dashboard'
              ? { pathname: '/register', query: { next } }
              : '/register'
          }
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          Create a free account
        </Link>
      </p>

      <p className="mt-5 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-brand" aria-hidden="true" />
        Free tier keeps working without an account — signing in just saves your setup.
      </p>
    </div>
  );
}
