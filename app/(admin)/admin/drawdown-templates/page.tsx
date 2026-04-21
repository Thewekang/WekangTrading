import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAllTemplates } from '@/lib/services/drawdownTemplateService';
import { DrawdownTemplatesManager } from '@/components/admin/DrawdownTemplatesManager';

export default async function DrawdownTemplatesPage() {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') redirect('/login');

  const templates = await getAllTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Drawdown Templates</h1>
        <p className="text-muted-foreground mt-2">
          Manage preset risk rule templates users can apply when creating or editing their trading accounts.
        </p>
      </div>
      <DrawdownTemplatesManager initialTemplates={templates} />
    </div>
  );
}
