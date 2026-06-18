from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import LoanStatus


class LoanCreate(BaseModel):
    emprunteur_id: int
    montant: Decimal
    taux_interet: Decimal
    date_demande: date
    date_limite: date


class LoanRead(LoanCreate):
    id: int
    groupe_id: int
    statut: LoanStatus
    montant_total_a_rembourser: Decimal

    model_config = {"from_attributes": True}

