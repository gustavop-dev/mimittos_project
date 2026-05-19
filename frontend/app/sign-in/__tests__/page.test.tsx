import { describe, it, expect, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SignInPage from '../page';
import { useAuthStore } from '../../../lib/stores/authStore';
import { useRouter } from 'next/navigation';

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
}));

jest.mock('../../../lib/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseRouter = useRouter as unknown as jest.Mock;
let user: ReturnType<typeof userEvent.setup>;

const setAuthStoreState = (state: any) => {
  mockUseAuthStore.mockImplementation((selector?: (store: any) => unknown) =>
    selector ? selector(state) : state
  );
};

describe('SignInPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
    Object.assign(mockUseAuthStore, { getState: jest.fn().mockReturnValue({ user: null }) });
  });

  it('signs in successfully and redirects', async () => {
    const signIn = jest.fn().mockResolvedValue(undefined);
    setAuthStoreState({ signIn });
    const replace = jest.fn();
    mockUseRouter.mockReturnValue({ replace });

    render(<SignInPage />);

    fireEvent.change(screen.getByPlaceholderText('sofia@ejemplo.com'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123', captcha_token: undefined });
    });
    expect(replace).toHaveBeenCalledWith('/orders');
  });

  it('shows an error when sign in fails', async () => {
    const signIn = jest.fn().mockRejectedValue({ response: { data: { error: 'Invalid' } } });
    setAuthStoreState({ signIn });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignInPage />);

    fireEvent.change(screen.getByPlaceholderText('sofia@ejemplo.com'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(await screen.findByText('Invalid')).toBeInTheDocument();
  });

  it('shows default error when sign in fails without response', async () => {
    const signIn = jest.fn().mockRejectedValue(new Error('boom'));
    setAuthStoreState({ signIn });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignInPage />);

    fireEvent.change(screen.getByPlaceholderText('sofia@ejemplo.com'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeInTheDocument();
  });

  it('shows default error when sign in error payload is missing', async () => {
    const signIn = jest.fn().mockRejectedValue({ response: { data: null } });
    setAuthStoreState({ signIn });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignInPage />);

    fireEvent.change(screen.getByPlaceholderText('sofia@ejemplo.com'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeInTheDocument();
  });
});
