# Plateforme Tontine

Application web de gestion de tontine multi-groupes.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI + SQLAlchemy + Alembic
- Base de donnees: PostgreSQL
- Authentification: JWT + bcrypt

## Structure

```text
tontine/
├── backend/
└── frontend/
```

## Demarrage backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Avant de lancer l'API, adaptez `DATABASE_URL` dans `backend/.env` avec le vrai mot de passe PostgreSQL local, puis creez la base:

```bash
createdb -h localhost -U postgres tontine_app
alembic upgrade head
```

## Demarrage frontend

```bash
cd frontend
npm install
npm run dev
```
