from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func, or_

from app.api.deps import CurrentUser, DbSession
from app.models.contribution import Contribution
from app.models.cycle import Cycle
from app.models.enums import PaymentStatus, NotificationType, UserRole
from app.models.user import User
from app.api.v1.routes.notifications import create_notification
from app.core.config import settings

router = APIRouter()


def _accessible_group_ids(db, current_user):
    from app.models.group import Group
    from app.models.membership import Membership
    from app.models.enums import MembershipStatus

    # If no current_user provided, treat as super-admin (access all groups)
    if current_user is None:
        groups = list(db.scalars(select(Group)))
        return [group.id for group in groups]

    if current_user.role == UserRole.SUPER_ADMIN:
        groups = list(db.scalars(select(Group)))
    else:
        groups = list(
            db.scalars(
                select(Group)
                .outerjoin(Membership)
                .where(
                    or_(
                        Group.gestionnaire_id == current_user.id,
                        (Membership.utilisateur_id == current_user.id) & (Membership.statut == MembershipStatus.ACTIVE),
                    )
                )
                .distinct()
            )
        )
    return [group.id for group in groups]


def run_send_reminders(db, current_user=None):
    """Core logic to send reminders; current_user can be None to indicate super-admin."""
    group_ids = _accessible_group_ids(db, current_user)
    if not group_ids:
        return {"sent": 0}

    today = date.today()
    reminders_days = settings.REMINDER_DAYS or 3

    sent = 0
    cycles = db.scalars(select(Cycle).where(Cycle.groupe_id.in_(group_ids))).all()
    for cycle in cycles:
        if cycle.date_fin and cycle.date_fin >= today and (cycle.date_fin - today).days <= reminders_days:
            for contrib in cycle.cotisations:
                if contrib.statut == PaymentStatus.PENDING and contrib.membre and contrib.membre.utilisateur_id:
                    create_notification(
                        db,
                        contrib.membre.utilisateur_id,
                        NotificationType.CONTRIBUTION,
                        "Rappel de cotisation",
                        f"Rappel : votre cotisation de {contrib.montant} FCFA pour le groupe {cycle.groupe.nom} est bientôt due (limite {cycle.date_fin}).",
                        lien=f"/groups/{cycle.groupe_id}/contributions",
                    )
                    sent += 1

    db.commit()
    return {"sent": sent}


def run_process_late(db, current_user=None):
    """Core logic to mark contributions late and optionally apply penalties. current_user=None => super-admin."""
    group_ids = _accessible_group_ids(db, current_user)
    if not group_ids:
        return {"processed": 0}

    today = date.today()
    processed = 0
    overdue_cycles = db.scalars(select(Cycle).where(Cycle.groupe_id.in_(group_ids), Cycle.date_fin < today)).all()
    for cycle in overdue_cycles:
        for contrib in cycle.cotisations:
            if contrib.statut == PaymentStatus.PENDING:
                contrib.statut = PaymentStatus.LATE
                db.add(contrib)
                if contrib.membre and contrib.membre.utilisateur_id:
                    user = db.get(User, contrib.membre.utilisateur_id)
                    create_notification(
                        db,
                        contrib.membre.utilisateur_id,
                        NotificationType.LATE_PAYMENT,
                        "Retard de paiement",
                        f"Votre cotisation de {contrib.montant} FCFA pour {cycle.groupe.nom} est en retard (limite {cycle.date_fin}).",
                        lien=f"/groups/{cycle.groupe_id}/contributions",
                    )

                    if settings.APPLY_PENALTIES:
                        try:
                            percent = Decimal(str(settings.PENALTY_PERCENT or 0))
                            penalty = (Decimal(contrib.montant) * percent / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                            if user and hasattr(user, 'solde'):
                                try:
                                    if user.solde is None:
                                        user.solde = 0
                                    deduct = int(penalty) if isinstance(user.solde, int) else penalty
                                    if (isinstance(user.solde, int) and user.solde >= deduct) or (not isinstance(user.solde, int)):
                                        user.solde = user.solde - deduct
                                        db.add(user)
                                        create_notification(
                                            db,
                                            user.id,
                                            NotificationType.LATE_PAYMENT,
                                            "Pénalité appliquée",
                                            f"Une pénalité de {penalty} FCFA a été appliquée pour retard de paiement.",
                                            lien=f"/groups/{cycle.groupe_id}/contributions",
                                        )
                                except Exception:
                                    pass
                        except Exception:
                            pass

                processed += 1

    db.commit()
    return {"processed": processed}


@router.post("/admin/send-reminders")
def send_reminders(db: DbSession, current_user: CurrentUser):
    """Send reminders for contributions due within REMINDER_DAYS for groups accessible to the user."""
    return run_send_reminders(db, current_user)


@router.post("/admin/process-late")
def process_late_contributions(db: DbSession, current_user: CurrentUser):
    """Mark pending contributions as LATE for cycles past their end date, notify members and optionally apply penalty."""
    return run_process_late(db, current_user)
