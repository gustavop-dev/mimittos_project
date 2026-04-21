import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from base_feature_app.models import Order

logger = logging.getLogger(__name__)

COOLDOWN_HOURS = 24


def _can_send_automated_email(order: Order) -> bool:
    if order.last_automated_email_at is None:
        return True
    return timezone.now() - order.last_automated_email_at > timedelta(hours=COOLDOWN_HOURS)


def _mark_email_sent(order: Order) -> None:
    Order.objects.filter(pk=order.pk).update(last_automated_email_at=timezone.now())


class NotificationService:

    @staticmethod
    def notify_order_confirmation(order: Order) -> bool:
        if not _can_send_automated_email(order):
            return False
        subject = f'¡Tu pedido {order.order_number} está confirmado! 🧸'
        body = (
            f'Hola {order.customer_name},\n\n'
            f'Recibimos tu pedido {order.order_number} correctamente.\n'
            f'Abono pagado: ${order.deposit_amount:,} COP\n'
            f'Saldo contraentrega: ${order.balance_amount:,} COP\n\n'
            f'Te notificaremos cuando comience la producción.\n\n'
            f'¡Gracias por confiar en Peluchelandia!'
        )
        return NotificationService._send(order.customer_email, subject, body, order)

    @staticmethod
    def notify_production_started(order: Order) -> bool:
        if not _can_send_automated_email(order):
            return False
        subject = f'Tu peluche {order.order_number} está en producción 🐻'
        body = (
            f'Hola {order.customer_name},\n\n'
            f'¡Buenas noticias! Tu pedido {order.order_number} ya está en manos de nuestros artesanos.\n'
            f'Tiempo estimado de producción: 4-6 días hábiles.\n\n'
            f'Te avisamos cuando lo despachemos. 💛'
        )
        return NotificationService._send(order.customer_email, subject, body, order)

    @staticmethod
    def notify_order_shipped(order: Order) -> bool:
        if not _can_send_automated_email(order):
            return False
        subject = f'Tu peluche {order.order_number} está en camino 🚚'
        tracking_info = (
            f'Guía: {order.tracking_number} — {order.shipping_carrier}'
            if order.tracking_number else 'La guía estará disponible pronto.'
        )
        body = (
            f'Hola {order.customer_name},\n\n'
            f'Tu pedido {order.order_number} ya fue despachado.\n'
            f'{tracking_info}\n\n'
            f'Recuerda que al recibir el pedido pagarás el saldo: ${order.balance_amount:,} COP.\n\n'
            f'¡Pronto lo tendrás en tus manos!'
        )
        return NotificationService._send(order.customer_email, subject, body, order)

    @staticmethod
    def notify_welcome_credentials(customer_name: str, email: str, temp_password: str,
                                   order_number: str, login_url: str) -> bool:
        subject = f'¡Bienvenido a MIMITTOS! Tu cuenta y pedido {order_number} 🧸'
        body = (
            f'Hola {customer_name},\n\n'
            f'Gracias por tu pedido en MIMITTOS. '
            f'Creamos una cuenta para que puedas hacer seguimiento de tus pedidos y revisar tu historial.\n\n'
            f'--- Tus datos de acceso ---\n'
            f'Correo: {email}\n'
            f'Contraseña temporal: {temp_password}\n\n'
            f'Inicia sesión aquí: {login_url}\n\n'
            f'Te recomendamos cambiar tu contraseña desde tu perfil después de iniciar sesión.\n\n'
            f'¡Pronto comenzamos a preparar tu peluche con mucho amor!\n\n'
            f'— Equipo MIMITTOS'
        )
        try:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email])
            return True
        except Exception as exc:
            logger.error('Error sending welcome credentials: %s', exc)
            return False

    @staticmethod
    def notify_new_order_admin(order: Order) -> bool:
        admin_email = getattr(settings, 'ADMIN_EMAIL', '')
        if not admin_email:
            return False
        subject = f'Nuevo pedido Peluchelandia — {order.order_number}'
        body = (
            f'Nuevo pedido recibido:\n\n'
            f'Número: {order.order_number}\n'
            f'Cliente: {order.customer_name} ({order.customer_email})\n'
            f'Ciudad: {order.city}, {order.department}\n'
            f'Total: ${order.total_amount:,} COP\n'
            f'Abono: ${order.deposit_amount:,} COP\n\n'
            f'Ingresa al panel para ver el detalle y comenzar producción.'
        )
        try:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [admin_email])
            return True
        except Exception as exc:
            logger.error('Error sending admin notification: %s', exc)
            return False

    @staticmethod
    def notify_status_change(order: Order, new_status: str) -> None:
        from base_feature_project import tasks
        task_map = {
            Order.Status.PAYMENT_CONFIRMED: tasks.send_order_confirmation_email,
            Order.Status.IN_PRODUCTION: tasks.send_production_started_email,
            Order.Status.SHIPPED: tasks.send_order_shipped_email,
        }
        task_fn = task_map.get(new_status)
        if task_fn:
            task_fn(order.id)

    @staticmethod
    def _send(to_email: str, subject: str, body: str, order: Order) -> bool:
        try:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to_email])
            _mark_email_sent(order)
            return True
        except Exception as exc:
            logger.error('Email send error: %s', exc)
            return False
