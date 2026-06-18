from datetime import date

from sqlalchemy import Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import MembershipStatus, db_enum


class Membership(Base):
    __tablename__ = "membres_groupe"
    __table_args__ = (UniqueConstraint("groupe_id", "utilisateur_id", name="uq_groupe_utilisateur"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    groupe_id: Mapped[int] = mapped_column(ForeignKey("groupes.id"))
    utilisateur_id: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"))
    ordre_reception: Mapped[int | None]
    statut: Mapped[MembershipStatus] = mapped_column(
        db_enum(MembershipStatus, "membership_status"),
        default=MembershipStatus.ACTIVE,
    )
    date_adhesion: Mapped[date] = mapped_column(Date)

    groupe = relationship("Group", back_populates="membres")
    utilisateur = relationship("User", back_populates="adhesions")
    cycles_beneficiaire = relationship("Cycle", back_populates="beneficiaire")
    demandes_sortie = relationship("ExitRequest", back_populates="membre")
