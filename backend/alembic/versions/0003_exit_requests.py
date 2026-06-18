"""exit requests

Revision ID: 0003_exit_requests
Revises: 0002_join_requests
Create Date: 2026-05-17
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0003_exit_requests"
down_revision: str | None = "0002_join_requests"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


exit_request_status = sa.Enum("en_attente", "approuvee", "rejetee", name="exit_request_status")


def upgrade() -> None:
    op.create_table(
        "demandes_sortie",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("groupe_id", sa.Integer(), nullable=False),
        sa.Column("membre_id", sa.Integer(), nullable=False),
        sa.Column("motif", sa.String(length=500), nullable=True),
        sa.Column("statut", exit_request_status, nullable=False),
        sa.Column("date_demande", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("date_traitement", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["groupe_id"], ["groupes.id"]),
        sa.ForeignKeyConstraint(["membre_id"], ["membres_groupe.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_demandes_sortie_id"), "demandes_sortie", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_demandes_sortie_id"), table_name="demandes_sortie")
    op.drop_table("demandes_sortie")
    exit_request_status.drop(op.get_bind())
