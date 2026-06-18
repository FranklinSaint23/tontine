from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import LoanStatus, db_enum


class Loan(Base):
    __tablename__ = "emprunts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    groupe_id: Mapped[int] = mapped_column(ForeignKey("groupes.id"))
    emprunteur_id: Mapped[int] = mapped_column(ForeignKey("membres_groupe.id"))
    montant: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    taux_interet: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    date_demande: Mapped[date] = mapped_column(Date)
    date_limite: Mapped[date] = mapped_column(Date)
    statut: Mapped[LoanStatus] = mapped_column(db_enum(LoanStatus, "loan_status"), default=LoanStatus.PENDING)

    groupe = relationship("Group", back_populates="emprunts")
    emprunteur = relationship("Membership")
    remboursements = relationship("Repayment", back_populates="emprunt")

    @property
    def montant_total_a_rembourser(self) -> Decimal:
        return self.montant + (self.montant * self.taux_interet / Decimal("100"))
