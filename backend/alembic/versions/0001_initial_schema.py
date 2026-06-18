"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-16
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


user_role = sa.Enum("super_admin", "gestionnaire", "membre", name="user_role")
contribution_frequency = sa.Enum("hebdo", "mensuel", name="contribution_frequency")
group_type = sa.Enum("rotatif", "credit", "les_deux", name="group_type")
group_status = sa.Enum("actif", "termine", "suspendu", name="group_status")
membership_status = sa.Enum("actif", "suspendu", name="membership_status")
cycle_status = sa.Enum("en_cours", "termine", name="cycle_status")
payment_status = sa.Enum("en_attente", "confirme", "retard", name="payment_status")
loan_status = sa.Enum("en_attente", "approuve", "rembourse", "rejete", name="loan_status")


def upgrade() -> None:
    op.create_table(
        "utilisateurs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nom", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("telephone", sa.String(length=30), nullable=True),
        sa.Column("numero_mobile", sa.String(length=30), nullable=True),
        sa.Column("mot_de_passe_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_utilisateurs_email"), "utilisateurs", ["email"], unique=True)
    op.create_index(op.f("ix_utilisateurs_id"), "utilisateurs", ["id"], unique=False)

    op.create_table(
        "groupes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nom", sa.String(length=150), nullable=False),
        sa.Column("gestionnaire_id", sa.Integer(), nullable=False),
        sa.Column("montant_cotisation", sa.Numeric(12, 2), nullable=False),
        sa.Column("frequence", contribution_frequency, nullable=False),
        sa.Column("type", group_type, nullable=False),
        sa.Column("date_debut", sa.Date(), nullable=False),
        sa.Column("statut", group_status, nullable=False),
        sa.ForeignKeyConstraint(["gestionnaire_id"], ["utilisateurs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_groupes_id"), "groupes", ["id"], unique=False)
    op.create_index(op.f("ix_groupes_nom"), "groupes", ["nom"], unique=False)

    op.create_table(
        "membres_groupe",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("groupe_id", sa.Integer(), nullable=False),
        sa.Column("utilisateur_id", sa.Integer(), nullable=False),
        sa.Column("ordre_reception", sa.Integer(), nullable=True),
        sa.Column("statut", membership_status, nullable=False),
        sa.Column("date_adhesion", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["groupe_id"], ["groupes.id"]),
        sa.ForeignKeyConstraint(["utilisateur_id"], ["utilisateurs.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("groupe_id", "utilisateur_id", name="uq_groupe_utilisateur"),
    )
    op.create_index(op.f("ix_membres_groupe_id"), "membres_groupe", ["id"], unique=False)

    op.create_table(
        "cycles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("groupe_id", sa.Integer(), nullable=False),
        sa.Column("numero_cycle", sa.Integer(), nullable=False),
        sa.Column("beneficiaire_id", sa.Integer(), nullable=False),
        sa.Column("date_debut", sa.Date(), nullable=False),
        sa.Column("date_fin", sa.Date(), nullable=False),
        sa.Column("statut", cycle_status, nullable=False),
        sa.ForeignKeyConstraint(["beneficiaire_id"], ["membres_groupe.id"]),
        sa.ForeignKeyConstraint(["groupe_id"], ["groupes.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cycles_id"), "cycles", ["id"], unique=False)

    op.create_table(
        "emprunts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("groupe_id", sa.Integer(), nullable=False),
        sa.Column("emprunteur_id", sa.Integer(), nullable=False),
        sa.Column("montant", sa.Numeric(12, 2), nullable=False),
        sa.Column("taux_interet", sa.Numeric(5, 2), nullable=False),
        sa.Column("date_demande", sa.Date(), nullable=False),
        sa.Column("date_limite", sa.Date(), nullable=False),
        sa.Column("statut", loan_status, nullable=False),
        sa.ForeignKeyConstraint(["emprunteur_id"], ["membres_groupe.id"]),
        sa.ForeignKeyConstraint(["groupe_id"], ["groupes.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_emprunts_id"), "emprunts", ["id"], unique=False)

    op.create_table(
        "cotisations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cycle_id", sa.Integer(), nullable=False),
        sa.Column("membre_id", sa.Integer(), nullable=False),
        sa.Column("montant", sa.Numeric(12, 2), nullable=False),
        sa.Column("numero_transaction", sa.String(length=120), nullable=False),
        sa.Column("date_paiement", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("statut", payment_status, nullable=False),
        sa.ForeignKeyConstraint(["cycle_id"], ["cycles.id"]),
        sa.ForeignKeyConstraint(["membre_id"], ["membres_groupe.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cotisations_id"), "cotisations", ["id"], unique=False)
    op.create_index(op.f("ix_cotisations_numero_transaction"), "cotisations", ["numero_transaction"], unique=False)

    op.create_table(
        "remboursements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("emprunt_id", sa.Integer(), nullable=False),
        sa.Column("montant", sa.Numeric(12, 2), nullable=False),
        sa.Column("numero_transaction", sa.String(length=120), nullable=False),
        sa.Column("date_paiement", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("statut", payment_status, nullable=False),
        sa.ForeignKeyConstraint(["emprunt_id"], ["emprunts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_remboursements_id"), "remboursements", ["id"], unique=False)
    op.create_index(op.f("ix_remboursements_numero_transaction"), "remboursements", ["numero_transaction"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_remboursements_numero_transaction"), table_name="remboursements")
    op.drop_index(op.f("ix_remboursements_id"), table_name="remboursements")
    op.drop_table("remboursements")
    op.drop_index(op.f("ix_cotisations_numero_transaction"), table_name="cotisations")
    op.drop_index(op.f("ix_cotisations_id"), table_name="cotisations")
    op.drop_table("cotisations")
    op.drop_index(op.f("ix_emprunts_id"), table_name="emprunts")
    op.drop_table("emprunts")
    op.drop_index(op.f("ix_cycles_id"), table_name="cycles")
    op.drop_table("cycles")
    op.drop_index(op.f("ix_membres_groupe_id"), table_name="membres_groupe")
    op.drop_table("membres_groupe")
    op.drop_index(op.f("ix_groupes_nom"), table_name="groupes")
    op.drop_index(op.f("ix_groupes_id"), table_name="groupes")
    op.drop_table("groupes")
    op.drop_index(op.f("ix_utilisateurs_id"), table_name="utilisateurs")
    op.drop_index(op.f("ix_utilisateurs_email"), table_name="utilisateurs")
    op.drop_table("utilisateurs")

    loan_status.drop(op.get_bind())
    payment_status.drop(op.get_bind())
    cycle_status.drop(op.get_bind())
    membership_status.drop(op.get_bind())
    group_status.drop(op.get_bind())
    group_type.drop(op.get_bind())
    contribution_frequency.drop(op.get_bind())
    user_role.drop(op.get_bind())

