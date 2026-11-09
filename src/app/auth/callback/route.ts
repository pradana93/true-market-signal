import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createAuthClient } from '@/lib/supabase/auth';

/**
 * Landing route for every Supabase email link (sign-up confirmation, magic
 * link, password recovery). It exchanges the token for a cookie session and
 * then forwards to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const nextParam = searchParams.get('next') ?? '/dashboard';
  // Only same-origin paths: an open redirect here would leak the session.
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';

  const supabase = await createAuthClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (tokenHash && type) {
    // Older email templates link with token_hash instead of a PKCE code.
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(
    new URL('/login?error=That%20link%20is%20invalid%20or%20has%20expired.%20Request%20a%20new%20one.', origin)
  );
}
