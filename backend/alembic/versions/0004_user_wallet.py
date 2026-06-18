"""user wallet balance

Revision ID: 0004_user_wallet
Revises: 0003_exit_requests
Create Date: 2026-05-19
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0004_user_wallet"
down_revision: str | Sequence[str] | None = "0003_exit_requests"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("utilisateurs", sa.Column("solde", sa.Integer(), server_default="0", nullable=False))


def downgrade() -> None:
    op.drop_column("utilisateurs", "solde")
