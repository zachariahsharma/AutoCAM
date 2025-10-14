from __future__ import annotations
from flask import current_app, g
from pymongo import MongoClient
from typing import Any


def get_client() -> MongoClient:
    if "mongo_client" not in g:
        uri = current_app.config["MONGO_URI"]
        if uri.startswith("mongomock://"):
            # Lazy import to avoid test-only dependency at runtime
            import mongomock
            g.mongo_client = mongomock.MongoClient()
        else:
            g.mongo_client = MongoClient(uri)
    return g.mongo_client


def get_db() -> Any:
    client = get_client()
    return client[current_app.config["MONGO_DB"]]


def close_db(e: Exception | None = None) -> None:
    client: MongoClient | None = g.pop("mongo_client", None)
    if client is not None:
        client.close()


def init_db(app) -> None:
    app.teardown_appcontext(close_db) 