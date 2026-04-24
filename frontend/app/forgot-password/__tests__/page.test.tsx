import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ForgotPasswordPage from '../page';
import { useAuthStore } from '../../../lib/stores/authStore';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: () => null })),
}));

jest.mock('../../../lib/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseRouter = useRouter as unknown as jest.Mock;

const setAuthStoreState = (state: any) => {
  mockUseAuthStore.mockImplementation((selector?: (store: any) => unknown) =>
    selector ? selector(state) : state
  );
};

const submitEmail = () => {
  fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'user@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: /Enviar código/i }));
};

const advanceToCodeStep = async () => {
  submitEmail();
  await screen.findByPlaceholderText('000000');
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ replace: jest.fn() });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends reset code and moves to code step', async () => {
    const sendPasswordResetCode = jest.fn().mockResolvedValue(undefined);
    setAuthStoreState({ sendPasswordResetCode, resetPassword: jest.fn() });

    render(<ForgotPasswordPage />);

    await advanceToCodeStep();

    await waitFor(() => {
      expect(sendPasswordResetCode).toHaveBeenCalledWith('user@example.com');
    });

    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    expect(screen.getByText('Revisa tu correo')).toBeInTheDocument();
  });

  it('shows error when sending code fails with server message', async () => {
    const sendPasswordResetCode = jest
      .fn()
      .mockRejectedValue({ response: { data: { error: 'Correo no encontrado' } } });
    setAuthStoreState({ sendPasswordResetCode, resetPassword: jest.fn() });

    render(<ForgotPasswordPage />);

    submitEmail();

    expect(await screen.findByText('Correo no encontrado')).toBeInTheDocument();
  });

  it('shows default error when sending code fails without response', async () => {
    const sendPasswordResetCode = jest.fn().mockRejectedValue(new Error('boom'));
    setAuthStoreState({ sendPasswordResetCode, resetPassword: jest.fn() });

    render(<ForgotPasswordPage />);

    submitEmail();

    expect(await screen.findByText('Error al enviar el código')).toBeInTheDocument();
  });

  it('validates password mismatch', async () => {
    const sendPasswordResetCode = jest.fn().mockResolvedValue(undefined);
    const resetPassword = jest.fn();
    setAuthStoreState({ sendPasswordResetCode, resetPassword });

    render(<ForgotPasswordPage />);

    await advanceToCodeStep();

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear nueva contraseña/i }));

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    const sendPasswordResetCode = jest.fn().mockResolvedValue(undefined);
    const resetPassword = jest.fn();
    setAuthStoreState({ sendPasswordResetCode, resetPassword });

    render(<ForgotPasswordPage />);

    await advanceToCodeStep();

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'short' } });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear nueva contraseña/i }));

    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('resets password and shows success state', async () => {
    const sendPasswordResetCode = jest.fn().mockResolvedValue(undefined);
    const resetPassword = jest.fn().mockResolvedValue(undefined);

    setAuthStoreState({ sendPasswordResetCode, resetPassword });

    render(<ForgotPasswordPage />);

    await advanceToCodeStep();

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear nueva contraseña/i }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        code: '123456',
        new_password: 'password123',
      });
    });

    expect(await screen.findByText('¡Contraseña actualizada!')).toBeInTheDocument();
  });

  it('shows server error when reset fails', async () => {
    const sendPasswordResetCode = jest.fn().mockResolvedValue(undefined);
    const resetPassword = jest
      .fn()
      .mockRejectedValue({ response: { data: { error: 'Código incorrecto' } } });
    setAuthStoreState({ sendPasswordResetCode, resetPassword });

    render(<ForgotPasswordPage />);

    await advanceToCodeStep();

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear nueva contraseña/i }));

    expect(await screen.findByText('Código incorrecto')).toBeInTheDocument();
  });

  it('shows default error when reset fails without response', async () => {
    const sendPasswordResetCode = jest.fn().mockResolvedValue(undefined);
    const resetPassword = jest.fn().mockRejectedValue(new Error('boom'));
    setAuthStoreState({ sendPasswordResetCode, resetPassword });

    render(<ForgotPasswordPage />);

    await advanceToCodeStep();

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear nueva contraseña/i }));

    expect(await screen.findByText('Código inválido o expirado')).toBeInTheDocument();
  });
});
