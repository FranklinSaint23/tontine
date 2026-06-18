"""notifications table

Revision ID: 0005_notifications
Revises: 0004_user_wallet
Create Date: 2026-05-19
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0005_notifications"
down_revision: str | Sequence[str] | None = "0004_user_wallet"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("utilisateur_id", sa.Integer(), sa.ForeignKey("utilisateurs.id"), nullable=False),
        sa.Column("type", sa.Enum("cotisation", "retard", "cycle", "emprunt", "membre", name="notification_type"), nullable=False),
        sa.Column("titre", sa.String(length=150), nullable=False),
        sa.Column("message", sa.String(length=512), nullable=False),
        sa.Column("lu", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("date_creation", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("lien", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("notifications")
