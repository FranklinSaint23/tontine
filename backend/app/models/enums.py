from enum import StrEnum

from sqlalchemy import Enum


def db_enum(enum_class: type[StrEnum], name: str) -> Enum:
    return Enum(
        enum_class,
        name=name,
        values_callable=lambda items: [item.value for item in items],
    )


class UserRole(StrEnum):
    SUPER_ADMIN = "super_admin"
    MANAGER = "gestionnaire"
    MEMBER = "membre"


class ContributionFrequency(StrEnum):
    WEEKLY = "hebdo"
    MONTHLY = "mensuel"


class GroupType(StrEnum):
    ROTATING = "rotatif"
    CREDIT = "credit"
    BOTH = "les_deux"


class GroupStatus(StrEnum):
    ACTIVE = "actif"
    COMPLETED = "termine"
    SUSPENDED = "suspendu"


class MembershipStatus(StrEnum):
    PENDING = "en_attente"
    ACTIVE = "actif"
    SUSPENDED = "suspendu"
    REJECTED = "rejete"


class CycleStatus(StrEnum):
    IN_PROGRESS = "en_cours"
    COMPLETED = "termine"


class PaymentStatus(StrEnum):
    PENDING = "en_attente"
    CONFIRMED = "confirme"
    LATE = "retard"


class LoanStatus(StrEnum):
    PENDING = "en_attente"
    APPROVED = "approuve"
    REPAID = "rembourse"
    REJECTED = "rejete"


class NotificationType(StrEnum):
    CONTRIBUTION = "cotisation"
    LATE_PAYMENT = "retard"
    CYCLE = "cycle"
    LOAN = "emprunt"
    MEMBER = "membre"


class JoinRequestStatus(StrEnum):
    PENDING = "en_attente"
    APPROVED = "approuvee"
    REJECTED = "rejetee"


class ExitRequestStatus(StrEnum):
    PENDING = "en_attente"
    APPROVED = "approuvee"
    REJECTED = "rejetee"
