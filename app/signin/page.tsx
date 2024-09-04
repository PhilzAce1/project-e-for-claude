import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';
import { cookies } from 'next/headers';

export default function SignIn() {
  const preferredSignInView =
    cookies().get('preferredSignInView')?.value || null;
  const defaultView = getDefaultSignInView(preferredSignInView);

  const handleSignIn = async (formData: FormData) => {
    // ... (authentication logic)

    if (error) {
      return fail(400, {
        error: 'Invalid credentials'
      })
    }

    return redirect('/')
  }

  return redirect(`/signin/${defaultView}`);
}
