"""Add reference_id to notifications

Revision ID: 0007_notification_reference_id
Revises: 0006_user_active_status
Create Date: 2026-06-03
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0007_notification_reference_id"
down_revision: str | Sequence[str] | None = "0006_user_active_status"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column("reference_id", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("notifications", "reference_id")
