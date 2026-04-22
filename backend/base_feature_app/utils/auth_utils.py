"""
Authentication utility functions.
"""
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings


def generate_auth_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_staff': user.is_staff,
        }
    }


def send_password_reset_code(user, code):
    name = user.first_name or 'MIMITTOS'
    subject = 'Código para restablecer tu contraseña — MIMITTOS'
    message = f'''Hola {name} 👋

Recibimos una solicitud para restablecer la contraseña de tu cuenta MIMITTOS.

Tu código de verificación es:

  {code}

Este código es válido por 15 minutos. Si no solicitaste este cambio, ignora este correo.

Con cariño,
El equipo de MIMITTOS 🧸
'''
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def send_verification_code(email, code):
    subject = 'Verifica tu cuenta en MIMITTOS 🧸'
    message = f'''¡Bienvenido/a a MIMITTOS! 🌸

Para activar tu cuenta necesitamos verificar tu correo electrónico.

Tu código de verificación es:

  {code}

Este código es válido por 15 minutos.

Si no creaste esta cuenta, puedes ignorar este correo.

Con cariño,
El equipo de MIMITTOS 🧸
'''
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
