from typing import Optional

from passlib.hash import bcrypt
from tinydb import Query
from tinydb.table import Document

from database import db_lock, profiles_table, users_table
from models import Profile, ProfileCreate, ProfileUpdate, User, UserCreate, UserUpdate, utc_now


def _to_user(doc: Document) -> User:
    return User(id=doc.doc_id, **doc)


def _to_profile(doc: Document) -> Profile:
    return Profile(id=doc.doc_id, **doc)


def create_user(payload: UserCreate) -> User:
    email = payload.email.strip().lower()
    data = {
        "email": email,
        "hashed_password": bcrypt.hash(payload.password),
        "is_active": True,
        "role": "user",
        "created_at": utc_now().isoformat(),
    }
    profile_data = {
        "name": payload.name,
        "phone": payload.phone,
        "address": payload.address,
    }
    with db_lock:
        if users_table.contains(Query().email == email):
            raise ValueError("Ya existe un usuario con ese email")
        user_id = users_table.insert(data)
        try:
            profiles_table.insert({"user_id": user_id, **profile_data})
        except Exception:
            users_table.remove(doc_ids=[user_id])
            raise
    return User(id=user_id, **data)


def list_users() -> list[User]:
    with db_lock:
        docs = users_table.all()
    return [_to_user(doc) for doc in docs]


def get_user_by_id(user_id: int) -> Optional[User]:
    with db_lock:
        doc = users_table.get(doc_id=user_id)
    return _to_user(doc) if doc is not None else None


def get_user_by_email(email: str) -> Optional[User]:
    with db_lock:
        doc = users_table.get(Query().email == email.strip().lower())
    return _to_user(doc) if doc is not None else None


def update_user(user_id: int, payload: UserUpdate) -> Optional[User]:
    changes = payload.model_dump(exclude_unset=True)
    password = changes.pop("password", None)
    if password is not None:
        changes["hashed_password"] = bcrypt.hash(password)
    if changes.get("email") is not None:
        changes["email"] = changes["email"].strip().lower()
    if changes.get("role") is not None:
        changes["role"] = changes["role"].value

    with db_lock:
        if users_table.get(doc_id=user_id) is None:
            return None
        if "email" in changes and any(
            doc.doc_id != user_id and doc["email"] == changes["email"]
            for doc in users_table.search(Query().email == changes["email"])
        ):
            raise ValueError("Ya existe un usuario con ese email")
        if changes:
            users_table.update(changes, doc_ids=[user_id])
        doc = users_table.get(doc_id=user_id)
    return _to_user(doc)


def delete_user(user_id: int) -> bool:
    with db_lock:
        if users_table.get(doc_id=user_id) is None:
            return False
        profiles_table.remove(Query().user_id == user_id)
        users_table.remove(doc_ids=[user_id])
    return True


def create_profile(payload: ProfileCreate) -> Profile:
    data = payload.model_dump()
    with db_lock:
        if users_table.get(doc_id=payload.user_id) is None:
            raise ValueError("El usuario vinculado no existe")
        if profiles_table.contains(Query().user_id == payload.user_id):
            raise ValueError("El usuario ya tiene un perfil")
        profile_id = profiles_table.insert(data)
    return Profile(id=profile_id, **data)


def get_profile_by_user_id(user_id: int) -> Optional[Profile]:
    with db_lock:
        doc = profiles_table.get(Query().user_id == user_id)
    return _to_profile(doc) if doc is not None else None


def update_profile_by_user_id(user_id: int, payload: ProfileUpdate) -> Optional[Profile]:
    changes = payload.model_dump(exclude_unset=True)
    with db_lock:
        if users_table.get(doc_id=user_id) is None:
            return None
        doc = profiles_table.get(Query().user_id == user_id)
        if doc is None:
            profile_id = profiles_table.insert({"user_id": user_id, **changes})
            doc = profiles_table.get(doc_id=profile_id)
        elif changes:
            profiles_table.update(changes, doc_ids=[doc.doc_id])
            doc = profiles_table.get(doc_id=doc.doc_id)
    return _to_profile(doc)