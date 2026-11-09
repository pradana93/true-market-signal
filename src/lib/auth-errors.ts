/**
 * Supabase auth errors are written for developers. These turn the ones a
 * trader can actually hit into something they can act on, and leave anything
 * unexpected intact rather than swallowing it.
 */
export function authErrorMessage(code: string | undefined, message: string): string {
  switch (code) {
    case 'invalid_credentials':
      return 'Email or password is incorrect.';
    case 'email_not_confirmed':
      return 'Confirm your email first — we can resend the link below.';
    case 'user_already_exists':
    case 'email_exists':
      return 'That email already has an account. Sign in instead.';
    case 'weak_password':
      return 'Use at least 8 characters, mixing letters and numbers.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Wait a minute, then try again.';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'That email address does not look right.';
    case 'signup_disabled':
      return 'New sign-ups are paused right now.';
    default:
      break;
  }

  const text = message.toLowerCase();
  if (text.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (text.includes('email not confirmed')) return 'Confirm your email first — we can resend the link below.';
  if (text.includes('already registered')) return 'That email already has an account. Sign in instead.';
  if (text.includes('password should be at least')) return 'Use at least 8 characters, mixing letters and numbers.';
  if (text.includes('rate limit') || text.includes('too many')) return 'Too many attempts. Wait a minute, then try again.';
  if (text.includes('invalid email')) return 'That email address does not look right.';
  if (text.includes('expired') || text.includes('invalid')) return 'That link is invalid or has expired. Request a new one.';
  return message;
}

/** Keeps post-login redirects on this origin. */
export function safeNext(next: string | undefined): string {
  if (!next) return '/dashboard';
  if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard';
  return next;
}
