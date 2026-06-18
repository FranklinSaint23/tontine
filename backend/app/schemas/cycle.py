from datetime import date

from pydantic import BaseModel

from app.models.enums import CycleStatus


class CycleCreate(BaseModel):
    numero_cycle: int
    beneficiaire_id: int
    date_debut: date
    date_fin: date


class CycleRead(CycleCreate):
    id: int
    groupe_id: int
    statut: CycleStatus

    model_config = {"from_attributes": True}

