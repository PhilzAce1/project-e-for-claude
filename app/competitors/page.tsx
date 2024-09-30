import AuthenticatedLayout from '../authenticated-layout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CompetitorsContent from './CompetitorsContent';

export default async function CompetitorsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
  console.log('user', user)
    if (!user) {
      redirect('/signin/password_signin');
    }

  return (
    <AuthenticatedLayout user={user}>
      <CompetitorsContent user={user} />
    </AuthenticatedLayout>
  );
}
