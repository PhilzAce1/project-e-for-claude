import Logo from '@/components/icons/Logo';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/utils/auth-helpers/settings';
import PasswordSignIn from '@/components/ui/AuthForms/PasswordSignIn';
import EmailSignIn from '@/components/ui/AuthForms/EmailSignIn';
import OauthSignIn from '@/components/ui/AuthForms/OauthSignIn';
import ForgotPassword from '@/components/ui/AuthForms/ForgotPassword';
import UpdatePassword from '@/components/ui/AuthForms/UpdatePassword';
import SignUp from '@/components/ui/AuthForms/Signup';
import ConfirmEmailContent from '@/components/ui/AuthForms/ConfirmEmail';
import Image from 'next/image';

export default async function SignIn({
  params,
  searchParams
}: any) {
  const { allowOauth, allowEmail, allowPassword } = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();
  let viewProp: string;

  if (searchParams.code && params.id === 'update_password') {
    viewProp = 'update_password';
  } else if (typeof params.id === 'string' && viewTypes.includes(params.id)) {
    viewProp = params.id;
  } else {
    const cookieStore = await cookies();
    const preferredSignInView = cookieStore.get('preferredSignInView')?.value || null;
    viewProp = getDefaultSignInView(preferredSignInView);
    return redirect(`/signin/${viewProp}`);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && viewProp !== 'update_password') {
    return redirect('/');
  } else if (!user && viewProp === 'update_password' && !searchParams.code) {
    return redirect('/signin/password_signin');
  }

  return (
    <div className="flex min-h-full flex-1 h-screen bg-white">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Logo width="64" height="64" className="h-20 w-auto" />
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900">
              {viewProp === 'forgot_password'
                ? 'Reset Password'
                : viewProp === 'update_password'
                ? 'Update Password'
                : viewProp === 'confirm_email'
                ? 'Confirm Email'
                : viewProp === 'signup'
                ? 'Create an account'
                : 'Sign in to your account'}
            </h2>
            {viewProp === 'password_signin' && (
              <p className="mt-2 text-sm text-gray-500">
                Not a member?{' '}
                <a href="/signin/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Start your free trial
                </a>
              </p>
            )}
          </div>

          <div className="mt-10">
            {viewProp === 'password_signin' && (
              <PasswordSignIn
                allowEmail={allowEmail}
                redirectMethod={redirectMethod}
              />
            )}
            {viewProp === 'email_signin' && (
              <EmailSignIn
                allowPassword={allowPassword}
                redirectMethod={redirectMethod}
                disableButton={searchParams.disable_button}
              />
            )}
            {viewProp === 'forgot_password' && (
              <ForgotPassword
                allowEmail={allowEmail}
                redirectMethod={redirectMethod}
                disableButton={searchParams.disable_button}
              />
            )}
            {viewProp === 'update_password' && (
              <UpdatePassword redirectMethod={redirectMethod} />
            )}
            {viewProp === 'signup' && (
              <SignUp allowEmail={allowEmail} redirectMethod={redirectMethod} />
            )}
            {viewProp === 'confirm_email' && (
              <ConfirmEmailContent />
            )}

            {viewProp !== 'update_password' && viewProp !== 'confirm_email' && allowOauth && (
              <div className="mt-10">
                <OauthSignIn />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          src="/public/authbg.jpg"
          alt="SEO Growth Over Time"
          width={600}
          height={800}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
