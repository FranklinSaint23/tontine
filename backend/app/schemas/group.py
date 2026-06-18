from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import ContributionFrequency, GroupStatus, GroupType


class GroupBase(BaseModel):
    nom: str
    montant_cotisation: Decimal
    frequence: ContributionFrequency
    type: GroupType = GroupType.ROTATING
    date_debut: date
    statut: GroupStatus = GroupStatus.ACTIVE


class GroupCreate(GroupBase):
    pass


class GroupRead(GroupBase):
    id: int
    code_invitation: str
    gestionnaire_id: int
    membres_count: int = 0
    progres_pourcentage: int = 0

    model_config = {"from_attributes": True}
