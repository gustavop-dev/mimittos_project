'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/services/tokens';

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_staff: boolean;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  signIn: (args: { email: string; password: string; captcha_token?: string }) => Promise<void>;
  signUp: (args: { email: string; password: string; first_name?: string; last_name?: string; captcha_token?: string }) => Promise<{ email: string }>;
  verifyRegistration: (args: { email: string; code: string }) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  signOut: () => void;
  syncFromCookies: () => void;
  restoreUser: () => Promise<void>;
  sendPasswordResetCode: (email: string) => Promise<void>;
  resetPassword: (args: { email: string; code: string; new_password: string }) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  user: null,
  isAuthenticated: Boolean(getAccessToken()),

  syncFromCookies: () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    set({ accessToken, refreshToken, isAuthenticated: Boolean(accessToken) });
  },

  signIn: async ({ email, password, captcha_token }) => {
    const response = await api.post('sign_in/', { email, password, captcha_token });
    const access = response.data?.access;
    const refresh = response.data?.refresh;
    const user = response.data?.user;

    if (!access || !refresh) {
      throw new Error('Respuesta de tokens inválida');
    }

    setTokens({ access, refresh });
    set({ user, isAuthenticated: true });
    get().syncFromCookies();
  },

  signUp: async ({ email, password, first_name, last_name, captcha_token }) => {
    const response = await api.post('sign_up/', {
      email,
      password,
      first_name,
      last_name,
      captcha_token,
    });
    return { email: response.data?.email ?? email };
  },

  verifyRegistration: async ({ email, code }) => {
    const response = await api.post('verify_registration/', { email, code });
    const access = response.data?.access;
    const refresh = response.data?.refresh;
    const user = response.data?.user;

    if (!access || !refresh) {
      throw new Error('Respuesta de tokens inválida');
    }

    setTokens({ access, refresh });
    set({ user, isAuthenticated: true });
    get().syncFromCookies();
  },

  resendVerification: async (email: string) => {
    await api.post('resend_verification/', { email });
  },

  signOut: () => {
    clearTokens();
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') window.location.replace('/');
  },

  restoreUser: async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const response = await api.get('validate_token/');
      const data = response.data;
      if (data?.valid && data?.user) {
        set({ user: data.user, isAuthenticated: true });
      } else {
        clearTokens();
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
      }
    } catch {
      clearTokens();
      set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
    }
  },

  sendPasswordResetCode: async (email: string) => {
    await api.post('send_passcode/', { email });
  },

  resetPassword: async ({ email, code, new_password }) => {
    await api.post('verify_passcode_and_reset_password/', {
      email,
      code,
      new_password
    });
  },
}));
