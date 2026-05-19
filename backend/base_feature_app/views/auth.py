"""
Authentication views for user sign up, sign in, and password management.
"""
import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth import get_user_model

from base_feature_app.models import PasswordCode
from base_feature_app.utils.auth_utils import (
    generate_auth_tokens,
    send_password_reset_code,
    send_verification_code
)
from base_feature_app.views.captcha_views import verify_recaptcha

User = get_user_model()

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def sign_up(request):
    captcha_token = request.data.get('captcha_token', '')
    if not verify_recaptcha(captcha_token):
        return Response(
            {'captcha_token': ['La verificación reCAPTCHA falló.']},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password')
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()

    if not email or not password:
        return Response(
            {'error': 'El correo y la contraseña son obligatorios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 8:
        return Response(
            {'error': 'La contraseña debe tener al menos 8 caracteres'},
            status=status.HTTP_400_BAD_REQUEST
        )

    existing = User.objects.filter(email=email).first()
    if existing:
        if not existing.is_active:
            password_code = PasswordCode.generate_code(existing)
            send_verification_code(email, password_code.code)
            return Response(
                {'detail': 'Ya existe una cuenta pendiente de verificación. Te reenviamos el código a tu correo.', 'email': email},
                status=status.HTTP_200_OK
            )
        return Response(
            {'error': 'Este correo ya está registrado. ¿Olvidaste tu contraseña?'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create(
        email=email,
        first_name=first_name,
        last_name=last_name,
        password=make_password(password),
        is_active=False
    )

    password_code = PasswordCode.generate_code(user)
    send_verification_code(email, password_code.code)

    return Response(
        {'detail': 'Cuenta creada. Te enviamos un código de verificación a tu correo.', 'email': email},
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_registration(request):
    email = request.data.get('email', '').strip().lower()
    code = request.data.get('code', '').strip()

    if not email or not code:
        return Response(
            {'error': 'El correo y el código son obligatorios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Código inválido o expirado'},
            status=status.HTTP_400_BAD_REQUEST
        )

    password_code = user.password_codes.filter(code=code, used=False).first()
    if not password_code or not password_code.is_valid():
        return Response(
            {'error': 'El código es inválido o ha expirado'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.is_active = True
    user.save(update_fields=['is_active'])

    password_code.used = True
    password_code.save(update_fields=['used'])

    from base_feature_app.models import Order
    Order.objects.filter(customer_email=email, customer=None).update(customer=user)

    tokens = generate_auth_tokens(user)
    return Response(tokens, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    email = request.data.get('email', '').strip().lower()

    if not email:
        return Response(
            {'error': 'El correo es obligatorio'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email, is_active=False)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Si existe una cuenta pendiente, te reenviamos el código.'},
            status=status.HTTP_200_OK
        )

    password_code = PasswordCode.generate_code(user)
    send_verification_code(email, password_code.code)

    return Response(
        {'detail': 'Código reenviado a tu correo.'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def sign_in(request):
    captcha_token = request.data.get('captcha_token', '')
    if not verify_recaptcha(captcha_token):
        return Response(
            {'captcha_token': ['La verificación reCAPTCHA falló.']},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'El correo y la contraseña son obligatorios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Credenciales incorrectas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not check_password(password, user.password):
        return Response(
            {'error': 'Credenciales incorrectas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'error': 'Tu cuenta aún no está verificada. Revisa tu correo o regístrate de nuevo para recibir un nuevo código.', 'needs_verification': True, 'email': email},
            status=status.HTTP_403_FORBIDDEN
        )

    tokens = generate_auth_tokens(user)
    return Response(tokens, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_passcode(request):
    email = request.data.get('email', '').strip().lower()

    if not email:
        return Response(
            {'error': 'El correo es obligatorio'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'message': 'Si el correo existe en nuestro sistema, recibirás el código pronto'},
            status=status.HTTP_200_OK
        )

    password_code = PasswordCode.generate_code(user)
    success = send_password_reset_code(user, password_code.code)

    if not success:
        return Response(
            {'error': 'Error al enviar el correo. Inténtalo de nuevo.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response(
        {'message': 'Código enviado a tu correo'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_passcode_and_reset_password(request):
    email = request.data.get('email', '').strip().lower()
    code = request.data.get('code', '').strip()
    new_password = request.data.get('new_password')

    if not email or not code or not new_password:
        return Response(
            {'error': 'El correo, el código y la nueva contraseña son obligatorios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(new_password) < 8:
        return Response(
            {'error': 'La contraseña debe tener al menos 8 caracteres'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Código inválido o expirado'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        password_code = user.password_codes.filter(code=code, used=False).first()
        if not password_code or not password_code.is_valid():
            return Response(
                {'error': 'El código es inválido o ha expirado'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception:
        return Response(
            {'error': 'El código es inválido o ha expirado'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.password = make_password(new_password)
    if not user.is_active:
        user.is_active = True
    user.save()

    password_code.used = True
    password_code.save()

    return Response(
        {'message': 'Contraseña actualizada exitosamente'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_password(request):
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response(
            {'error': 'La contraseña actual y la nueva son obligatorias'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = request.user

    if not check_password(current_password, user.password):
        return Response(
            {'error': 'La contraseña actual es incorrecta'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(new_password) < 8:
        return Response(
            {'error': 'La contraseña debe tener al menos 8 caracteres'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.password = make_password(new_password)
    user.save()

    return Response(
        {'message': 'Contraseña actualizada exitosamente'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def validate_token(request):
    user = request.user
    if not user or not user.is_authenticated:
        return Response({'valid': False}, status=status.HTTP_200_OK)
    return Response({
        'valid': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_staff': user.is_staff,
        }
    }, status=status.HTTP_200_OK)
