import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTargetDashboardRoute } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const destination = getTargetDashboardRoute(
    currentUser.role,
    currentUser.corporate_id
  );

  redirect(destination);
}
