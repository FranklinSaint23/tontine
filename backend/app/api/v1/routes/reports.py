from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from sqlalchemy import func, or_, select
from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.models.contribution import Contribution
from app.models.cycle import Cycle
from app.models.enums import LoanStatus, MembershipStatus, PaymentStatus, UserRole, CycleStatus
from app.models.group import Group
from app.models.loan import Loan
from app.models.membership import Membership
from app.models.repayment import Repayment

router = APIRouter()

# Schemas for reports
class EvolutionItem(BaseModel):
    mois: str
    montant: float
    annee: int

class GroupParticipation(BaseModel):
    groupe: str
    taux: float

class MemberReportItem(BaseModel):
    nom: str
    telephone: str
    groupe: str
    cotisations_payees: int
    cotisations_totales: int
    retards: int
    emprunts: int
    score: float

class CycleReportItem(BaseModel):
    cycle: str
    groupe: str
    beneficiaire: str
    montant_distribue: Optional[float] = None
    taux_collecte: float

class ReportsPayload(BaseModel):
    total_collecte: float
    total_distribue: float
    en_caisse: float
    emprunts_en_cours: float
    emprunts_en_cours_count: int
    evolution_cotisations: list[EvolutionItem]
    taux_participation: float
    participation_par_groupe: list[GroupParticipation]
    membres_report: list[MemberReportItem]
    cycles_report: list[CycleReportItem]


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


@router.get("", response_model=ReportsPayload)
def get_reports_data(
    db: DbSession,
    current_user: CurrentUser,
    group_id: Optional[int] = None,
    period: Optional[str] = "tous"
) -> ReportsPayload:
    # 1. Fetch group IDs accessible by the current user
    all_group_ids = _accessible_group_ids(db, current_user)

    # Apply group filter if supplied
    if group_id and group_id in all_group_ids:
        group_ids = [group_id]
    else:
        group_ids = all_group_ids

    # 3. Dynamic calculations if we have actual database data!
    # Period date filter helper
    now_dt = datetime.now(timezone.utc)
    start_date = None
    if period == "ce_mois":
        start_date = datetime(now_dt.year, now_dt.month, 1, tzinfo=timezone.utc)
    elif period == "cette_annee":
        start_date = datetime(now_dt.year, 1, 1, tzinfo=timezone.utc)

    # Total collected
    total_collecte_query = select(func.coalesce(func.sum(Contribution.montant), 0)).select_from(Contribution).join(Cycle).where(
        Cycle.groupe_id.in_(group_ids),
        Contribution.statut == PaymentStatus.CONFIRMED
    )
    if start_date:
        total_collecte_query = total_collecte_query.where(Contribution.date_paiement >= start_date)
    total_collecte = float(db.scalar(total_collecte_query) or 0)

    # Total repayments
    repayments_query = select(func.coalesce(func.sum(Repayment.montant), 0)).select_from(Repayment).join(Loan).where(
        Loan.groupe_id.in_(group_ids),
        Repayment.statut == PaymentStatus.CONFIRMED
    )
    if start_date:
        repayments_query = repayments_query.where(Repayment.date_paiement >= start_date)
    total_repayments = float(db.scalar(repayments_query) or 0)

    # Total distributed: Sum of payouts for completed cycles
    completed_cycles_query = select(Cycle).where(
        Cycle.groupe_id.in_(group_ids),
        Cycle.statut == CycleStatus.COMPLETED
    )
    if start_date:
        # using cycle date_fin
        completed_cycles_query = completed_cycles_query.where(Cycle.date_fin >= start_date.date())
    completed_cycles = db.scalars(completed_cycles_query).all()

    total_distribue = 0.0
    for cycle in completed_cycles:
        # Sum of contributions confirmed in this cycle (or group's expected sum)
        cycle_contribs = float(db.scalar(
            select(func.coalesce(func.sum(Contribution.montant), 0))
            .select_from(Contribution)
            .where(Contribution.cycle_id == cycle.id, Contribution.statut == PaymentStatus.CONFIRMED)
        ) or 0)
        # If no contributions recorded, default to group's expected size * contribution_amount
        if cycle_contribs == 0:
            m_count = db.scalar(
                select(func.count()).select_from(Membership).where(
                    Membership.groupe_id == cycle.groupe_id,
                    Membership.statut == MembershipStatus.ACTIVE
                )
            ) or 1
            cycle_contribs = float(cycle.groupe.montant_cotisation * m_count)
        total_distribue += cycle_contribs

    # Total loans granted
    loans_query = select(Loan).where(
        Loan.groupe_id.in_(group_ids),
        Loan.statut.in_([LoanStatus.APPROVED, LoanStatus.REPAID])
    )
    if start_date:
        loans_query = loans_query.where(Loan.date_demande >= start_date.date())
    all_loans = db.scalars(loans_query).all()
    total_loans_granted = sum(float(l.montant) for l in all_loans)

    # Outstanding/active loans (approved and not fully repaid yet)
    emprunts_en_cours = 0.0
    emprunts_en_cours_count = 0
    active_loans = db.scalars(
        select(Loan).where(
            Loan.groupe_id.in_(group_ids),
            Loan.statut == LoanStatus.APPROVED
        )
    ).all()

    for loan in active_loans:
        repaid_for_loan = float(db.scalar(
            select(func.coalesce(func.sum(Repayment.montant), 0))
            .select_from(Repayment)
            .where(Repayment.emprunt_id == loan.id, Repayment.statut == PaymentStatus.CONFIRMED)
        ) or 0)
        outstanding = float(loan.montant_total_a_rembourser) - repaid_for_loan
        if outstanding > 0:
            emprunts_en_cours += outstanding
            emprunts_en_cours_count += 1

    # Cash in hand
    en_caisse = max(0.0, total_collecte + total_repayments - total_distribue - total_loans_granted)

    # 4. Evolution of contributions (Last 6 months)
    # Generate list of past 6 months
    french_months = {
        1: "Jan", 2: "Fév", 3: "Mar", 4: "Avr", 5: "Mai", 6: "Juin",
        7: "Juil", 8: "Août", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Déc"
    }
    
    evolution_list = []
    # Fetch all confirmed contributions in last 6 months
    six_months_ago = now_dt - timedelta(days=180)
    contributions_6m = db.scalars(
        select(Contribution)
        .join(Cycle)
        .where(
            Cycle.groupe_id.in_(group_ids),
            Contribution.statut == PaymentStatus.CONFIRMED,
            Contribution.date_paiement >= six_months_ago
        )
    ).all()

    # Group by month and year
    monthly_data = {}
    for i in range(5, -1, -1):
        target_date = now_dt - timedelta(days=i*30)
        key = (target_date.year, target_date.month)
        monthly_data[key] = 0.0

    for contrib in contributions_6m:
        c_date = contrib.date_paiement
        key = (c_date.year, c_date.month)
        if key in monthly_data:
            monthly_data[key] += float(contrib.montant)

    for (yr, mth), amount in sorted(monthly_data.items()):
        evolution_list.append(
            EvolutionItem(
                mois=french_months.get(mth, str(mth)),
                montant=amount,
                annee=yr
            )
        )

    # 5. Global participation rate
    total_contribs_query = select(func.count()).select_from(Contribution).join(Cycle).where(
        Cycle.groupe_id.in_(group_ids)
    )
    confirmed_contribs_query = select(func.count()).select_from(Contribution).join(Cycle).where(
        Cycle.groupe_id.in_(group_ids),
        Contribution.statut == PaymentStatus.CONFIRMED
    )
    
    total_c = db.scalar(total_contribs_query) or 0
    confirmed_c = db.scalar(confirmed_contribs_query) or 0
    taux_participation = (confirmed_c / total_c * 100.0) if total_c > 0 else 100.0

    # 6. Participation rate by group
    participation_par_groupe = []
    groups = db.scalars(select(Group).where(Group.id.in_(group_ids))).all()
    for gp in groups:
        gp_total = db.scalar(
            select(func.count()).select_from(Contribution).join(Cycle).where(Cycle.groupe_id == gp.id)
        ) or 0
        gp_confirmed = db.scalar(
            select(func.count()).select_from(Contribution).join(Cycle).where(
                Cycle.groupe_id == gp.id,
                Contribution.statut == PaymentStatus.CONFIRMED
            )
        ) or 0
        gp_rate = (gp_confirmed / gp_total * 100.0) if gp_total > 0 else 100.0
        participation_par_groupe.append(
            GroupParticipation(groupe=f"Groupe {gp.nom}", taux=round(gp_rate, 1))
        )

    # 7. Member Reports
    membres_report = []
    memberships = db.scalars(
        select(Membership)
        .where(
            Membership.groupe_id.in_(group_ids),
            Membership.statut == MembershipStatus.ACTIVE
        )
    ).all()

    for mb in memberships:
        # Confirmed contributions count
        mb_confirmed = db.scalar(
            select(func.count()).select_from(Contribution).join(Cycle).where(
                Cycle.groupe_id == mb.groupe_id,
                Contribution.membre_id == mb.id,
                Contribution.statut == PaymentStatus.CONFIRMED
            )
        ) or 0

        # Total contributions count
        mb_total = db.scalar(
            select(func.count()).select_from(Contribution).join(Cycle).where(
                Cycle.groupe_id == mb.groupe_id,
                Contribution.membre_id == mb.id
            )
        ) or 0

        # Late contributions count
        mb_late = db.scalar(
            select(func.count()).select_from(Contribution).join(Cycle).where(
                Cycle.groupe_id == mb.groupe_id,
                Contribution.membre_id == mb.id,
                Contribution.statut == PaymentStatus.LATE
            )
        ) or 0

        # Active loans count
        mb_loans = db.scalar(
            select(func.count()).select_from(Loan).where(
                Loan.groupe_id == mb.groupe_id,
                Loan.emprunteur_id == mb.id,
                Loan.statut == LoanStatus.APPROVED
            )
        ) or 0

        score = (mb_confirmed / mb_total * 100.0) if mb_total > 0 else 100.0

        membres_report.append(
            MemberReportItem(
                nom=mb.utilisateur.nom if mb.utilisateur else "Inconnu",
                telephone=mb.utilisateur.telephone or mb.utilisateur.numero_mobile or "+237 000 000 000",
                groupe=mb.groupe.nom if mb.groupe else "—",
                cotisations_payees=mb_confirmed,
                cotisations_totales=mb_total,
                retards=mb_late,
                emprunts=mb_loans,
                score=round(score, 1)
            )
        )

    # Sort members by score desc
    membres_report.sort(key=lambda m: m.score, reverse=True)

    # 8. Cycle Reports
    cycles_report = []
    cycles = db.scalars(
        select(Cycle)
        .where(Cycle.groupe_id.in_(group_ids))
        .order_by(Cycle.date_debut.desc())
    ).all()

    for cy in cycles:
        benef_name = cy.beneficiaire.utilisateur.nom if cy.beneficiaire and cy.beneficiaire.utilisateur else "Inconnu"
        
        # Payout amount
        payout = None
        if cy.statut == CycleStatus.COMPLETED:
            payout = float(db.scalar(
                select(func.coalesce(func.sum(Contribution.montant), 0))
                .select_from(Contribution)
                .where(Contribution.cycle_id == cy.id, Contribution.statut == PaymentStatus.CONFIRMED)
            ) or 0)
            if payout == 0:
                # Default to expected
                m_count = db.scalar(
                    select(func.count()).select_from(Membership).where(
                        Membership.groupe_id == cy.groupe_id,
                        Membership.statut == MembershipStatus.ACTIVE
                    )
                ) or 1
                payout = float(cy.groupe.montant_cotisation * m_count)

        # Collection rate
        cy_total = db.scalar(
            select(func.count()).select_from(Contribution).where(Contribution.cycle_id == cy.id)
        ) or 0
        cy_confirmed = db.scalar(
            select(func.count()).select_from(Contribution).where(
                Contribution.cycle_id == cy.id,
                Contribution.statut == PaymentStatus.CONFIRMED
            )
        ) or 0
        cy_rate = (cy_confirmed / cy_total * 100.0) if cy_total > 0 else 100.0

        cycles_report.append(
            CycleReportItem(
                cycle=f"Cycle {cy.numero_cycle}",
                groupe=cy.groupe.nom if cy.groupe else "—",
                beneficiaire=benef_name,
                montant_distribue=payout,
                taux_collecte=round(cy_rate, 1)
            )
        )

    return ReportsPayload(
        total_collecte=total_collecte,
        total_distribue=total_distribue,
        en_caisse=en_caisse,
        emprunts_en_cours=emprunts_en_cours,
        emprunts_en_cours_count=emprunts_en_cours_count,
        evolution_cotisations=evolution_list,
        taux_participation=round(taux_participation, 1),
        participation_par_groupe=participation_par_groupe,
        membres_report=membres_report,
        cycles_report=cycles_report
    )
