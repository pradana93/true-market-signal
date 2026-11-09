'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/auth/password-input';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage } from '@/lib/auth-errors';

interface RegisterFormProps {
  next: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

export function RegisterForm({ next }: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const supabase = createClient();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const address = email.trim();
    if (!EMAIL_PATTERN.test(address)) {
      setError('That email address does not look right.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setPending(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: address,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: { full_name: fullName.trim() || null },
      },
    });

    if (signUpError) {
      setError(authErrorMessage(signUpError.code, signUpError.message));
      setPending(false);
      return;
    }

    // Supabase returns an obfuscated user with no identities when the address
    // is already taken; there is nothing to confirm in that case.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('That email already has an account. Sign in instead.');
      setPending(false);
      return;
    }

    // Email confirmations disabled → a session comes back, so just go in.
    if (data.session) {
      window.location.assign(next);
      return;
    }

    setSentTo(address);
    setPending(false);
  };

  const resend = async () => {
    if (!sentTo) return;
    setResending(true);
    setResent(false);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: sentTo,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setResending(false);
    if (resendError) {
      setError(authErrorMessage(resendError.code, resendError.message));
      return;
    }
    setResent(true);
  };

  if (sentTo) {
    return (
      <div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-h1">Confirm your email</h1>
        <p className="mt-1.5 text-body-sm text-muted-foreground">
          We sent a confirmation link to{' '}
          <span className="font-medium text-foreground">{sentTo}</span>. Open it on this device to finish setting
          up — the link is valid for 24 hours.
        </p>

        {error ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-body-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          <Button
            variant="outline"
            onClick={resend}
            disabled={resending}
            className="h-11 w-full"
          >
            {resending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {resent ? 'Sent again — check your inbox' : 'Resend confirmation email'}
          </Button>
          <Button asChild className="h-11 w-full bg-brand text-brand-foreground hover:opacity-90">
            <Link href="/login">
              Go to sign in
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-center text-body-sm text-muted-foreground">
          Wrong address?{' '}
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setResent(false);
              setError(null);
            }}
            className="font-semibold text-brand underline-offset-4 hover:underline"
          >
            Use a different one
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-h1">Create your account</h1>
        <p className="mt-1.5 text-body-sm text-muted-foreground">
          Free to start. No card, no cap on instruments — upgrade only when you want the sizing tools.
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
            {error.includes('already has an account') ? (
              <Link href="/login" className="mt-1 inline-block font-semibold underline underline-offset-4">
                Go to sign in
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="register-name">
            Name <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Alex Mercer"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={pending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
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

        <PasswordInput
          id="register-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint={`${MIN_PASSWORD}+ characters. A passphrase beats a clever word.`}
          disabled={pending}
        />

        <PasswordInput
          id="register-confirm"
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          placeholder="Repeat it"
          disabled={pending}
        />

        {confirm.length > 0 && password !== confirm ? (
          <p className="text-xs text-destructive">Passwords do not match yet.</p>
        ) : null}

        <Button
          type="submit"
          disabled={pending || !email || !password || !confirm}
          className="h-11 w-full bg-brand text-brand-foreground hover:opacity-90"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {pending ? 'Creating account…' : 'Create free account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
        By creating an account you agree to use the signals as research, not as financial advice.
      </p>
    </div>
  );
}
