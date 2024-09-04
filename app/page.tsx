import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/signin');
  }

  // This part will never be reached due to the redirects above
  // but we'll keep it for TypeScript to be happy
  return null;
}
