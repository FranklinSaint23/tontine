from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import UserRole, db_enum


class User(Base):
    __tablename__ = "utilisateurs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nom: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    telephone: Mapped[str | None] = mapped_column(String(30))
    numero_mobile: Mapped[str | None] = mapped_column(String(30))
    mot_de_passe_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(db_enum(UserRole, "user_role"), default=UserRole.MEMBER)
    solde: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    groupes_geres = relationship("Group", back_populates="gestionnaire")
    adhesions = relationship("Membership", back_populates="utilisateur")
    demandes_adhesion = relationship("JoinRequest", back_populates="utilisateur")
    notifications = relationship("Notification", back_populates="destinataire")
