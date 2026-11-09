import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'New password · True Market Signal',
  description: 'Set a new password for your True Market Signal account',
};

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/40" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}