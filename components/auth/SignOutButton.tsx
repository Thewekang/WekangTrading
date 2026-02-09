'use client';

import { signOut } from 'next-auth/react';

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Client-side sign out button using next-auth/react signOut().
 * 
 * This avoids the NEXTAUTH_URL redirect issue where /api/auth/signout
 * redirects to localhost instead of the current host (e.g. 192.168.x.x).
 */
export function SignOutButton({ className, children }: SignOutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={className}
    >
      {children ?? 'Sign Out'}
    </button>
  );
}
