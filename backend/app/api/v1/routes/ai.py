from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.ai import service
from app.api.deps import CurrentUser, DbSession
from app.models.group import Group
from app.models.membership import Membership

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    group_id: int | None = None


class LoanRiskRequest(BaseModel):
    emprunteur_id: int
    montant: float


class NotifGenRequest(BaseModel):
    type: str = "rappel_cotisation"


class RulesQARequest(BaseModel):
    question: str


class ClassifyRequest(BaseModel):
    motif: str
    type: str = "loan"


def _get_group_or_404(db: DbSession, group_id: int) -> Group:
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Groupe introuvable")
    return group


def _wrap_groq(fn):
    try:
        return fn()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erreur Groq API: {exc}",
        ) from exc


# ── 1. Chatbot ────────────────────────────────────────────────────────────────

@router.post("/chat")
def chat(payload: ChatRequest, db: DbSession, current_user: CurrentUser) -> dict:
    reply = _wrap_groq(lambda: service.chatbot(db, current_user, payload.message, payload.group_id))
    return {"reply": reply}


# ── 2. Risque prêt ────────────────────────────────────────────────────────────

@router.post("/groups/{group_id}/loan-risk")
def loan_risk(group_id: int, payload: LoanRiskRequest, db: DbSession, current_user: CurrentUser) -> dict:
    group = _get_group_or_404(db, group_id)
    membership = db.get(Membership, payload.emprunteur_id)
    if not membership or membership.groupe_id != group.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Membre invalide pour ce groupe")
    return _wrap_groq(lambda: service.analyze_loan_risk(db, group, membership, payload.montant))


# ── 3. Résumé rapport ─────────────────────────────────────────────────────────

@router.get("/groups/{group_id}/report-summary")
def report_summary(group_id: int, db: DbSession, current_user: CurrentUser) -> dict:
    group = _get_group_or_404(db, group_id)
    return {"resume": _wrap_groq(lambda: service.generate_report_summary(db, group))}


# ── 4. Notifications intelligentes ───────────────────────────────────────────

@router.post("/groups/{group_id}/notifications/generate")
def generate_notifications(group_id: int, payload: NotifGenRequest, db: DbSession, current_user: CurrentUser) -> dict:
    group = _get_group_or_404(db, group_id)
    messages = _wrap_groq(lambda: service.generate_smart_notifications(db, group, payload.type))
    return {"messages": messages}


# ── 5. Détection anomalies ────────────────────────────────────────────────────

@router.get("/groups/{group_id}/anomalies")
def anomalies(group_id: int, db: DbSession, current_user: CurrentUser) -> dict:
    group = _get_group_or_404(db, group_id)
    return {"anomalies": _wrap_groq(lambda: service.detect_anomalies(db, group))}


# ── 6. Prédiction défaillances ────────────────────────────────────────────────

@router.get("/groups/{group_id}/predict-defaults")
def predict_defaults(group_id: int, db: DbSession, current_user: CurrentUser) -> dict:
    group = _get_group_or_404(db, group_id)
    return {"predictions": _wrap_groq(lambda: service.predict_defaults(db, group))}


# ── 7. Conseils financiers ────────────────────────────────────────────────────

@router.get("/me/advice")
def financial_advice(db: DbSession, current_user: CurrentUser) -> dict:
    return {"conseils": _wrap_groq(lambda: service.get_financial_advice(db, current_user))}


# ── 8. Q&A règles du groupe ───────────────────────────────────────────────────

@router.post("/groups/{group_id}/qa")
def rules_qa(group_id: int, payload: RulesQARequest, db: DbSession, current_user: CurrentUser) -> dict:
    group = _get_group_or_404(db, group_id)
    return {"reponse": _wrap_groq(lambda: service.answer_group_rules(db, group, payload.question))}


# ── 9. Suggestion ordre de tirage ─────────────────────────────────────────────

@router.get("/groups/{group_id}/suggest-order")
def suggest_order(group_id: int, db: DbSession, current_user: CurrentUser) -> dict:
    group = _get_group_or_404(db, group_id)
    return _wrap_groq(lambda: service.suggest_rotation_order(db, group))


# ── 10. Classification demandes ───────────────────────────────────────────────

@router.post("/requests/classify")
def classify(payload: ClassifyRequest, db: DbSession, current_user: CurrentUser) -> dict:
    return _wrap_groq(lambda: service.classify_request(payload.motif, payload.type))
