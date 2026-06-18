from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.api.v1.router import api_router
from app.core.config import settings
import app.models  # noqa: F401 — registers all SQLAlchemy models

# Scheduler imports
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.database import SessionLocal
from app.api.v1.routes import maintenance


app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def start_scheduler():
    """Start APScheduler and schedule daily maintenance jobs."""
    app.state.scheduler = BackgroundScheduler()

    def _job_send_reminders():
        db = SessionLocal()
        try:
            maintenance.run_send_reminders(db, current_user=None)
        finally:
            db.close()

    def _job_process_late():
        db = SessionLocal()
        try:
            maintenance.run_process_late(db, current_user=None)
        finally:
            db.close()

    # Schedule daily at 02:00 server time
    app.state.scheduler.add_job(_job_send_reminders, "cron", hour=2, minute=0, id="send_reminders")
    app.state.scheduler.add_job(_job_process_late, "cron", hour=2, minute=15, id="process_late")
    app.state.scheduler.start()


@app.on_event("shutdown")
def stop_scheduler():
    sched = getattr(app.state, "scheduler", None)
    if sched:
        sched.shutdown()


@app.exception_handler(OperationalError)
def database_error_handler(_request: Request, _exc: OperationalError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Base de donnees inaccessible. Verifiez DATABASE_URL dans backend/.env."},
    )


@app.exception_handler(UnicodeDecodeError)
def database_encoding_error_handler(_request: Request, _exc: UnicodeDecodeError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Connexion PostgreSQL refusee. Verifiez l'utilisateur, le mot de passe et la base."},
    )


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
