import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { safeNext } from '@/lib/auth-errors';

export const metadata: Metadata = {
  title: 'Sign in · True Market Signal',
  description: 'Sign in to your True Market Signal account',
};

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <AuthShell>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/40" />}>
        <LoginForm next={next} initialError={params.error} initialMessage={params.message} />
      </Suspense>
    </AuthShell>
  );
}
