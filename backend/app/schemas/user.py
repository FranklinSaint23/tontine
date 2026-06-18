from pydantic import BaseModel, EmailStr, field_validator

from app.models.enums import UserRole


class UserBase(BaseModel):
    nom: str
    email: EmailStr
    telephone: str | None = None
    numero_mobile: str | None = None
    role: UserRole = UserRole.MEMBER
    is_active: bool = True


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_must_fit_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Le mot de passe ne doit pas depasser 72 octets")
        return value

    @field_validator('telephone')
    @classmethod
    def telephone_required_and_valid(cls, value: str | None) -> str:
        if not value:
            raise ValueError('Le numéro de téléphone est requis')
        # Basic normalization: allow + and digits, length 7-15
        import re
        normalized = value.strip()
        if not re.fullmatch(r"\+?[0-9]{7,15}", normalized):
            raise ValueError('Numéro de téléphone invalide (format international ou local)')
        return normalized


class UserRead(UserBase):
    id: int
    solde: int = 0

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class UserProfileUpdate(BaseModel):
    nom: str | None = None
    telephone: str | None = None
    numero_mobile: str | None = None


class ChangePasswordRequest(BaseModel):
    ancien_mot_de_passe: str
    nouveau_mot_de_passe: str


class WalletTopUp(BaseModel):
    montant: int
    methode: str | None = None

    @field_validator('montant')
    @classmethod
    def montant_doivent_etre_positif(cls, value: int) -> int:
        if value <= 0:
            raise ValueError('Le montant doit être supérieur à 0')
        return value
