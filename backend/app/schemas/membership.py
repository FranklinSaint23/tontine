from datetime import date

from pydantic import BaseModel

from app.models.enums import MembershipStatus


class MembershipCreate(BaseModel):
    utilisateur_id: int
    ordre_reception: int | None = None
    date_adhesion: date


class MembershipRead(BaseModel):
    id: int
    groupe_id: int
    utilisateur_id: int
    ordre_reception: int | None
    statut: MembershipStatus
    date_adhesion: date

    model_config = {"from_attributes": True}

class InvitationGroupInfo(BaseModel):
    id: int
    nom: str
    montant_cotisation: float
    frequence: str
    type: str

    model_config = {"from_attributes": True}

class InvitationRead(MembershipRead):
    groupe: InvitationGroupInfo

    model_config = {"from_attributes": True}


