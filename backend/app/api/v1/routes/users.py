from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.security import get_password_hash, verify_password
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import ChangePasswordRequest, UserCreate, UserProfileUpdate, UserRead, UserUpdate, WalletTopUp


router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: DbSession) -> User:
    existing_user = db.scalar(select(User).where(User.email == payload.email))
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cet email existe deja")

    user = User(
        nom=payload.nom,
        email=payload.email,
        telephone=payload.telephone,
        numero_mobile=payload.numero_mobile,
        mot_de_passe_hash=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserRead)
def read_me(current_user: CurrentUser) -> User:
    return current_user


@router.post("/me/recharge", response_model=UserRead)
def recharge_wallet(payload: WalletTopUp, current_user: CurrentUser, db: DbSession) -> User:
    current_user.solde += payload.montant
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("", response_model=list[UserRead])
def list_users(db: DbSession, _current_user: CurrentUser) -> list[User]:
    return list(db.scalars(select(User).order_by(User.nom.asc())))


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> User:
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces refuse")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/me/profile", response_model=UserRead)
def update_my_profile(payload: UserProfileUpdate, current_user: CurrentUser, db: DbSession) -> User:
    if payload.nom is not None:
        current_user.nom = payload.nom
    if payload.telephone is not None:
        current_user.telephone = payload.telephone
    if payload.numero_mobile is not None:
        current_user.numero_mobile = payload.numero_mobile
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_my_password(payload: ChangePasswordRequest, current_user: CurrentUser, db: DbSession) -> None:
    if not verify_password(payload.ancien_mot_de_passe, current_user.mot_de_passe_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ancien mot de passe incorrect")
    if len(payload.nouveau_mot_de_passe) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le mot de passe doit contenir au moins 6 caractères")
    current_user.mot_de_passe_hash = get_password_hash(payload.nouveau_mot_de_passe)
    db.add(current_user)
    db.commit()
