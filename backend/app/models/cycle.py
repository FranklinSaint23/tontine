from datetime import date

from sqlalchemy import Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import CycleStatus, db_enum


class Cycle(Base):
    __tablename__ = "cycles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    groupe_id: Mapped[int] = mapped_column(ForeignKey("groupes.id"))
    numero_cycle: Mapped[int]
    beneficiaire_id: Mapped[int] = mapped_column(ForeignKey("membres_groupe.id"))
    date_debut: Mapped[date] = mapped_column(Date)
    date_fin: Mapped[date] = mapped_column(Date)
    statut: Mapped[CycleStatus] = mapped_column(db_enum(CycleStatus, "cycle_status"), default=CycleStatus.IN_PROGRESS)

    groupe = relationship("Group", back_populates="cycles")
    beneficiaire = relationship("Membership", back_populates="cycles_beneficiaire")
    cotisations = relationship("Contribution", back_populates="cycle")
