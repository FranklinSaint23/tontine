from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import PaymentStatus, db_enum


class Repayment(Base):
    __tablename__ = "remboursements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    emprunt_id: Mapped[int] = mapped_column(ForeignKey("emprunts.id"))
    montant: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    numero_transaction: Mapped[str] = mapped_column(String(120), index=True)
    date_paiement: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    statut: Mapped[PaymentStatus] = mapped_column(db_enum(PaymentStatus, "payment_status"), default=PaymentStatus.PENDING)

    emprunt = relationship("Loan", back_populates="remboursements")
