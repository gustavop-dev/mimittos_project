'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/lib/stores/authStore';

export const useRequireAuth = ({ requireStaff = false, redirectStaff = false } = {}) => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const syncFromCookies = useAuthStore((s) => s.syncFromCookies);
  const restoreUser = useAuthStore((s) => s.restoreUser);

  useEffect(() => {
    syncFromCookies();
    restoreUser();
  }, [syncFromCookies, restoreUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/sign-in');
      return;
    }
    if (requireStaff && user && !user.is_staff) {
      router.replace('/');
      return;
    }
    if (redirectStaff && user?.is_staff) {
      router.replace('/backoffice');
    }
  }, [isAuthenticated, user, requireStaff, redirectStaff, router]);

  const isAdmin = Boolean(user?.is_staff);
  return { isAuthenticated, isAdmin, user };
};
