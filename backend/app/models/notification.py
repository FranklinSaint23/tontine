from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import NotificationType, db_enum


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    utilisateur_id: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"), nullable=False)
    type: Mapped[NotificationType] = mapped_column(db_enum(NotificationType, "notification_type"))
    titre: Mapped[str] = mapped_column(String(150))
    message: Mapped[str] = mapped_column(String(512))
    lu: Mapped[bool] = mapped_column(Boolean, default=False, server_default=sa.text("false"), nullable=False)
    date_creation: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    lien: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    destinataire = relationship("User", back_populates="notifications")
