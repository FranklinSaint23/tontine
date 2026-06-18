import json

from sqlalchemy.orm import Session

from app.ai.groq_client import complete
from app.ai.context_builder import (
    get_borrower_context,
    get_group_stats_context,
    get_members_summary,
    get_user_context,
)
from app.models.group import Group
from app.models.membership import Membership
from app.models.user import User


def _parse_json(content: str) -> dict | list | None:
    try:
        start = content.find("{")
        end = content.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(content[start:end])
    except Exception:
        pass
    return None


# ── 1. Chatbot assistant ──────────────────────────────────────────────────────

def chatbot(db: Session, user: User, message: str, group_id: int | None = None) -> str:
    user_ctx = get_user_context(db, user)

    group_ctx = ""
    if group_id:
        from app.models.group import Group as G
        group = db.get(G, group_id)
        if group:
            group_ctx = f"\n\nGroupe sélectionné:\n{get_group_stats_context(db, group)}"

    system = (
        "Tu es l'assistant intelligent de TontineApp, une plateforme de gestion de tontines.\n"
        "Tu aides les membres à comprendre leur situation financière, leurs cotisations, emprunts et cycles.\n"
        "Réponds en français, de façon claire et concise. Base-toi uniquement sur les données fournies.\n\n"
        f"Profil du membre:\n{user_ctx}{group_ctx}"
    )
    return complete([{"role": "system", "content": system}, {"role": "user", "content": message}])


# ── 2. Analyse risque prêt ────────────────────────────────────────────────────

def analyze_loan_risk(db: Session, group: Group, membership: Membership, montant: float) -> dict:
    ctx = get_borrower_context(db, membership, group)

    prompt = (
        f"Analyse le risque de cet emprunt dans une tontine.\n\n"
        f"Données emprunteur:\n{ctx}\n\n"
        f"Montant demandé: {montant:,.0f} FCFA\n\n"
        "Retourne UNIQUEMENT un JSON valide:\n"
        '{"score": 75, "niveau": "faible", "recommandation": "Approuver", "details": "..."}\n\n'
        "score: 0 (très risqué) à 100 (très sûr)\n"
        'niveau: "faible" | "moyen" | "élevé"\n'
        'recommandation: "Approuver" | "Approuver avec conditions" | "Rejeter"'
    )

    content = complete([{"role": "user", "content": prompt}], temperature=0.2)
    data = _parse_json(content)
    if isinstance(data, dict) and "score" in data:
        return data
    return {
        "score": 50,
        "niveau": "moyen",
        "recommandation": "Approuver avec conditions",
        "details": content,
    }


# ── 3. Résumé rapport ─────────────────────────────────────────────────────────

def generate_report_summary(db: Session, group: Group) -> str:
    ctx = get_group_stats_context(db, group)
    prompt = (
        f"Génère un résumé narratif en français de l'état de ce groupe de tontine. "
        f"2-3 paragraphes, clair et informatif.\n\nDonnées:\n{ctx}"
    )
    return complete([{"role": "user", "content": prompt}])


# ── 4. Notifications personnalisées ──────────────────────────────────────────

def generate_smart_notifications(db: Session, group: Group, notif_type: str) -> list[dict]:
    members_data = get_members_summary(db, group)
    labels = {
        "rappel_cotisation": "rappel de cotisation avant échéance",
        "retard": "notification de retard de paiement",
        "bienvenue": "message de bienvenue personnalisé",
        "encouragement": "message d'encouragement basé sur l'historique",
    }
    label = labels.get(notif_type, notif_type)

    members_text = "\n".join(
        f"- {m['nom']}: {m['confirmees']} confirmées, {m['en_retard']} retards, "
        f"{m['taux_ponctualite']:.0f}% ponctualité"
        for m in members_data
    )

    prompt = (
        f"Génère des messages de notification personnalisés de type «{label}».\n"
        f"Groupe: {group.nom} | Cotisation: {group.montant_cotisation} FCFA/{group.frequence}\n\n"
        f"Membres:\n{members_text}\n\n"
        "Retourne UNIQUEMENT un JSON valide:\n"
        '{"messages": [{"nom": "Prénom", "message": "Message personnalisé"}, ...]}\n\n'
        "Messages en français, chaleureux et adaptés à chaque profil."
    )

    content = complete([{"role": "user", "content": prompt}], temperature=0.7, max_tokens=2048)
    data = _parse_json(content)
    if isinstance(data, dict):
        return data.get("messages", [])
    return []


# ── 5. Détection anomalies ────────────────────────────────────────────────────

def detect_anomalies(db: Session, group: Group) -> list[dict]:
    members_data = get_members_summary(db, group)
    ctx = get_group_stats_context(db, group)

    members_text = "\n".join(
        f"- {m['nom']}: {m['total']} cotisations, {m['confirmees']} confirmées, "
        f"{m['en_retard']} retards, {m['taux_ponctualite']:.0f}% ponctualité"
        for m in members_data
    )

    prompt = (
        f"Analyse ce groupe de tontine pour détecter des anomalies et comportements atypiques.\n\n"
        f"{ctx}\n\nMembres:\n{members_text}\n\n"
        "Retourne UNIQUEMENT un JSON valide:\n"
        '{"anomalies": [{"type": "retard_chronique", "membre_nom": "Nom", '
        '"description": "...", "severite": "haute"}, ...]}\n\n'
        "types: retard_chronique | absence_paiement | pattern_suspect | risque_groupe | performance_excellente\n"
        "severites: basse | moyenne | haute\n"
        "Liste vide si aucune anomalie détectée."
    )

    content = complete([{"role": "user", "content": prompt}], temperature=0.2, max_tokens=2048)
    data = _parse_json(content)
    if isinstance(data, dict):
        return data.get("anomalies", [])
    return []


# ── 6. Prédiction défaillance ─────────────────────────────────────────────────

def predict_defaults(db: Session, group: Group) -> list[dict]:
    members_data = get_members_summary(db, group)

    members_text = "\n".join(
        f"- {m['nom']}: {m['taux_ponctualite']:.0f}% ponctualité, "
        f"{m['en_retard']} retards, {m['en_attente']} en attente"
        for m in members_data
    )

    prompt = (
        f"Prédit les risques de défaillance pour le prochain cycle.\n"
        f"Groupe: {group.nom} | Cotisation: {group.montant_cotisation} FCFA\n\n"
        f"Historique:\n{members_text}\n\n"
        "Retourne UNIQUEMENT un JSON valide:\n"
        '{"predictions": [{"membre_nom": "Nom", "risque": "faible", '
        '"probabilite": 85, "raison": "..."}, ...]}\n\n'
        "risque: faible | moyen | élevé\n"
        "probabilite: probabilité de payer à temps (0-100)\n"
        "Inclure tous les membres."
    )

    content = complete([{"role": "user", "content": prompt}], temperature=0.2, max_tokens=2048)
    data = _parse_json(content)
    if isinstance(data, dict):
        return data.get("predictions", [])
    return []


# ── 7. Conseils financiers personnalisés ──────────────────────────────────────

def get_financial_advice(db: Session, user: User) -> str:
    ctx = get_user_context(db, user)
    prompt = (
        f"En tant que conseiller financier, analyse ce profil de tontine et donne "
        f"3-4 conseils financiers pratiques et personnalisés.\n\n{ctx}\n\n"
        "Sois encourageant, concret et en français."
    )
    return complete([{"role": "user", "content": prompt}])


# ── 8. Q&A règles du groupe ───────────────────────────────────────────────────

def answer_group_rules(db: Session, group: Group, question: str) -> str:
    ctx = get_group_stats_context(db, group)
    prompt = (
        f"Tu es un assistant pour le groupe de tontine «{group.nom}».\n"
        f"Réponds à cette question d'un membre basé uniquement sur les infos disponibles.\n\n"
        f"Données groupe:\n{ctx}\n\n"
        f"Question: {question}\n\n"
        "Réponds en français, clairement et précisément."
    )
    return complete([{"role": "user", "content": prompt}])


# ── 9. Suggestion ordre de tirage ─────────────────────────────────────────────

def suggest_rotation_order(db: Session, group: Group) -> dict:
    members_data = get_members_summary(db, group)

    members_text = "\n".join(
        f"- {m['nom']}: ponctualité {m['taux_ponctualite']:.0f}%, "
        f"{m['en_retard']} retards, ordre actuel: {m['ordre_reception'] or 'non défini'}"
        for m in members_data
    )

    prompt = (
        f"Suggère un ordre de réception optimisé pour ce groupe de tontine rotatif.\n"
        f"Groupe: {group.nom} | {len(members_data)} membres | {group.montant_cotisation} FCFA\n\n"
        f"Membres:\n{members_text}\n\n"
        "Retourne UNIQUEMENT un JSON valide:\n"
        '{"ordre": [{"position": 1, "membre_nom": "Nom", "raison": "..."}], '
        '"explication": "Logique globale utilisée"}\n\n'
        "Prends en compte la fiabilité, l'équité et l'ancienneté."
    )

    content = complete([{"role": "user", "content": prompt}], temperature=0.4, max_tokens=2048)
    data = _parse_json(content)
    if isinstance(data, dict) and "ordre" in data:
        return data
    return {"ordre": [], "explication": content}


# ── 10. Classification demandes ───────────────────────────────────────────────

def classify_request(motif: str, request_type: str) -> dict:
    type_label = "prêt" if request_type == "loan" else "sortie/adhésion"
    prompt = (
        f"Classifie cette demande de {type_label} dans une tontine.\n\n"
        f"Motif: \"{motif}\"\n\n"
        "Retourne UNIQUEMENT un JSON valide:\n"
        '{"categorie": "urgence_medicale", "priorite": "haute", '
        '"resume": "1 phrase", "sentiment": "neutre", "recommandation": "..."}\n\n'
        "categories: urgence_medicale | projet_immobilier | education | commerce | urgence_familiale | investissement | autre\n"
        "priorites: basse | normale | haute | urgente\n"
        "sentiment: positif | neutre | négatif | urgent"
    )

    content = complete([{"role": "user", "content": prompt}], temperature=0.2)
    data = _parse_json(content)
    if isinstance(data, dict) and "categorie" in data:
        return data
    return {
        "categorie": "autre",
        "priorite": "normale",
        "resume": motif[:100],
        "sentiment": "neutre",
        "recommandation": "Examiner manuellement",
    }
