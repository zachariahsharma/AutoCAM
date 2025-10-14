from __future__ import annotations
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from .models import create_user

admin_bp = Blueprint("admin", __name__)


def require_admin():
    if not current_user.is_authenticated or not current_user.is_admin:
        return False
    return True


@admin_bp.route("/users", methods=["GET", "POST"])
@login_required
def users():
    if not require_admin():
        flash("Admin only", "warning")
        return redirect(url_for("main.dashboard"))
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        is_admin = request.form.get("is_admin") == "on"
        try:
            create_user(email, password, is_admin)
            flash("User created", "success")
        except Exception as e:
            flash(str(e), "danger")
        return redirect(url_for("admin.users"))
    # List users: lightweight (emails only)
    from .db import get_db
    users = list(get_db().users.find({}, {"email": 1, "is_admin": 1}))
    return render_template("admin_users.html", users=users) 