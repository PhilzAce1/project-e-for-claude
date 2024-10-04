import AuthenticatedLayout from '../authenticated-layout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import RankingsContent from './RankingsContent';

export default async function RankingssPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
  console.log('user', user)
    if (!user) {
      redirect('/signin/password_signin');
    }

  return (
    <AuthenticatedLayout user={user}>
      <RankingsContent user={user} />
    </AuthenticatedLayout>
  );
}
