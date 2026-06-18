from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.v1.routes.memberships import ensure_group_access, ensure_group_manager
from app.api.v1.routes.notifications import create_notification
from app.models.cycle import Cycle
from app.models.enums import CycleStatus, NotificationType
from app.models.group import Group
from app.models.membership import Membership
from app.schemas.cycle import CycleCreate, CycleRead


router = APIRouter()


@router.get("/groups/{group_id}/cycles", response_model=list[CycleRead])
def list_cycles(group_id: int, db: DbSession, current_user: CurrentUser) -> list[Cycle]:
    group = ensure_group_access(db.get(Group, group_id), current_user, db)
    return list(db.scalars(select(Cycle).where(Cycle.groupe_id == group.id).order_by(Cycle.numero_cycle.desc())))


@router.post("/groups/{group_id}/cycles", response_model=CycleRead, status_code=status.HTTP_201_CREATED)
def create_cycle(group_id: int, payload: CycleCreate, db: DbSession, current_user: CurrentUser) -> Cycle:
    group = ensure_group_manager(db.get(Group, group_id), current_user)
    beneficiary = db.get(Membership, payload.beneficiaire_id)
    if beneficiary is None or beneficiary.groupe_id != group.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Beneficiaire invalide pour ce groupe")

    cycle = Cycle(**payload.model_dump(), groupe_id=group.id, statut=CycleStatus.IN_PROGRESS)
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle


@router.patch("/cycles/{cycle_id}/close", response_model=CycleRead)
def close_cycle(
    cycle_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> Cycle:
    cycle = db.get(Cycle, cycle_id)
    if cycle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cycle introuvable")
    ensure_group_manager(cycle.groupe, current_user)

    cycle.statut = CycleStatus.COMPLETED

    # Notify beneficiary of payout distribution
    if cycle.beneficiaire and cycle.beneficiaire.utilisateur_id:
        cotisation_amt = cycle.groupe.montant_cotisation or 0
        total_members = len([m for m in cycle.groupe.membres if m.statut == "actif"])
        jackpot = total_members * cotisation_amt
        
        create_notification(
            db,
            cycle.beneficiaire.utilisateur_id,
            NotificationType.CYCLE,
            "Cagnotte distribuée !",
            f"Félicitations ! La cagnotte du Cycle {cycle.numero_cycle} d'un montant de {jackpot} FCFA vous a été distribuée.",
            lien=f"/groups/{cycle.groupe_id}/cycles",
        )

    db.commit()
    db.refresh(cycle)
    return cycle

