"""join requests

Revision ID: 0002_join_requests
Revises: 0001_initial_schema
Create Date: 2026-05-16
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0002_join_requests"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


join_request_status = sa.Enum("en_attente", "approuvee", "rejetee", name="join_request_status")


def upgrade() -> None:
    op.add_column("groupes", sa.Column("code_invitation", sa.String(length=24), nullable=True))
    op.execute("UPDATE groupes SET code_invitation = 'GRP-' || id WHERE code_invitation IS NULL")
    op.alter_column("groupes", "code_invitation", nullable=False)
    op.create_index(op.f("ix_groupes_code_invitation"), "groupes", ["code_invitation"], unique=True)

    op.create_table(
        "demandes_adhesion",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("groupe_id", sa.Integer(), nullable=False),
        sa.Column("utilisateur_id", sa.Integer(), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column("statut", join_request_status, nullable=False),
        sa.Column("date_demande", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("date_traitement", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["groupe_id"], ["groupes.id"]),
        sa.ForeignKeyConstraint(["utilisateur_id"], ["utilisateurs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_demandes_adhesion_id"), "demandes_adhesion", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_demandes_adhesion_id"), table_name="demandes_adhesion")
    op.drop_table("demandes_adhesion")
    op.drop_index(op.f("ix_groupes_code_invitation"), table_name="groupes")
    op.drop_column("groupes", "code_invitation")
    join_request_status.drop(op.get_bind())
