from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.v1.routes.memberships import ensure_group_access, ensure_group_manager
from app.api.v1.routes.notifications import create_notification
from app.models.contribution import Contribution
from app.models.cycle import Cycle
from app.models.enums import NotificationType, PaymentStatus, UserRole
from app.models.group import Group
from app.models.membership import Membership
from app.schemas.contribution import ContributionCreate, ContributionRead


router = APIRouter()


@router.get("/groups/{group_id}/contributions", response_model=list[ContributionRead])
def list_contributions(group_id: int, db: DbSession, current_user: CurrentUser) -> list[Contribution]:
    group = ensure_group_access(db.get(Group, group_id), current_user, db)
    return list(
        db.scalars(
            select(Contribution)
            .join(Cycle)
            .where(Cycle.groupe_id == group.id)
            .order_by(Contribution.date_paiement.desc())
        )
    )


@router.post("/groups/{group_id}/contributions", response_model=ContributionRead, status_code=status.HTTP_201_CREATED)
def create_contribution(
    group_id: int,
    payload: ContributionCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> Contribution:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Groupe introuvable")

    cycle = db.get(Cycle, payload.cycle_id)
    member = db.get(Membership, payload.membre_id)
    if cycle is None or cycle.groupe_id != group.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cycle invalide pour ce groupe")
    if member is None or member.groupe_id != group.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Membre invalide pour ce groupe")

    is_manager = current_user.role == UserRole.SUPER_ADMIN or group.gestionnaire_id == current_user.id
    if not is_manager:
        if member.utilisateur_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous ne pouvez payer qu'une cotisation de votre propre compte")
    else:
        ensure_group_manager(group, current_user)

    contribution = Contribution(**payload.model_dump(), statut=PaymentStatus.PENDING)
    db.add(contribution)
    if not is_manager and group.gestionnaire_id:
        create_notification(
            db,
            group.gestionnaire_id,
            NotificationType.CONTRIBUTION,
            "Cotisation reçue",
            f"{current_user.nom} a payé {payload.montant} FCFA ({group.nom})",
            lien=f"/groups/{group.id}/contributions",
        )

    db.commit()
    db.refresh(contribution)
    return contribution


@router.patch("/contributions/{contribution_id}/confirm", response_model=ContributionRead)
def confirm_contribution(contribution_id: int, db: DbSession, current_user: CurrentUser) -> Contribution:
    contribution = db.get(Contribution, contribution_id)
    if contribution is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cotisation introuvable")
    ensure_group_manager(contribution.cycle.groupe, current_user)

    contribution.statut = PaymentStatus.CONFIRMED
    if contribution.membre and contribution.membre.utilisateur_id:
        create_notification(
            db,
            contribution.membre.utilisateur_id,
            NotificationType.CONTRIBUTION,
            "Paiement confirmé",
            f"Votre cotisation de {contribution.montant} FCFA a été confirmée",
            lien=f"/groups/{contribution.cycle.groupe_id}/contributions",
        )

    db.commit()
    db.refresh(contribution)
    return contribution


@router.delete("/contributions/{contribution_id}")
def reject_contribution(
    contribution_id: int, 
    motif: str, 
    db: DbSession, 
    current_user: CurrentUser
) -> dict:
    contribution = db.get(Contribution, contribution_id)
    if contribution is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cotisation introuvable")
    ensure_group_manager(contribution.cycle.groupe, current_user)

    if contribution.membre and contribution.membre.utilisateur_id:
        create_notification(
            db,
            contribution.membre.utilisateur_id,
            NotificationType.CONTRIBUTION,
            "Paiement rejeté",
            f"Votre cotisation de {contribution.montant} FCFA a été rejetée. Motif: {motif}",
            lien=f"/groups/{contribution.cycle.groupe_id}/contributions",
        )

    db.delete(contribution)
    db.commit()
    return {"status": "success", "message": "Cotisation rejetée"}


@router.post("/groups/{group_id}/members/{member_id}/remind")
def remind_member(
    group_id: int,
    member_id: int,
    db: DbSession,
    current_user: CurrentUser
) -> dict:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Groupe introuvable")
    ensure_group_manager(group, current_user)

    member = db.get(Membership, member_id)
    if member is None or member.groupe_id != group.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membre introuvable")

    if member.utilisateur_id:
        create_notification(
            db,
            member.utilisateur_id,
            NotificationType.CONTRIBUTION,
            "Rappel de cotisation",
            f"Le gestionnaire vous rappelle de payer votre cotisation pour le groupe {group.nom}.",
            lien=f"/groups/{group.id}/contributions",
        )

    return {"status": "success", "message": "Rappel envoyé"}

