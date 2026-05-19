from datetime import timedelta
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from freezegun import freeze_time
from rest_framework import status

from base_feature_app.models import PasswordCode
from base_feature_app.views import auth as auth_views


@pytest.mark.django_db
@patch('base_feature_app.views.auth.verify_recaptcha', return_value=True)
def test_sign_up_requires_email_and_password(mock_captcha, api_client):
    response = api_client.post(reverse('sign_up'), {}, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'El correo y la contraseña son obligatorios'


@pytest.mark.django_db
@patch('base_feature_app.views.auth.verify_recaptcha', return_value=True)
def test_sign_up_rejects_existing_email(mock_captcha, api_client):
    User = get_user_model()
    User.objects.create_user(email='existing@example.com', password='pass1234')

    response = api_client.post(
        reverse('sign_up'),
        {'email': 'existing@example.com', 'password': 'pass1234'},
        format='json',
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'Este correo ya está registrado. ¿Olvidaste tu contraseña?'


@pytest.mark.django_db
@patch('base_feature_app.views.auth.verify_recaptcha', return_value=True)
def test_sign_up_creates_user(mock_captcha, api_client):
    """Verifies sign-up creates an inactive user and returns a verification-sent message."""
    response = api_client.post(
        reverse('sign_up'),
        {
            'email': 'new@example.com',
            'password': 'pass1234',
            'first_name': 'New',
            'last_name': 'User',
        },
        format='json',
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()['detail'] == 'Cuenta creada. Te enviamos un código de verificación a tu correo.'

    User = get_user_model()
    user = User.objects.get(email='new@example.com')
    assert user.first_name == 'New'
    assert user.is_active is False


@pytest.mark.django_db
@patch('base_feature_app.views.auth.verify_recaptcha', return_value=True)
def test_sign_in_requires_fields(mock_captcha, api_client):
    response = api_client.post(reverse('sign_in'), {}, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'El correo y la contraseña son obligatorios'


@pytest.mark.django_db
@patch('base_feature_app.views.auth.verify_recaptcha', return_value=True)
def test_sign_in_rejects_unknown_user(mock_captcha, api_client):
    response = api_client.post(
        reverse('sign_in'),
        {'email': 'missing@example.com', 'password': 'pass1234'},
        format='json',
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()['error'] == 'Credenciales incorrectas'


@pytest.mark.django_db
@patch('base_feature_app.views.auth.verify_recaptcha', return_value=True)
def test_sign_in_rejects_invalid_password(mock_captcha, api_client):
    User = get_user_model()
    User.objects.create_user(email='user@example.com', password='pass1234')

    response = api_client.post(
        reverse('sign_in'),
        {'email': 'user@example.com', 'password': 'wrong'},
        format='json',
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@patch('base_feature_app.views.auth.verify_recaptcha', return_value=True)
def test_sign_in_rejects_inactive_user(mock_captcha, api_client):
    User = get_user_model()
    user = User.objects.create_user(email='inactive@example.com', password='pass1234')
    user.is_active = False
    user.save(update_fields=['is_active'])

    response = api_client.post(
        reverse('sign_in'),
        {'email': 'inactive@example.com', 'password': 'pass1234'},
        format='json',
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()['error'] == 'Tu cuenta aún no está verificada. Revisa tu correo o regístrate de nuevo para recibir un nuevo código.'


@pytest.mark.django_db
@patch('base_feature_app.views.auth.verify_recaptcha', return_value=True)
def test_sign_in_success(mock_captcha, api_client):
    User = get_user_model()
    User.objects.create_user(email='active@example.com', password='pass1234')

    response = api_client.post(
        reverse('sign_in'),
        {'email': 'active@example.com', 'password': 'pass1234'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.json()


@pytest.mark.django_db
def test_send_passcode_requires_email(api_client):
    response = api_client.post(reverse('send_passcode'), {}, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'El correo es obligatorio'


@pytest.mark.django_db
def test_send_passcode_returns_generic_message_for_missing_user(api_client):
    response = api_client.post(
        reverse('send_passcode'),
        {'email': 'missing@example.com'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()['message'] == 'Si el correo existe en nuestro sistema, recibirás el código pronto'
    assert PasswordCode.objects.count() == 0


@pytest.mark.django_db
def test_send_passcode_success(api_client, monkeypatch):
    User = get_user_model()
    user = User.objects.create_user(email='send@example.com', password='pass1234')

    monkeypatch.setattr(auth_views, 'send_password_reset_code', lambda *_args, **_kwargs: True)

    response = api_client.post(
        reverse('send_passcode'),
        {'email': user.email},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    assert PasswordCode.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_send_passcode_failure(api_client, monkeypatch):
    User = get_user_model()
    user = User.objects.create_user(email='fail@example.com', password='pass1234')

    monkeypatch.setattr(auth_views, 'send_password_reset_code', lambda *_args, **_kwargs: False)

    response = api_client.post(
        reverse('send_passcode'),
        {'email': user.email},
        format='json',
    )

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.json()['error'] == 'Error al enviar el correo. Inténtalo de nuevo.'


@pytest.mark.django_db
def test_verify_passcode_requires_fields(api_client):
    response = api_client.post(reverse('verify_passcode_reset'), {}, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'El correo, el código y la nueva contraseña son obligatorios'


@pytest.mark.django_db
def test_verify_passcode_rejects_invalid_email(api_client):
    response = api_client.post(
        reverse('verify_passcode_reset'),
        {'email': 'missing@example.com', 'code': '123456', 'new_password': 'newpass1'},
        format='json',
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@freeze_time('2026-01-15 10:00:00')
def test_verify_passcode_rejects_expired_code(api_client):
    """Verifies passcode verification returns 400 when the code was created more than 15 minutes ago."""
    User = get_user_model()
    user = User.objects.create_user(email='expired@example.com', password='pass1234')
    password_code = PasswordCode.objects.create(user=user, code='111111')
    PasswordCode.objects.filter(id=password_code.id).update(
        created_at=timezone.now() - timedelta(minutes=16)
    )

    response = api_client.post(
        reverse('verify_passcode_reset'),
        {'email': user.email, 'code': '111111', 'new_password': 'newpass1'},
        format='json',
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'El código es inválido o ha expirado'


@pytest.mark.django_db
def test_verify_passcode_handles_exception(api_client, monkeypatch):
    """Verifies passcode verification returns 400 when an unexpected exception occurs during code validation."""
    User = get_user_model()
    user = User.objects.create_user(email='boom@example.com', password='pass1234')
    PasswordCode.objects.create(user=user, code='222222')

    def boom(_self):
        raise Exception('boom')

    monkeypatch.setattr(PasswordCode, 'is_valid', boom)

    response = api_client.post(
        reverse('verify_passcode_reset'),
        {'email': user.email, 'code': '222222', 'new_password': 'newpass1'},
        format='json',
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'El código es inválido o ha expirado'


@pytest.mark.django_db
def test_verify_passcode_resets_password(api_client):
    """Verifies passcode verification resets the user password and marks the code as used on success."""
    User = get_user_model()
    user = User.objects.create_user(email='reset@example.com', password='pass1234')
    password_code = PasswordCode.objects.create(user=user, code='333333')

    response = api_client.post(
        reverse('verify_passcode_reset'),
        {'email': user.email, 'code': '333333', 'new_password': 'newpass1'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    password_code.refresh_from_db()
    user.refresh_from_db()

    assert password_code.used is True
    assert user.check_password('newpass1') is True


@pytest.mark.django_db
def test_update_password_requires_fields(api_client):
    User = get_user_model()
    user = User.objects.create_user(email='update-fields@example.com', password='pass1234')
    api_client.force_authenticate(user=user)

    response = api_client.post(reverse('update_password'), {}, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'La contraseña actual y la nueva son obligatorias'


@pytest.mark.django_db
def test_update_password_rejects_wrong_current(api_client):
    User = get_user_model()
    user = User.objects.create_user(email='update@example.com', password='pass1234')

    api_client.force_authenticate(user=user)

    response = api_client.post(
        reverse('update_password'),
        {'current_password': 'wrong', 'new_password': 'newpass1'},
        format='json',
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()['error'] == 'La contraseña actual es incorrecta'


@pytest.mark.django_db
def test_update_password_success(api_client):
    """Verifies update-password endpoint successfully changes the user password when the current password is correct."""
    User = get_user_model()
    user = User.objects.create_user(email='update2@example.com', password='pass1234')

    api_client.force_authenticate(user=user)

    response = api_client.post(
        reverse('update_password'),
        {'current_password': 'pass1234', 'new_password': 'newpass1'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    user.refresh_from_db()
    assert user.check_password('newpass1') is True


@pytest.mark.django_db
def test_validate_token_returns_invalid_for_anonymous(api_client):
    response = api_client.get(reverse('validate_token'))

    assert response.status_code == status.HTTP_200_OK
    assert response.json()['valid'] is False


@pytest.mark.django_db
def test_validate_token_success(api_client):
    User = get_user_model()
    user = User.objects.create_user(email='token@example.com', password='pass1234')

    api_client.force_authenticate(user=user)
    response = api_client.get(reverse('validate_token'))

    assert response.status_code == status.HTTP_200_OK
    assert response.json()['valid'] is True
