import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AuthenticatedLayout from '../authenticated-layout';
import { getUserDetails } from '@/utils/supabase/queries';
import SiteAuditContent from './SiteAuditContent';

export default async function SiteAuditPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const userDetails = await getUserDetails(supabase);

  return (
    <AuthenticatedLayout user={user} userDetails={userDetails}>
      <SiteAuditContent user={user} userDetails={userDetails} />
    </AuthenticatedLayout>
  );
}
