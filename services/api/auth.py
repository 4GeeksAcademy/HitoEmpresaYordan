import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.hash import bcrypt

from mailer import send_password_reset_email
from models import (
    AuthMe, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest,
    TokenResponse, User,
)
from services import (
    change_user_password, consume_password_reset, get_profile_by_user_id,
    get_user_by_email, get_user_by_id, register_password_reset,
)

load_dotenv(Path(__file__).with_name(".env"))

SECRET_KEY = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET debe configurarse en el entorno")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
if ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
    raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES debe ser un entero positivo")

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token de autenticacion invalido o ausente",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise unauthorized
    try:
        claims = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require_exp": True, "require_sub": True},
        )
        if claims.get("purpose") == "password_reset":
            raise unauthorized
        user_id = int(claims["sub"])
    except (JWTError, KeyError, TypeError, ValueError) as error:
        raise unauthorized from error

    user = get_user_by_id(user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user


@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends()) -> TokenResponse:
    user = get_user_by_email(form.username)
    if user is None or not user.is_active or not bcrypt.verify(
        form.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=create_access_token(user.id))


def request_password_reset(email: str) -> None:
    user = get_user_by_email(email)
    if user is None or not user.is_active:
        return
    expires_at = int((datetime.now(timezone.utc) + timedelta(minutes=30)).timestamp())
    token_id = secrets.token_urlsafe(32)
    token = jwt.encode(
        {"sub": str(user.id), "exp": expires_at, "jti": token_id,
         "purpose": "password_reset"},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    if register_password_reset(user, token_id, expires_at):
        send_password_reset_email(user.email, token)


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest, background_tasks: BackgroundTasks
) -> dict[str, str]:
    background_tasks.add_task(request_password_reset, payload.email)
    return {"message": "Si la cuenta existe, recibiras un enlace para restablecer la contrasena"}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest) -> dict[str, str]:
    invalid_token = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Token de recuperacion invalido, caducado o utilizado",
    )
    try:
        claims = jwt.decode(
            payload.token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require_exp": True, "require_sub": True, "require_jti": True},
        )
        if claims.get("purpose") != "password_reset":
            raise invalid_token
        user_id = int(claims["sub"])
        token_id = claims["jti"]
    except (JWTError, KeyError, TypeError, ValueError) as error:
        raise invalid_token from error
    if not consume_password_reset(user_id, token_id, payload.new_password):
        raise invalid_token
    return {"message": "Contrasena restablecida"}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest, current_user: User = Depends(get_current_user)
) -> dict[str, str]:
    if not change_user_password(
        current_user.id, payload.current_password, payload.new_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contrasena actual es incorrecta",
        )
    return {"message": "Contrasena actualizada"}


@router.get("/me", response_model=AuthMe)
def read_me(current_user: User = Depends(get_current_user)) -> AuthMe:
    return AuthMe(
        **current_user.model_dump(exclude={"hashed_password"}),
        profile=get_profile_by_user_id(current_user.id),
    )