from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class DashboardStats(BaseModel):
    groupes_actifs: int
    membres_actifs: int
    cotisations_en_attente: int
    emprunts_en_attente: int
    remboursements_en_attente: int
    caisse_totale: Decimal
    prochain_beneficiaire_nom: str | None = None
    prochain_beneficiaire_groupe: str | None = None
    prochain_beneficiaire_cycle: int | None = None
    collecte_ce_mois: Decimal | None = None
    emprunts_en_cours_count: int | None = None
    emprunts_en_cours_montant: Decimal | None = None
    taux_paiement: float | None = None
    cotisations_confirmees: int | None = None
    cotisations_retard: int | None = None
    emprunts_en_retard: int | None = None

    model_config = {"from_attributes": True}


class DashboardActivityItem(BaseModel):
    id: int
    type: str
    titre: str
    description: str
    date: datetime
    statut: str
    montant: str | None = None
    groupe: str | None = None

    model_config = {"from_attributes": True}
