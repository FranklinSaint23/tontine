from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy import func, or_, select

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.models.contribution import Contribution
from app.models.cycle import Cycle
from app.models.enums import CycleStatus, LoanStatus, MembershipStatus, PaymentStatus, UserRole
from app.models.group import Group
from app.models.loan import Loan
from app.models.membership import Membership
from app.models.repayment import Repayment
from app.schemas.dashboard import DashboardActivityItem, DashboardStats

router = APIRouter()


def _accessible_group_ids(db, current_user):
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
                        (Membership.utilisateur_id == current_user.id)
                        & (Membership.statut == MembershipStatus.ACTIVE),
                    )
                )
                .distinct()
            )
        )
    return [group.id for group in groups]


@router.get("", response_model=DashboardStats)
def get_dashboard_stats(db: DbSession, current_user: CurrentUser) -> DashboardStats:
    group_ids = _accessible_group_ids(db, current_user)
    
    if not group_ids:
        return DashboardStats(
            groupes_actifs=0,
            membres_actifs=0,
            cotisations_en_attente=0,
            emprunts_en_attente=0,
            remboursements_en_attente=0,
            caisse_totale=Decimal("0.0"),
            prochain_beneficiaire_nom=None,
            prochain_beneficiaire_groupe=None,
            prochain_beneficiaire_cycle=None,
            collecte_ce_mois=Decimal("0.0"),
            emprunts_en_cours_count=0,
            emprunts_en_cours_montant=Decimal("0.0"),
            taux_paiement=0.0,
            cotisations_confirmees=0,
            cotisations_retard=0,
            emprunts_en_retard=0,
        )

    # Dynamic calculation based on active database
    members_count = db.scalar(
        select(func.count()).select_from(Membership).where(Membership.groupe_id.in_(group_ids))
    ) or 0

    pending_contributions = db.scalar(
        select(func.count())
        .select_from(Contribution)
        .join(Cycle)
        .where(Cycle.groupe_id.in_(group_ids), Contribution.statut == PaymentStatus.PENDING)
    ) or 0

    confirmed_contributions = db.scalar(
        select(func.count())
        .select_from(Contribution)
        .join(Cycle)
        .where(Cycle.groupe_id.in_(group_ids), Contribution.statut == PaymentStatus.CONFIRMED)
    ) or 0

    late_contributions = db.scalar(
        select(func.count())
        .select_from(Contribution)
        .join(Cycle)
        .where(Cycle.groupe_id.in_(group_ids), Contribution.statut == PaymentStatus.LATE)
    ) or 0

    total_contributions = db.scalar(
        select(func.count())
        .select_from(Contribution)
        .join(Cycle)
        .where(Cycle.groupe_id.in_(group_ids))
    ) or 0

    taux_paiement = round((confirmed_contributions / total_contributions) * 100, 1) if total_contributions else 0.0

    pending_loans = db.scalar(
        select(func.count())
        .select_from(Loan)
        .where(Loan.groupe_id.in_(group_ids), Loan.statut == LoanStatus.PENDING)
    ) or 0

    pending_repayments = db.scalar(
        select(func.count())
        .select_from(Repayment)
        .join(Loan)
        .where(Loan.groupe_id.in_(group_ids), Repayment.statut == PaymentStatus.PENDING)
    ) or 0

    cash_total = db.scalar(
        select(func.coalesce(func.sum(Contribution.montant), 0))
        .select_from(Contribution)
        .join(Cycle)
        .where(Cycle.groupe_id.in_(group_ids), Contribution.statut == PaymentStatus.CONFIRMED)
    ) or Decimal("0.0")

    # Prochain beneficiaire
    next_cycle = db.scalars(
        select(Cycle)
        .where(Cycle.groupe_id.in_(group_ids), Cycle.statut == CycleStatus.IN_PROGRESS)
        .order_by(Cycle.date_debut.asc())
    ).first()

    prochain_beneficiaire_nom = None
    prochain_beneficiaire_groupe = None
    prochain_beneficiaire_cycle = None

    if next_cycle:
        prochain_beneficiaire_nom = next_cycle.beneficiaire.utilisateur.nom if next_cycle.beneficiaire and next_cycle.beneficiaire.utilisateur else "Inconnu"
        prochain_beneficiaire_groupe = next_cycle.groupe.nom if next_cycle.groupe else "—"
        prochain_beneficiaire_cycle = next_cycle.numero_cycle

    # Collected this month
    now_dt = datetime.now(timezone.utc)
    start_of_month = datetime(now_dt.year, now_dt.month, 1, tzinfo=timezone.utc)
    collecte_ce_mois = db.scalar(
        select(func.coalesce(func.sum(Contribution.montant), 0))
        .select_from(Contribution)
        .join(Cycle)
        .where(
            Cycle.groupe_id.in_(group_ids),
            Contribution.statut == PaymentStatus.CONFIRMED,
            Contribution.date_paiement >= start_of_month
        )
    ) or Decimal("0.0")

    # Loans active
    emprunts_en_cours_count = 0
    emprunts_en_cours_montant = Decimal("0.0")
    active_loans = db.scalars(
        select(Loan).where(
            Loan.groupe_id.in_(group_ids),
            Loan.statut == LoanStatus.APPROVED
        )
    ).all()

    emprunts_en_retard = 0
    today = date.today()
    overdue_loans = db.scalars(
        select(Loan)
        .where(
            Loan.groupe_id.in_(group_ids),
            Loan.statut == LoanStatus.APPROVED,
            Loan.date_limite < today,
        )
    ).all()

    for loan in overdue_loans:
        repaid_for_loan = db.scalar(
            select(func.coalesce(func.sum(Repayment.montant), 0))
            .select_from(Repayment)
            .where(Repayment.emprunt_id == loan.id, Repayment.statut == PaymentStatus.CONFIRMED)
        ) or Decimal("0.0")
        outstanding = loan.montant_total_a_rembourser - repaid_for_loan
        if outstanding > 0:
            emprunts_en_retard += 1

    for loan in active_loans:
        repaid_for_loan = db.scalar(
            select(func.coalesce(func.sum(Repayment.montant), 0))
            .select_from(Repayment)
            .where(Repayment.emprunt_id == loan.id, Repayment.statut == PaymentStatus.CONFIRMED)
        ) or Decimal("0.0")
        outstanding = loan.montant_total_a_rembourser - repaid_for_loan
        if outstanding > 0:
            emprunts_en_cours_montant += outstanding
            emprunts_en_cours_count += 1

    return DashboardStats(
        groupes_actifs=len(group_ids),
        membres_actifs=members_count,
        cotisations_en_attente=pending_contributions,
        emprunts_en_attente=pending_loans,
        remboursements_en_attente=pending_repayments,
        caisse_totale=cash_total,
        prochain_beneficiaire_nom=prochain_beneficiaire_nom,
        prochain_beneficiaire_groupe=prochain_beneficiaire_groupe,
        prochain_beneficiaire_cycle=prochain_beneficiaire_cycle,
        collecte_ce_mois=collecte_ce_mois,
        emprunts_en_cours_count=emprunts_en_cours_count,
        emprunts_en_cours_montant=emprunts_en_cours_montant,
        taux_paiement=taux_paiement,
        cotisations_confirmees=confirmed_contributions,
        cotisations_retard=late_contributions,
        emprunts_en_retard=emprunts_en_retard,
    )


@router.get("/recent", response_model=list[DashboardActivityItem])
def get_recent_activity(db: DbSession, current_user: CurrentUser) -> list[DashboardActivityItem]:
    group_ids = _accessible_group_ids(db, current_user)
    if not group_ids:
        return []

    contributions = list(
        db.scalars(
            select(Contribution)
            .join(Cycle)
            .where(Cycle.groupe_id.in_(group_ids))
            .order_by(Contribution.date_paiement.desc())
            .limit(4)
        )
    )
    repayments = list(
        db.scalars(
            select(Repayment)
            .join(Loan)
            .where(Loan.groupe_id.in_(group_ids))
            .order_by(Repayment.date_paiement.desc())
            .limit(4)
        )
    )
    loans = list(
        db.scalars(
            select(Loan)
            .where(Loan.groupe_id.in_(group_ids))
            .order_by(Loan.date_demande.desc())
            .limit(4)
        )
    )

    activities = []

    for contribution in contributions:
        member_name = getattr(contribution.membre.utilisateur, 'nom', 'Membre inconnu')
        activities.append(
            {
                'id': contribution.id,
                'type': 'contribution',
                'titre': f'Cotisation de {member_name}',
                'description': f'Cycle {contribution.cycle.numero_cycle} · {contribution.numero_transaction}',
                'date': contribution.date_paiement,
                'statut': contribution.statut.value,
                'montant': str(contribution.montant),
                'groupe': contribution.cycle.groupe.nom if contribution.cycle and contribution.cycle.groupe else None,
            }
        )

    for repayment in repayments:
        borrower_name = getattr(repayment.emprunt.emprunteur.utilisateur, 'nom', 'Emprunteur inconnu')
        activities.append(
            {
                'id': repayment.id,
                'type': 'remboursement',
                'titre': f'Rem. de {borrower_name}',
                'description': f'Emprunt #{repayment.emprunt.id} · {repayment.numero_transaction}',
                'date': repayment.date_paiement,
                'statut': repayment.statut.value,
                'montant': str(repayment.montant),
                'groupe': repayment.emprunt.groupe.nom if repayment.emprunt and repayment.emprunt.groupe else None,
            }
        )

    for loan in loans:
        borrower_name = getattr(loan.emprunteur.utilisateur, 'nom', 'Emprunteur inconnu')
        activities.append(
            {
                'id': loan.id,
                'type': 'emprunt',
                'titre': f'Demande de {borrower_name}',
                'description': f'{loan.montant} FCFA · limite {loan.date_limite}',
                'date': datetime.combine(loan.date_demande, datetime.min.time(), tzinfo=timezone.utc),
                'statut': loan.statut.value,
                'montant': str(loan.montant),
                'groupe': loan.groupe.nom if loan.groupe else None,
            }
        )

    activities.sort(key=lambda item: item['date'], reverse=True)
    return [DashboardActivityItem(**item) for item in activities[:4]]
