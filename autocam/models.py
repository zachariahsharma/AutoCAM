from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Optional
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from .db import get_db


@dataclass
class User(UserMixin):
    id: str
    email: str
    password_hash: str
    is_admin: bool = False
    api_base_url: Optional[str] = None

    @staticmethod
    def from_doc(doc: dict[str, Any]) -> "User":
        return User(
            id=str(doc.get("_id")),
            email=doc.get("email", ""),
            password_hash=doc.get("password_hash", ""),
            is_admin=bool(doc.get("is_admin", False)),
            api_base_url=doc.get("api_base_url"),
        )

    def get_id(self) -> str:
        return self.id


def find_user_by_email(email: str) -> Optional[User]:
    db = get_db()
    doc = db.users.find_one({"email": email})
    return User.from_doc(doc) if doc else None


def find_user_by_id(user_id: str) -> Optional[User]:
    db = get_db()
    doc = db.users.find_one({"_id": ObjectId(user_id)})
    return User.from_doc(doc) if doc else None


def create_user(email: str, password: str, is_admin: bool = False) -> str:
    db = get_db()
    if db.users.find_one({"email": email}):
        raise ValueError("User already exists")
    user_id = db.users.insert_one({
        "email": email,
        "password_hash": generate_password_hash(password),
        "is_admin": is_admin,
    }).inserted_id
    return str(user_id)


def verify_password(user: User, password: str) -> bool:
    return check_password_hash(user.password_hash, password)


def ensure_admin_seed(admin_emails: list[str]) -> None:
    db = get_db()
    # Seed default admin 'valor' with password '6800'
    if not db.users.find_one({"email": "valor"}):
        create_user("valor", password="6800", is_admin=True)
    # Seed additional default non-admin user 'ftc' with password 'viperbots'
    if not db.users.find_one({"email": "ftc"}):
        create_user("ftc", password="viperbots", is_admin=False)
    # Seed any other admins from configuration (skip ones we already created)
    for e in admin_emails:
        if e in ("valor", "ftc"):
            continue
        if not db.users.find_one({"email": e}):
            create_user(e, password="admin123", is_admin=True)


def upsert_user_api_base_url(user_id: str, api_base_url: str) -> None:
    db = get_db()
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"api_base_url": api_base_url}})


def append_user_allowed_api_base_url(user_id: str, api_base_url: str) -> None:
    db = get_db()
    db.users.update_one({"_id": ObjectId(user_id)}, {"$addToSet": {"allowed_api_bases": api_base_url}})


def parse_thickness(thickness: Any) -> Optional[float]:
    if thickness is None:
        return None
    if isinstance(thickness, (int, float)):
        return float(thickness)
    if isinstance(thickness, dict):
        number = thickness.get("$numberDouble")
        if number in ("Infinity", "-Infinity", "NaN"):
            return None
    return None


def save_plates(task_id: str, material: str, thickness: Optional[float], plates: list[dict[str, Any]]) -> str:
    db = get_db()
    doc = {
        "task_id": task_id,
        "material": material,
        "thickness": thickness,
        "plates": plates,
        "status": "OPEN",
    }
    inserted_id = db.plates.insert_one(doc).inserted_id
    return str(inserted_id)


def get_plates(doc_id: str) -> Optional[dict[str, Any]]:
    db = get_db()
    return db.plates.find_one({"_id": ObjectId(doc_id)})


def update_plates(doc_id: str, plates: list[dict[str, Any]]) -> None:
    db = get_db()
    db.plates.update_one({"_id": ObjectId(doc_id)}, {"$set": {"plates": plates}})


def assign_plate(doc_id: str, plate_id: str, user_id: str) -> None:
    db = get_db()
    db.plates.update_one(
        {"_id": ObjectId(doc_id), "plates.plateId": plate_id},
        {"$set": {"plates.$.assigned_to": ObjectId(user_id), "plates.$.status": "CAM_REQUESTED"}},
    )


def set_plate_download(doc_id: str, plate_id: str, download_url: str) -> None:
    db = get_db()
    db.plates.update_one(
        {"_id": ObjectId(doc_id), "plates.plateId": plate_id},
        {"$set": {"plates.$.cam_download_url": download_url, "plates.$.status": "CAM_READY"}},
    )


def save_draft(user_id: str, task_id: str, payload: dict[str, Any]) -> str:
    """Deprecated: drafts feature removed. Left as no-op for safety."""
    return ""


def list_drafts(user_id: str) -> list[dict[str, Any]]:
    """Deprecated: drafts feature removed. Always returns empty list."""
    return []


def get_draft(draft_id: str, user_id: str) -> Optional[dict[str, Any]]:
    """Deprecated: drafts feature removed. Always returns None."""
    return None


def delete_draft(draft_id: str, user_id: str) -> None:
    """Deprecated: drafts feature removed. No-op."""
    return None