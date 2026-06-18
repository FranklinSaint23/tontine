import logging
import smtplib
from email.message import EmailMessage

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.models.notification import Notification
from app.models.user import User
from app.models.enums import NotificationType
from app.schemas.notification import NotificationRead

try:
    from twilio.rest import Client as TwilioClient
except Exception:
    TwilioClient = None

logger = logging.getLogger(__name__)
router = APIRouter()


def send_email_notification(to_email: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST or not to_email:
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.EMAIL_FROM
    message["To"] = to_email
    message.set_content(body)

    server = None
    try:
        if settings.SMTP_USE_SSL:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            if settings.SMTP_USE_TLS:
                server.starttls()

        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

        server.send_message(message)
    except Exception as exc:
        logger.exception("Failed to send email notification")
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass


def send_sms_notification(to_number: str, body: str) -> None:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_FROM_NUMBER:
        return
    if TwilioClient is None:
        logger.warning('Twilio client not installed; cannot send SMS')
        return

    try:
        client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(body=body, from_=settings.TWILIO_FROM_NUMBER, to=to_number)
    except Exception:
        logger.exception('Failed to send SMS notification')


def create_notification(
    db: DbSession,
    utilisateur_id: int,
    notif_type: str,
    titre: str,
    message: str,
    lien: str | None = None,
    reference_id: int | None = None,
):
    notification = Notification(
        utilisateur_id=utilisateur_id,
        type=notif_type,
        titre=titre,
        message=message,
        lien=lien,
        reference_id=reference_id,
    )
    db.add(notification)

    user = db.get(User, utilisateur_id)
    if user and user.email:
        send_email_notification(user.email, titre, message)
    # Send SMS for late payment notifications
    try:
        notif_value = getattr(notif_type, 'value', notif_type)
        if notif_value == NotificationType.LATE_PAYMENT.value and user and (user.numero_mobile or user.telephone):
            phone = user.numero_mobile or user.telephone
            send_sms_notification(phone, f"{titre}: {message}")
    except Exception:
        logger.exception('Failed to trigger SMS for notification')

    return notification


@router.get("", response_model=list[NotificationRead])
def list_notifications(db: DbSession, current_user: CurrentUser) -> list[Notification]:
    return list(
        db.scalars(
            select(Notification)
            .where(Notification.utilisateur_id == current_user.id)
            .order_by(Notification.date_creation.desc())
        )
    )


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> Notification:
    notification = db.get(Notification, notification_id)
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification introuvable")
    if notification.utilisateur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces refuse")

    notification.lu = True
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    notification = db.get(Notification, notification_id)
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification introuvable")
    if notification.utilisateur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces refuse")

    db.delete(notification)
    db.commit()
    return None


from pydantic import BaseModel


class TestNotification(BaseModel):
    utilisateur_id: int | None = None
    email: str | None = None
    phone: str | None = None
    titre: str = "Test Notification"
    message: str = "Ceci est un test"
    type: str = NotificationType.LATE_PAYMENT.value


@router.post("/test")
def send_test_notification(payload: TestNotification, db: DbSession, current_user: CurrentUser):
    """Send a test notification. If `utilisateur_id` is provided the notification is stored and sent to that user.
    Otherwise you can provide `email` or `phone` to send directly without creating a DB notification.
    """
    # Prefer storing for existing users
    if payload.utilisateur_id:
        create_notification(db, payload.utilisateur_id, payload.type, payload.titre, payload.message)
        db.commit()
        return {"status": "ok", "message": "Notification created and sent"}

    # Try sending to user by email
    if payload.email:
        user = db.scalar(select(User).where(User.email == payload.email))
        if user:
            create_notification(db, user.id, payload.type, payload.titre, payload.message)
            db.commit()
            return {"status": "ok", "message": "Notification created and sent to user"}
        # send directly
        send_email_notification(payload.email, payload.titre, payload.message)
        return {"status": "ok", "message": "Email sent (no DB record)"}

    if payload.phone:
        # try find user by phone
        user = db.scalar(select(User).where((User.numero_mobile == payload.phone) | (User.telephone == payload.phone)))
        if user:
            create_notification(db, user.id, payload.type, payload.titre, payload.message)
            db.commit()
            return {"status": "ok", "message": "Notification created and sent to user"}
        send_sms_notification(payload.phone, f"{payload.titre}: {payload.message}")
        return {"status": "ok", "message": "SMS sent (no DB record)"}

    return {"status": "error", "message": "Provide utilisateur_id, email or phone"}
