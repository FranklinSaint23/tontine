from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.v1.routes.memberships import ensure_group_manager
from app.api.v1.routes.notifications import create_notification
from app.models.enums import LoanStatus, NotificationType, PaymentStatus, UserRole
from app.models.group import Group
from app.models.loan import Loan
from app.models.membership import Membership
from app.models.repayment import Repayment
from app.schemas.loan import LoanCreate, LoanRead
from app.schemas.repayment import RepaymentCreate, RepaymentRead


router = APIRouter()


@router.get("/groups/{group_id}/loans", response_model=list[LoanRead])
def list_loans(group_id: int, db: DbSession, current_user: CurrentUser) -> list[Loan]:
    group = ensure_group_manager(db.get(Group, group_id), current_user)
    return list(db.scalars(select(Loan).where(Loan.groupe_id == group.id).order_by(Loan.id.desc())))


@router.get("/groups/{group_id}/repayments", response_model=list[RepaymentRead])
def list_repayments(group_id: int, db: DbSession, current_user: CurrentUser) -> list[Repayment]:
    group = ensure_group_manager(db.get(Group, group_id), current_user)
    return list(
        db.scalars(
            select(Repayment)
            .join(Loan)
            .where(Loan.groupe_id == group.id)
            .order_by(Repayment.date_paiement.desc())
        )
    )


@router.post("/groups/{group_id}/loans", response_model=LoanRead, status_code=status.HTTP_201_CREATED)
def create_loan(group_id: int, payload: LoanCreate, db: DbSession, current_user: CurrentUser) -> Loan:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Groupe introuvable")

    borrower = db.get(Membership, payload.emprunteur_id)
    if borrower is None or borrower.groupe_id != group.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Emprunteur invalide pour ce groupe")

    is_manager = current_user.role == UserRole.SUPER_ADMIN or group.gestionnaire_id == current_user.id
    if not is_manager and borrower.utilisateur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous ne pouvez pas demander un emprunt pour un autre membre")

    loan = Loan(**payload.model_dump(), groupe_id=group.id, statut=LoanStatus.PENDING)
    db.add(loan)
    if not is_manager and group.gestionnaire_id:
        create_notification(
            db,
            group.gestionnaire_id,
            NotificationType.LOAN,
            "Demande d'emprunt",
            f"{current_user.nom} demande {payload.montant} FCFA à approuver",
            lien=f"/groups/{group.id}/loans",
        )

    db.commit()
    db.refresh(loan)
    return loan


@router.patch("/loans/{loan_id}/approve", response_model=LoanRead)
def approve_loan(loan_id: int, db: DbSession, current_user: CurrentUser) -> Loan:
    loan = db.get(Loan, loan_id)
    if loan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emprunt introuvable")
    ensure_group_manager(loan.groupe, current_user)

    loan.statut = LoanStatus.APPROVED
    if loan.emprunteur and loan.emprunteur.utilisateur_id:
        create_notification(
            db,
            loan.emprunteur.utilisateur_id,
            NotificationType.LOAN,
            "Emprunt approuvé",
            f"Votre demande de {loan.montant} FCFA a été approuvée",
            lien=f"/groups/{loan.groupe_id}/loans",
        )

    db.commit()
    db.refresh(loan)
    return loan


@router.post("/loans/{loan_id}/repayments", response_model=RepaymentRead, status_code=status.HTTP_201_CREATED)
def create_repayment(
    loan_id: int,
    payload: RepaymentCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> Repayment:
    loan = db.get(Loan, loan_id)
    if loan is None or payload.emprunt_id != loan.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emprunt introuvable")
    ensure_group_manager(loan.groupe, current_user)

    repayment = Repayment(**payload.model_dump(), statut=PaymentStatus.PENDING)
    db.add(repayment)
    db.commit()
    db.refresh(repayment)
    return repayment


@router.patch("/repayments/{repayment_id}/confirm", response_model=RepaymentRead)
def confirm_repayment(repayment_id: int, db: DbSession, current_user: CurrentUser) -> Repayment:
    repayment = db.get(Repayment, repayment_id)
    if repayment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Remboursement introuvable")
    ensure_group_manager(repayment.emprunt.groupe, current_user)

    repayment.statut = PaymentStatus.CONFIRMED
    db.commit()
    db.refresh(repayment)
    return repayment
