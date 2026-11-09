import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Reset password · True Market Signal',
  description: 'Request a password reset link for your True Market Signal account',
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/40" />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}