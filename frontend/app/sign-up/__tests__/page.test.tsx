import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import SignUpPage from '../page';
import { useAuthStore } from '../../../lib/stores/authStore';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

let mockGoogleCredential: string | null = 'token';
let mockGoogleError = false;

jest.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess, onError }: any) => (
    <button
      type="button"
      onClick={() => {
        if (mockGoogleError) {
          onError?.();
          return;
        }
        onSuccess?.({ credential: mockGoogleCredential ?? undefined });
      }}
    >
      Google Login
    </button>
  ),
}));

jest.mock('react-google-recaptcha', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const MockRecaptcha = React.forwardRef(
    ({ onChange: _onChange }: { onChange?: (token: string | null) => void }, ref: any) => {
      React.useImperativeHandle(ref, () => ({ reset: () => {} }));
      return <div data-testid="mock-recaptcha" />;
    },
  );
  MockRecaptcha.displayName = 'MockRecaptcha';
  return MockRecaptcha;
});

jest.mock('../../../lib/services/http', () => ({
  api: { get: jest.fn().mockRejectedValue(new Error('no key')), post: jest.fn() },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: () => null })),
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

jest.mock('../../../lib/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseRouter = useRouter as unknown as jest.Mock;
const mockJwtDecode = jwtDecode as unknown as jest.Mock;

const setAuthStoreState = (state: any) => {
  mockUseAuthStore.mockImplementation((selector?: (store: any) => unknown) =>
    selector ? selector(state) : state
  );
};

const acceptTerms = () => {
  const termsCheckbox = screen.getByText(/Términos y Condiciones/i).closest('label')!.firstElementChild as HTMLElement;
  fireEvent.click(termsCheckbox);
};

describe('SignUpPage', () => {
  const originalGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGoogleCredential = 'token';
    mockGoogleError = false;
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client';
  });

  afterEach(() => {
    if (originalGoogleClientId === undefined) {
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    } else {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = originalGoogleClientId;
    }
  });

  it('hides Google Login button when env var is not set', () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    setAuthStoreState({ signUp: jest.fn(), googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);

    expect(screen.queryByRole('button', { name: 'Google Login' })).not.toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const signUp = jest.fn();
    setAuthStoreState({ signUp, googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText('Sofía'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Martínez'), { target: { value: 'User' } });
    fireEvent.change(screen.getByPlaceholderText('sofia@ejemplo.com'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear mi cuenta/i }));

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('shows error when password is too short', async () => {
    const signUp = jest.fn();
    setAuthStoreState({ signUp, googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText('sofia@ejemplo.com'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'short' } });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear mi cuenta/i }));

    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('signs up successfully and moves to verification step', async () => {
    const signUp = jest.fn().mockResolvedValue({ email: 'user@example.com' });
    setAuthStoreState({ signUp, verifyRegistration: jest.fn(), resendVerification: jest.fn(), googleLogin: jest.fn() });
    const replace = jest.fn();
    mockUseRouter.mockReturnValue({ replace });

    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText('Sofía'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Martínez'), { target: { value: 'User' } });
    fireEvent.change(screen.getByPlaceholderText('sofia@ejemplo.com'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password123' } });
    acceptTerms();
    fireEvent.click(screen.getByRole('button', { name: /Crear mi cuenta/i }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        captcha_token: undefined,
      });
    });

    expect(await screen.findByPlaceholderText('000000')).toBeInTheDocument();
  });

  it('shows error when Google registration fails with response error', async () => {
    const googleLogin = jest
      .fn()
      .mockRejectedValue({ response: { data: { error: 'Google auth error' } } });
    setAuthStoreState({ signUp: jest.fn(), googleLogin });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });
    mockJwtDecode.mockReturnValue({
      email: 'google@example.com',
      given_name: 'Google',
      family_name: 'User',
      picture: 'pic.png',
    });

    render(<SignUpPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Google Login' }));

    expect(await screen.findByText('Google auth error')).toBeInTheDocument();
  });

  it('shows default error when Google registration throws without response', async () => {
    const googleLogin = jest.fn().mockRejectedValue(new Error('boom'));
    setAuthStoreState({ signUp: jest.fn(), googleLogin });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });
    mockJwtDecode.mockReturnValue({
      email: 'google@example.com',
      given_name: 'Google',
      family_name: 'User',
      picture: 'pic.png',
    });

    render(<SignUpPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Google Login' }));

    expect(await screen.findByText('Error al registrarse con Google')).toBeInTheDocument();
  });

  it('shows an error when sign up fails', async () => {
    const signUp = jest.fn().mockRejectedValue({ response: { data: { error: 'Registration failed' } } });
    setAuthStoreState({ signUp, googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText('sofia@ejemplo.com'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password123' } });
    acceptTerms();
    fireEvent.click(screen.getByRole('button', { name: /Crear mi cuenta/i }));

    expect(await screen.findByText('Registration failed')).toBeInTheDocument();
  });

  it('shows default error when sign up error payload is missing', async () => {
    const signUp = jest.fn().mockRejectedValue({ response: { data: null } });
    setAuthStoreState({ signUp, googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText('sofia@ejemplo.com'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password123' } });
    acceptTerms();
    fireEvent.click(screen.getByRole('button', { name: /Crear mi cuenta/i }));

    expect(await screen.findByText('Error al crear la cuenta')).toBeInTheDocument();
  });

  it('handles Google registration success', async () => {
    const googleLogin = jest.fn().mockResolvedValue(undefined);
    setAuthStoreState({ signUp: jest.fn(), googleLogin });
    const replace = jest.fn();
    mockUseRouter.mockReturnValue({ replace });
    mockJwtDecode.mockReturnValue({
      email: 'google@example.com',
      given_name: 'Google',
      family_name: 'User',
      picture: 'pic.png',
    });

    render(<SignUpPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Google Login' }));

    await waitFor(() => {
      expect(googleLogin).toHaveBeenCalledWith({
        credential: 'token',
        email: 'google@example.com',
        given_name: 'Google',
        family_name: 'User',
        picture: 'pic.png',
      });
    });
    expect(replace).toHaveBeenCalledWith('/orders');
  });

  it('shows an error when Google credential is missing', async () => {
    mockGoogleCredential = null;
    setAuthStoreState({ signUp: jest.fn(), googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Google Login' }));

    expect(await screen.findByText('Error con Google')).toBeInTheDocument();
  });

  it('handles Google login error callback', async () => {
    mockGoogleError = true;
    setAuthStoreState({ signUp: jest.fn(), googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Google Login' }));

    expect(await screen.findByText('Error al registrarse con Google')).toBeInTheDocument();
  });

  it('continues when jwt decode fails', async () => {
    const googleLogin = jest.fn().mockResolvedValue(undefined);
    setAuthStoreState({ signUp: jest.fn(), googleLogin });
    const replace = jest.fn();
    mockUseRouter.mockReturnValue({ replace });
    mockJwtDecode.mockImplementation(() => {
      throw new Error('bad token');
    });

    render(<SignUpPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Google Login' }));

    await waitFor(() => {
      expect(googleLogin).toHaveBeenCalledWith({
        credential: 'token',
        email: undefined,
        given_name: undefined,
        family_name: undefined,
        picture: undefined,
      });
    });
    expect(replace).toHaveBeenCalledWith('/orders');
  });
});
