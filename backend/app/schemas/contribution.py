from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import PaymentStatus


class ContributionCreate(BaseModel):
    cycle_id: int
    membre_id: int
    montant: Decimal
    numero_transaction: str


class ContributionRead(ContributionCreate):
    id: int
    date_paiement: datetime
    statut: PaymentStatus

    model_config = {"from_attributes": True}

