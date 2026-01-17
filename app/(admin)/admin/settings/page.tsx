import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">General Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage system-wide configuration and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current system status and version</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Version</span>
              <span className="text-sm text-muted-foreground">1.2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Environment</span>
              <span className="text-sm text-muted-foreground">Development</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Database</span>
              <span className="text-sm text-muted-foreground">Turso (Staging)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Access common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/admin/sop-types" className="block text-sm text-blue-600 hover:underline">
              → Manage SOP Types
            </a>
            <a href="/admin/invite-codes" className="block text-sm text-blue-600 hover:underline">
              → Manage Invite Codes
            </a>
            <a href="/admin/economic-calendar" className="block text-sm text-blue-600 hover:underline">
              → Economic Calendar Settings
            </a>
            <a href="/admin/users" className="block text-sm text-blue-600 hover:underline">
              → User Management
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
