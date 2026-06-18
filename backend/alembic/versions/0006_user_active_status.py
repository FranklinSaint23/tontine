"""user active status

Revision ID: 0006_user_active_status
Revises: 0005_notifications
Create Date: 2026-06-02
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0006_user_active_status"
down_revision: str | Sequence[str] | None = "0005_notifications"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "utilisateurs",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )


def downgrade() -> None:
    op.drop_column("utilisateurs", "is_active")
