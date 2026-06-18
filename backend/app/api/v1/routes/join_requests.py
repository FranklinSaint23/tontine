from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.v1.routes.memberships import ensure_group_manager
from app.api.v1.routes.notifications import create_notification
from app.models.enums import JoinRequestStatus, MembershipStatus, NotificationType, UserRole
from app.models.group import Group
from app.models.join_request import JoinRequest
from app.models.membership import Membership
from app.schemas.join_request import JoinRequestCreate, JoinRequestRead


router = APIRouter()


@router.get("/groups/{group_id}/join-requests", response_model=list[JoinRequestRead])
def list_join_requests(group_id: int, db: DbSession, current_user: CurrentUser) -> list[JoinRequest]:
    group = ensure_group_manager(db.get(Group, group_id), current_user)
    return list(
        db.scalars(
            select(JoinRequest)
            .where(JoinRequest.groupe_id == group.id)
            .order_by(JoinRequest.date_demande.desc())
        )
    )


@router.post("/join-requests", response_model=JoinRequestRead, status_code=status.HTTP_201_CREATED)
def create_join_request(payload: JoinRequestCreate, db: DbSession, current_user: CurrentUser) -> JoinRequest:
    if payload.code_invitation:
        code = payload.code_invitation.strip().upper()
        group = db.scalar(select(Group).where(Group.code_invitation == code))
        if group is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code d'invitation invalide")
        target_user_id = current_user.id
    elif payload.utilisateur_id:
        group_id = payload.groupe_id if hasattr(payload, 'groupe_id') else None
        if not group_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Groupe requis")
        group = db.get(Group, group_id)
        if group is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Groupe introuvable")
        if current_user.role not in {UserRole.SUPER_ADMIN, UserRole.MANAGER} and group.gestionnaire_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
        target_user_id = payload.utilisateur_id
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code ou utilisateur requis")

    existing_membership = db.scalar(
        select(Membership).where(
            Membership.groupe_id == group.id,
            Membership.utilisateur_id == target_user_id,
        )
    )
    if existing_membership is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cet utilisateur est deja membre de ce groupe")

    existing_request = db.scalar(
        select(JoinRequest).where(
            JoinRequest.groupe_id == group.id,
            JoinRequest.utilisateur_id == target_user_id,
            JoinRequest.statut == JoinRequestStatus.PENDING,
        )
    )
    if existing_request is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Une demande est deja en attente")

    join_request = JoinRequest(
        groupe_id=group.id,
        utilisateur_id=target_user_id,
        message=payload.message,
        statut=JoinRequestStatus.PENDING,
    )
    db.add(join_request)
    db.flush()
    if group.gestionnaire_id:
        create_notification(
            db,
            group.gestionnaire_id,
            NotificationType.MEMBER,
            "Demande d'adhésion",
            f"{current_user.nom} souhaite rejoindre le groupe {group.nom}",
            lien=f"/groups/{group.id}/join-requests",
            reference_id=join_request.id,
        )
    create_notification(
        db,
        target_user_id,
        NotificationType.MEMBER,
        "Invitation reçue",
        f"Vous avez été invité à rejoindre le groupe {group.nom}",
        lien=f"/groups/{group.id}/join-requests",
        reference_id=join_request.id,
    )
    db.commit()
    db.refresh(join_request)
    return join_request


@router.patch("/join-requests/{request_id}/approve", response_model=JoinRequestRead)
def approve_join_request(request_id: int, db: DbSession, current_user: CurrentUser) -> JoinRequest:
    join_request = db.get(JoinRequest, request_id)
    if join_request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande introuvable")

    is_manager = (
        current_user.role == UserRole.SUPER_ADMIN
        or join_request.groupe.gestionnaire_id == current_user.id
    )
    is_target_user = join_request.utilisateur_id == current_user.id
    if not is_manager and not is_target_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if join_request.statut != JoinRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Demande deja traitee")

    existing_membership = db.scalar(
        select(Membership).where(
            Membership.groupe_id == join_request.groupe_id,
            Membership.utilisateur_id == join_request.utilisateur_id,
        )
    )
    if existing_membership is None:
        db.add(
            Membership(
                groupe_id=join_request.groupe_id,
                utilisateur_id=join_request.utilisateur_id,
                ordre_reception=None,
                statut=MembershipStatus.ACTIVE,
                date_adhesion=datetime.now(timezone.utc).date(),
            )
        )

    if is_manager and not is_target_user:
        create_notification(
            db,
            join_request.utilisateur_id,
            NotificationType.MEMBER,
            "Nouveau membre",
            f"Vous avez rejoint le Groupe {join_request.groupe.nom}",
            lien=f"/groups/{join_request.groupe_id}/members",
        )

    join_request.statut = JoinRequestStatus.APPROVED
    join_request.date_traitement = datetime.now(timezone.utc)
    db.commit()
    db.refresh(join_request)
    return join_request


@router.patch("/join-requests/{request_id}/reject", response_model=JoinRequestRead)
def reject_join_request(request_id: int, db: DbSession, current_user: CurrentUser) -> JoinRequest:
    join_request = db.get(JoinRequest, request_id)
    if join_request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande introuvable")
    ensure_group_manager(join_request.groupe, current_user)

    if join_request.statut != JoinRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Demande deja traitee")

    join_request.statut = JoinRequestStatus.REJECTED
    join_request.date_traitement = datetime.now(timezone.utc)
    db.commit()
    db.refresh(join_request)
    return join_request
