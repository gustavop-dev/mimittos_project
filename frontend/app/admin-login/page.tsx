'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { setTokens } from '@/lib/services/tokens';
import { useAuthStore } from '@/lib/stores/authStore';

function safeRedirectTarget(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
}

function AdminLoginInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const access = params.get('access');
    const refresh = params.get('refresh');

    if (!access || !refresh) {
      router.replace('/sign-in');
      return;
    }

    const redirect = safeRedirectTarget(params.get('redirect'));

    const completeLogin = async () => {
      setTokens({ access, refresh });
      await useAuthStore.getState().restoreUser();
      router.replace(redirect);
    };

    void completeLogin();
  }, [params, router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--gray-warm)',
      }}
    >
      Iniciando sesión...
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh' }} />}>
      <AdminLoginInner />
    </Suspense>
  );
}
