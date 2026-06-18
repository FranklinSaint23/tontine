from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import ExitRequestStatus, db_enum


class ExitRequest(Base):
    __tablename__ = "demandes_sortie"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    groupe_id: Mapped[int] = mapped_column(ForeignKey("groupes.id"))
    membre_id: Mapped[int] = mapped_column(ForeignKey("membres_groupe.id"))
    motif: Mapped[str | None] = mapped_column(String(500))
    statut: Mapped[ExitRequestStatus] = mapped_column(
        db_enum(ExitRequestStatus, "exit_request_status"),
        default=ExitRequestStatus.PENDING,
    )
    date_demande: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    date_traitement: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    groupe = relationship("Group")
    membre = relationship("Membership", back_populates="demandes_sortie")
