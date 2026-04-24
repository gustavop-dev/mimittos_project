from unittest.mock import patch

import pytest

from base_feature_app.services.email_service import EmailService


@pytest.mark.django_db
def test_send_password_reset_code_delegates_to_auth_utils(existing_user):
    with patch('base_feature_app.services.email_service.send_password_reset_code', return_value=True) as mock_fn:
        result = EmailService.send_password_reset_code(existing_user, '123456')

    mock_fn.assert_called_once_with(existing_user, '123456')
    assert result is True


@pytest.mark.django_db
def test_send_password_reset_code_returns_false_on_failure(existing_user):
    with patch('base_feature_app.services.email_service.send_password_reset_code', return_value=False):
        result = EmailService.send_password_reset_code(existing_user, 'ABCDEF')

    assert result is False


def test_send_verification_code_delegates_to_auth_utils():
    with patch('base_feature_app.services.email_service.send_verification_code', return_value=True) as mock_fn:
        result = EmailService.send_verification_code('user@example.com', '654321')

    mock_fn.assert_called_once_with('user@example.com', '654321')
    assert result is True
