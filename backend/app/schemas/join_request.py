from datetime import datetime

from pydantic import BaseModel

from app.models.enums import JoinRequestStatus


class JoinRequestCreate(BaseModel):
    code_invitation: str | None = None
    groupe_id: int | None = None
    utilisateur_id: int | None = None
    message: str | None = None


class JoinRequestRead(BaseModel):
    id: int
    groupe_id: int
    utilisateur_id: int
    message: str | None
    statut: JoinRequestStatus
    date_demande: datetime
    date_traitement: datetime | None

    model_config = {"from_attributes": True}
