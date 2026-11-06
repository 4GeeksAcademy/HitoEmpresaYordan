from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from models import Profile, ProfileUpdate, User
from services import get_profile_by_user_id, update_profile_by_user_id

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=Profile)
def read_my_profile(current_user: User = Depends(get_current_user)) -> Profile:
    profile = get_profile_by_user_id(current_user.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado")
    return profile


@router.put("/me", response_model=Profile)
def update_my_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
) -> Profile:
    profile = update_profile_by_user_id(current_user.id, payload)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return profile