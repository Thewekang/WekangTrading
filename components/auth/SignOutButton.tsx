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
 * 
 * Uses redirect: false to prevent NextAuth from using NEXTAUTH_URL,
 * then manually redirects to /login on the current host.
 */
export function SignOutButton({ className, children }: SignOutButtonProps) {
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  return (
    <button
      onClick={handleSignOut}
      className={className}
    >
      {children ?? 'Sign Out'}
    </button>
  );
}
