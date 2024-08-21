'use client';

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn signUpUrl="/sign-up" redirectUrl={redirect} />
    </div>
  );
}