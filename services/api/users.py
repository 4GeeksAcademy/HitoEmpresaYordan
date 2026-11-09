from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from models import (
    User,
    UserCreate as UserCreateSchema,
    UserRead,
    UserUpdate as UserUpdateSchema,
)
from services import (
    create_user,
    delete_user,
    get_user_by_id,
    list_users,
    update_user,
)


class Role(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


class UserCreate(UserCreateSchema):
    """Registration fields: email, password, name, phone and address."""


class UserUpdate(UserUpdateSchema):
    role: Role | None = None


router = APIRouter(prefix="/users", tags=["users"])


def public_user(user: User) -> UserRead:
    return UserRead(**user.model_dump())


def owner_or_admin(user_id: int, current_user: User) -> None:
    if current_user.role != Role.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permiso denegado")


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def post_user(payload: UserCreate) -> UserRead:
    try:
        return public_user(create_user(payload))
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese correo electronico",
        ) from error


@router.get("", response_model=list[UserRead])
def get_users(current_user: User = Depends(get_current_user)) -> list[UserRead]:
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permiso denegado")
    return [public_user(user) for user in list_users()]


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, current_user: User = Depends(get_current_user)) -> UserRead:
    owner_or_admin(user_id, current_user)
    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return public_user(user)


@router.put("/{user_id}", response_model=UserRead)
def put_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
) -> UserRead:
    owner_or_admin(user_id, current_user)
    if payload.role is not None and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo admin puede cambiar roles")
    try:
        user = update_user(user_id, payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese correo electronico",
        ) from error
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return public_user(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(user_id: int, current_user: User = Depends(get_current_user)) -> None:
    owner_or_admin(user_id, current_user)
    if not delete_user(user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")