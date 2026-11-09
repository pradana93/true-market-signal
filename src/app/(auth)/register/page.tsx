import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { safeNext } from '@/lib/auth-errors';

export const metadata: Metadata = {
  title: 'Create account · True Market Signal',
  description: 'Create your free True Market Signal account',
};

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <AuthShell>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/40" />}>
        <RegisterForm next={next} />
      </Suspense>
    </AuthShell>
  );
}