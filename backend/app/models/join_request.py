from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import JoinRequestStatus, db_enum


class JoinRequest(Base):
    __tablename__ = "demandes_adhesion"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    groupe_id: Mapped[int] = mapped_column(ForeignKey("groupes.id"))
    utilisateur_id: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"))
    message: Mapped[str | None] = mapped_column(String(500))
    statut: Mapped[JoinRequestStatus] = mapped_column(
        db_enum(JoinRequestStatus, "join_request_status"),
        default=JoinRequestStatus.PENDING,
    )
    date_demande: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    date_traitement: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    groupe = relationship("Group", back_populates="demandes_adhesion")
    utilisateur = relationship("User", back_populates="demandes_adhesion")
