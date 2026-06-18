from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.contribution import Contribution
from app.models.cycle import Cycle
from app.models.group import Group
from app.models.loan import Loan
from app.models.membership import Membership
from app.models.repayment import Repayment
from app.models.user import User
from app.models.enums import CycleStatus, LoanStatus, MembershipStatus, PaymentStatus


def get_user_context(db: Session, user: User) -> str:
    memberships = list(
        db.scalars(
            select(Membership)
            .where(Membership.utilisateur_id == user.id)
            .where(Membership.statut == MembershipStatus.ACTIVE)
        )
    )

    groups_info = []
    for m in memberships:
        group = db.get(Group, m.groupe_id)
        if not group:
            continue
        contribs = list(db.scalars(select(Contribution).where(Contribution.membre_id == m.id)))
        confirmed = sum(1 for c in contribs if c.statut == PaymentStatus.CONFIRMED)
        late = sum(1 for c in contribs if c.statut == PaymentStatus.LATE)
        groups_info.append(
            f"  - {group.nom}: cotisation {group.montant_cotisation} FCFA/{group.frequence}, "
            f"{confirmed} confirmées, {late} en retard"
        )

    lines = [
        f"Membre: {user.nom} (email: {user.email})",
        f"Rôle: {user.role}",
        f"Solde portefeuille: {user.solde} FCFA",
        f"Groupes actifs: {len(memberships)}",
    ]
    if groups_info:
        lines.append("Groupes:")
        lines.extend(groups_info)

    return "\n".join(lines)


def get_group_stats_context(db: Session, group: Group) -> str:
    active_members = [m for m in group.membres if m.statut == MembershipStatus.ACTIVE]
    completed_cycles = [c for c in group.cycles if c.statut == CycleStatus.COMPLETED]
    active_cycle = next((c for c in group.cycles if c.statut == CycleStatus.IN_PROGRESS), None)

    all_contributions: list[Contribution] = []
    for cycle in group.cycles:
        all_contributions.extend(cycle.cotisations)

    total_collected = sum(float(c.montant) for c in all_contributions if c.statut == PaymentStatus.CONFIRMED)
    pending_count = sum(1 for c in all_contributions if c.statut == PaymentStatus.PENDING)
    late_count = sum(1 for c in all_contributions if c.statut == PaymentStatus.LATE)
    active_loans = [l for l in group.emprunts if l.statut == LoanStatus.APPROVED]

    members_info = []
    for m in active_members:
        user = db.get(User, m.utilisateur_id)
        if not user:
            continue
        contribs = list(db.scalars(select(Contribution).where(Contribution.membre_id == m.id)))
        confirmed = sum(1 for c in contribs if c.statut == PaymentStatus.CONFIRMED)
        late = sum(1 for c in contribs if c.statut == PaymentStatus.LATE)
        members_info.append(f"  - {user.nom}: {confirmed} confirmées, {late} en retard")

    lines = [
        f"Groupe: {group.nom} (statut: {group.statut})",
        f"Type: {group.type} | Fréquence: {group.frequence}",
        f"Cotisation: {group.montant_cotisation} FCFA",
        f"Membres actifs: {len(active_members)}",
        f"Cycles complétés: {len(completed_cycles)} / {len(group.cycles)}",
        f"Cycle en cours: {'Oui – cycle #' + str(active_cycle.numero_cycle) if active_cycle else 'Non'}",
        f"Total collecté (confirmé): {total_collected:,.0f} FCFA",
        f"Contributions en attente: {pending_count} | En retard: {late_count}",
        f"Emprunts actifs: {len(active_loans)}",
    ]
    if members_info:
        lines.append("Membres:")
        lines.extend(members_info)

    return "\n".join(lines)


def get_borrower_context(db: Session, membership: Membership, group: Group) -> str:
    user = db.get(User, membership.utilisateur_id)
    contribs = list(db.scalars(select(Contribution).where(Contribution.membre_id == membership.id)))
    confirmed = [c for c in contribs if c.statut == PaymentStatus.CONFIRMED]
    late = [c for c in contribs if c.statut == PaymentStatus.LATE]
    pending = [c for c in contribs if c.statut == PaymentStatus.PENDING]
    total = len(contribs)
    on_time_rate = len(confirmed) / total * 100 if total > 0 else 100.0

    existing_loans = list(
        db.scalars(
            select(Loan)
            .where(Loan.groupe_id == group.id)
            .where(Loan.emprunteur_id == membership.id)
        )
    )
    active_loans = [l for l in existing_loans if l.statut == LoanStatus.APPROVED]
    repaid_loans = [l for l in existing_loans if l.statut == LoanStatus.REPAID]

    total_repaid = Decimal("0")
    for loan in repaid_loans:
        for r in loan.remboursements:
            if r.statut == PaymentStatus.CONFIRMED:
                total_repaid += r.montant

    return "\n".join([
        f"Emprunteur: {user.nom if user else 'Inconnu'}",
        f"Membre depuis: {membership.date_adhesion}",
        f"Cotisations: {total} total, {len(confirmed)} confirmées ({on_time_rate:.0f}% ponctualité), "
        f"{len(late)} en retard, {len(pending)} en attente",
        f"Prêts remboursés: {len(repaid_loans)}",
        f"Prêts actifs: {len(active_loans)}",
        f"Total remboursé: {total_repaid:,.0f} FCFA",
        f"Cotisation groupe: {group.montant_cotisation} FCFA/{group.frequence}",
    ])


def get_members_summary(db: Session, group: Group) -> list[dict]:
    result = []
    for m in group.membres:
        if m.statut != MembershipStatus.ACTIVE:
            continue
        user = db.get(User, m.utilisateur_id)
        contribs = list(db.scalars(select(Contribution).where(Contribution.membre_id == m.id)))
        confirmed = sum(1 for c in contribs if c.statut == PaymentStatus.CONFIRMED)
        late = sum(1 for c in contribs if c.statut == PaymentStatus.LATE)
        pending = sum(1 for c in contribs if c.statut == PaymentStatus.PENDING)
        total = len(contribs)
        on_time_rate = confirmed / total * 100 if total > 0 else 100.0
        result.append({
            "membre_id": m.id,
            "nom": user.nom if user else "Inconnu",
            "email": user.email if user else "",
            "total": total,
            "confirmees": confirmed,
            "en_retard": late,
            "en_attente": pending,
            "taux_ponctualite": on_time_rate,
            "ordre_reception": m.ordre_reception,
        })
    return result
