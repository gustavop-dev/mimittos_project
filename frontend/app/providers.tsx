'use client';

import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { useAuthStore } from '@/lib/stores/authStore';
import { getAccessToken } from '@/lib/services/tokens';

function AuthInitializer() {
  const restoreUser = useAuthStore((s) => s.restoreUser);

  useEffect(() => {
    if (getAccessToken()) restoreUser();
  }, []);

  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const inner = (
    <>
      <AuthInitializer />
      {children}
    </>
  );

  if (!googleClientId) return inner;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {inner}
    </GoogleOAuthProvider>
  );
}
