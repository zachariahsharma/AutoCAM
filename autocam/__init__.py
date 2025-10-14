import os
from flask import Flask
from .db import init_db
from .auth import auth_bp, login_manager
from .admin import admin_bp
from .routes import main_bp


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__, static_folder="static", template_folder="templates")

    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-secret"),
        MONGO_URI=os.environ.get("MONGO_URI", "mongodb://localhost:27017"),
        MONGO_DB=os.environ.get("MONGO_DB", "jira"),
        TASKS_COLLECTION=os.environ.get("TASKS_COLLECTION", "tasks"),
        API_BASE_URL=os.environ.get("API_BASE_URL", "http://localhost:8000"),
        ALLOWED_API_BASE_URLS=[u.strip() for u in os.environ.get(
            "ALLOWED_API_BASE_URLS",
            "http://localhost:8000,https://valor6800.com",
        ).split(",")],
        ADMIN_EMAILS=[e.strip() for e in os.environ.get("ADMIN_EMAILS", "valor").split(",") if e.strip()],
    )

    if test_config:
        app.config.update(test_config)

    init_db(app)
    login_manager.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(main_bp)

    @app.route("/healthz")
    def healthz():
        return {"status": "ok"}

    return app 