import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import SettingsDropdown from '@/components/admin/SettingsDropdown';
import { AdminNav } from '@/components/admin/AdminNav';
import { TimezoneProvider } from '@/contexts/TimezoneContext';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect if not authenticated or not admin
  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get admin user's preferred timezone
  const user = await db.select({ preferredTimezone: users.preferredTimezone })
    .from(users)
    .where(eq(users.id, session.user.id))
    .get();
  
  const userTimezone = user?.preferredTimezone || 'Asia/Kuala_Lumpur';

  return (
    <TimezoneProvider userTimezone={userTimezone}>
      <div className="min-h-screen bg-gray-50">
        {/* Admin Navigation */}
        <AdminNav userEmail={session.user.email || ''} />

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </TimezoneProvider>
  );
}
