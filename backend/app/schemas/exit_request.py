from datetime import datetime

from pydantic import BaseModel

from app.models.enums import ExitRequestStatus


class ExitRequestCreate(BaseModel):
    groupe_id: int
    motif: str | None = None


class ExitRequestRead(BaseModel):
    id: int
    groupe_id: int
    membre_id: int
    motif: str | None
    statut: ExitRequestStatus
    date_demande: datetime
    date_traitement: datetime | None

    model_config = {"from_attributes": True}
