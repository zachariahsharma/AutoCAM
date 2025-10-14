from __future__ import annotations
from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app
from flask_login import LoginManager, login_user, logout_user, login_required
from .models import find_user_by_email, verify_password, User, ensure_admin_seed

login_manager = LoginManager()
login_manager.login_view = "auth.login"

auth_bp = Blueprint("auth", __name__)


@login_manager.user_loader
def load_user(user_id: str):
    from .models import find_user_by_id
    return find_user_by_id(user_id)


@auth_bp.before_app_request
def seed_admin():
    ensure_admin_seed(current_app.config.get("ADMIN_EMAILS", []))


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = find_user_by_email(email)
        if not user or not verify_password(user, password):
            flash("Invalid credentials", "danger")
            return render_template("login.html")
        login_user(user)
        return redirect(url_for("main.dashboard"))
    return render_template("login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login")) 