import AuthenticatedLayout from '../authenticated-layout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUserDetails } from '@/utils/supabase/queries';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const userDetails = await getUserDetails(supabase);

  return <AuthenticatedLayout user={user} userDetails={userDetails}>{children}</AuthenticatedLayout>;
}
