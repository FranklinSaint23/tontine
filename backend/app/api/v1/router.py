from fastapi import APIRouter

from app.api.v1.routes import (
    ai,
    auth,
    contributions,
    cycles,
    dashboard,
    exit_requests,
    groups,
    join_requests,
    loans,
    memberships,
    notifications,
    maintenance,
    reports,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(join_requests.router, tags=["join_requests"])
api_router.include_router(exit_requests.router, tags=["exit_requests"])
api_router.include_router(memberships.router, tags=["memberships"])
api_router.include_router(cycles.router, tags=["cycles"])
api_router.include_router(contributions.router, tags=["contributions"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(loans.router, tags=["loans"])
api_router.include_router(maintenance.router, prefix="/maintenance", tags=["maintenance"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
