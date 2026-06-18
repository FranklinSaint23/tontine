from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ContributionFrequency, GroupStatus, GroupType, db_enum


class Group(Base):
    __tablename__ = "groupes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nom: Mapped[str] = mapped_column(String(150), index=True)
    code_invitation: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    gestionnaire_id: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"))
    montant_cotisation: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    frequence: Mapped[ContributionFrequency] = mapped_column(
        db_enum(ContributionFrequency, "contribution_frequency")
    )
    type: Mapped[GroupType] = mapped_column(db_enum(GroupType, "group_type"), default=GroupType.ROTATING)
    date_debut: Mapped[date] = mapped_column(Date)
    statut: Mapped[GroupStatus] = mapped_column(db_enum(GroupStatus, "group_status"), default=GroupStatus.ACTIVE)

    gestionnaire = relationship("User", back_populates="groupes_geres")
    membres = relationship("Membership", back_populates="groupe")
    cycles = relationship("Cycle", back_populates="groupe")
    emprunts = relationship("Loan", back_populates="groupe")
    demandes_adhesion = relationship("JoinRequest", back_populates="groupe")

    @property
    def membres_count(self) -> int:
        from app.models.enums import MembershipStatus
        return sum(1 for m in self.membres if m.statut == MembershipStatus.ACTIVE)

    @property
    def progres_pourcentage(self) -> int:
        from app.models.enums import CycleStatus, MembershipStatus, PaymentStatus
        active_cycle = next((c for c in self.cycles if c.statut == CycleStatus.IN_PROGRESS), None)
        if not active_cycle:
            return 0
        active_members = sum(1 for m in self.membres if m.statut == MembershipStatus.ACTIVE)
        if active_members == 0:
            return 0
        confirmed_contribs = sum(1 for co in active_cycle.cotisations if co.statut == PaymentStatus.CONFIRMED)
        return int((confirmed_contribs / active_members) * 100)
