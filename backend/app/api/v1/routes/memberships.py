from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.v1.routes.notifications import create_notification
from app.models.enums import MembershipStatus, NotificationType, UserRole
from app.models.group import Group
from app.models.membership import Membership
from app.models.user import User
from app.schemas.membership import MembershipCreate, MembershipRead


router = APIRouter()


def ensure_group_manager(group: Group | None, current_user: CurrentUser) -> Group:
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Groupe introuvable")
    if current_user.role != UserRole.SUPER_ADMIN and group.gestionnaire_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces refuse")
    return group


def ensure_group_access(group: Group | None, current_user: CurrentUser, db: DbSession) -> Group:
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Groupe introuvable")
    if current_user.role == UserRole.SUPER_ADMIN or group.gestionnaire_id == current_user.id:
        return group

    membership = db.scalar(
        select(Membership).where(
            Membership.groupe_id == group.id,
            Membership.utilisateur_id == current_user.id,
            Membership.statut == MembershipStatus.ACTIVE,
        )
    )
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces refuse")
    return group


@router.get("/groups/{group_id}/members", response_model=list[MembershipRead])
def list_members(group_id: int, db: DbSession, current_user: CurrentUser) -> list[Membership]:
    group = ensure_group_access(db.get(Group, group_id), current_user, db)
    return list(
        db.scalars(
            select(Membership)
            .where(Membership.groupe_id == group.id)
            .order_by(Membership.ordre_reception.asc(), Membership.id.asc())
        )
    )


@router.post("/groups/{group_id}/members", response_model=MembershipRead, status_code=status.HTTP_201_CREATED)
def add_member(
    group_id: int,
    payload: MembershipCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> Membership:
    group = ensure_group_manager(db.get(Group, group_id), current_user)
    if db.get(User, payload.utilisateur_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    existing = db.scalar(
        select(Membership).where(
            Membership.groupe_id == group.id,
            Membership.utilisateur_id == payload.utilisateur_id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ce membre existe deja dans le groupe")

    membership = Membership(
        groupe_id=group.id,
        utilisateur_id=payload.utilisateur_id,
        ordre_reception=payload.ordre_reception,
        statut=MembershipStatus.ACTIVE,
        date_adhesion=payload.date_adhesion,
    )
    db.add(membership)
    create_notification(
        db,
        payload.utilisateur_id,
        NotificationType.MEMBER,
        "Nouveau membre",
        f"Vous avez rejoint le Groupe {group.nom}",
        lien=f"/groups/{group.id}/members",
    )
    db.commit()
    db.refresh(membership)
    return membership


@router.patch("/memberships/{membership_id}", response_model=MembershipRead)
def update_membership(
    membership_id: int,
    payload: dict,
    db: DbSession,
    current_user: CurrentUser,
) -> Membership:
    membership = db.get(Membership, membership_id)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membre introuvable")
    ensure_group_manager(membership.groupe, current_user)

    if "ordre_reception" in payload:
        membership.ordre_reception = payload["ordre_reception"]
    if "statut" in payload:
        try:
            membership.statut = MembershipStatus(payload["statut"])
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statut invalide")

    db.commit()
    db.refresh(membership)
    return membership


@router.delete("/memberships/{membership_id}")
def delete_membership(
    membership_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    membership = db.get(Membership, membership_id)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membre introuvable")
    ensure_group_manager(membership.groupe, current_user)

    db.delete(membership)
    db.commit()
    return {"status": "success", "message": "Membre exclu avec succes"}

