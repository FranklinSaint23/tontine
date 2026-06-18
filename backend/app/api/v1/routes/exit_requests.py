from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.v1.routes.memberships import ensure_group_manager
from app.models.enums import ExitRequestStatus, MembershipStatus
from app.models.exit_request import ExitRequest
from app.models.group import Group
from app.models.membership import Membership
from app.schemas.exit_request import ExitRequestCreate, ExitRequestRead


router = APIRouter()


@router.get("/groups/{group_id}/exit-requests", response_model=list[ExitRequestRead])
def list_exit_requests(group_id: int, db: DbSession, current_user: CurrentUser) -> list[ExitRequest]:
    group = ensure_group_manager(db.get(Group, group_id), current_user)
    return list(
        db.scalars(
            select(ExitRequest)
            .where(ExitRequest.groupe_id == group.id)
            .order_by(ExitRequest.date_demande.desc())
        )
    )


@router.post("/exit-requests", response_model=ExitRequestRead, status_code=status.HTTP_201_CREATED)
def create_exit_request(payload: ExitRequestCreate, db: DbSession, current_user: CurrentUser) -> ExitRequest:
    membership = db.scalar(
        select(Membership).where(
            Membership.groupe_id == payload.groupe_id,
            Membership.utilisateur_id == current_user.id,
            Membership.statut == MembershipStatus.ACTIVE,
        )
    )
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adhesion active introuvable")

    existing_request = db.scalar(
        select(ExitRequest).where(
            ExitRequest.groupe_id == payload.groupe_id,
            ExitRequest.membre_id == membership.id,
            ExitRequest.statut == ExitRequestStatus.PENDING,
        )
    )
    if existing_request is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Une demande de sortie est deja en attente")

    exit_request = ExitRequest(
        groupe_id=payload.groupe_id,
        membre_id=membership.id,
        motif=payload.motif,
        statut=ExitRequestStatus.PENDING,
    )
    db.add(exit_request)
    db.commit()
    db.refresh(exit_request)
    return exit_request


@router.patch("/exit-requests/{request_id}/approve", response_model=ExitRequestRead)
def approve_exit_request(request_id: int, db: DbSession, current_user: CurrentUser) -> ExitRequest:
    exit_request = db.get(ExitRequest, request_id)
    if exit_request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande introuvable")
    ensure_group_manager(exit_request.groupe, current_user)

    if exit_request.statut != ExitRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Demande deja traitee")

    exit_request.membre.statut = MembershipStatus.SUSPENDED
    exit_request.statut = ExitRequestStatus.APPROVED
    exit_request.date_traitement = datetime.now(timezone.utc)
    db.commit()
    db.refresh(exit_request)
    return exit_request


@router.patch("/exit-requests/{request_id}/reject", response_model=ExitRequestRead)
def reject_exit_request(request_id: int, db: DbSession, current_user: CurrentUser) -> ExitRequest:
    exit_request = db.get(ExitRequest, request_id)
    if exit_request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande introuvable")
    ensure_group_manager(exit_request.groupe, current_user)

    if exit_request.statut != ExitRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Demande deja traitee")

    exit_request.statut = ExitRequestStatus.REJECTED
    exit_request.date_traitement = datetime.now(timezone.utc)
    db.commit()
    db.refresh(exit_request)
    return exit_request
