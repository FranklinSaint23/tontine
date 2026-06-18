import secrets

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import or_, select

from app.api.deps import CurrentUser, DbSession
from app.models.enums import MembershipStatus, UserRole
from app.models.group import Group
from app.models.membership import Membership
from app.schemas.group import GroupCreate, GroupRead
from app.models.enums import GroupStatus


router = APIRouter()


@router.get("", response_model=list[GroupRead])
def list_groups(db: DbSession, current_user: CurrentUser) -> list[Group]:
    if current_user.role == UserRole.SUPER_ADMIN:
        return list(db.scalars(select(Group).order_by(Group.id.desc())))

    return list(
        db.scalars(
            select(Group)
            .outerjoin(Membership)
            .where(
                or_(
                    Group.gestionnaire_id == current_user.id,
                    (
                        (Membership.utilisateur_id == current_user.id)
                        & (Membership.statut == MembershipStatus.ACTIVE)
                    ),
                )
            )
            .distinct()
            .order_by(Group.id.desc())
        )
    )


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(payload: GroupCreate, db: DbSession, current_user: CurrentUser) -> Group:
    if current_user.role not in {UserRole.SUPER_ADMIN, UserRole.MANAGER}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un gestionnaire peut creer un groupe",
        )

    group = Group(**payload.model_dump(), gestionnaire_id=current_user.id)
    while True:
        group.code_invitation = secrets.token_urlsafe(6).upper().replace("-", "").replace("_", "")[:8]
        existing_code = db.scalar(select(Group).where(Group.code_invitation == group.code_invitation))
        if existing_code is None:
            break

    db.add(group)
    db.commit()
    db.refresh(group)

    # Ensure the group creator is also recorded as an active member
    from datetime import date as _date
    creator_membership = Membership(
        groupe_id=group.id,
        utilisateur_id=current_user.id,
        ordre_reception=1,
        statut=MembershipStatus.ACTIVE,
        date_adhesion=_date.today(),
    )
    db.add(creator_membership)
    db.commit()
    db.refresh(creator_membership)
    return group


@router.patch("/{group_id}/suspend", response_model=GroupRead)
def suspend_group(group_id: int, db: DbSession, current_user: CurrentUser) -> Group:
    group = db.scalar(select(Group).where(Group.id == group_id))
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Groupe introuvable")
    if current_user.role not in {UserRole.SUPER_ADMIN, UserRole.MANAGER} or (
        current_user.role == UserRole.MANAGER and group.gestionnaire_id != current_user.id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces refuse")
    group.statut = GroupStatus.ACTIVE if group.statut == GroupStatus.SUSPENDED else GroupStatus.SUSPENDED
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, db: DbSession, current_user: CurrentUser):
    from sqlalchemy import delete as sql_delete
    from app.models.contribution import Contribution
    from app.models.repayment import Repayment
    from app.models.cycle import Cycle
    from app.models.loan import Loan
    from app.models.exit_request import ExitRequest
    from app.models.join_request import JoinRequest

    group = db.scalar(select(Group).where(Group.id == group_id))
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Groupe introuvable")
    if current_user.role not in {UserRole.SUPER_ADMIN, UserRole.MANAGER} or (
        current_user.role == UserRole.MANAGER and group.gestionnaire_id != current_user.id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces refuse")

    # Collect IDs of children that are themselves parents
    cycle_ids = list(db.scalars(select(Cycle.id).where(Cycle.groupe_id == group_id)))
    loan_ids = list(db.scalars(select(Loan.id).where(Loan.groupe_id == group_id)))
    member_ids = list(db.scalars(select(Membership.id).where(Membership.groupe_id == group_id)))

    # Delete leaves first, then parents, then group
    if cycle_ids:
        db.execute(sql_delete(Contribution).where(Contribution.cycle_id.in_(cycle_ids)))
    if loan_ids:
        db.execute(sql_delete(Repayment).where(Repayment.emprunt_id.in_(loan_ids)))
    db.execute(sql_delete(ExitRequest).where(ExitRequest.groupe_id == group_id))
    db.execute(sql_delete(JoinRequest).where(JoinRequest.groupe_id == group_id))
    if cycle_ids:
        db.execute(sql_delete(Cycle).where(Cycle.id.in_(cycle_ids)))
    if loan_ids:
        db.execute(sql_delete(Loan).where(Loan.id.in_(loan_ids)))
    if member_ids:
        db.execute(sql_delete(Membership).where(Membership.id.in_(member_ids)))
    db.execute(sql_delete(Group).where(Group.id == group_id))
    db.commit()
    return None
