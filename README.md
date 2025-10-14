# AutoCAM Web

A Flask-based web app for managing CAM plate breakdowns with MongoDB backend, authentication, admin, drafts, and a CAM webhook.

## Features
- User auth (login/logout), admin UI to add users
- MongoDB integration (Jira DB at localhost:27017 by default)
- Task browser by Material/Thickness
- Automated plate breakdown via external API
- Drag-and-drop parts between plates, add/remove plates
- Drafts (save/resume/delete)
- User settings for API base URL (default `http://localhost:8000`, option `https://valor6800.com`)
- CAM request flow; webhook receives CAM completion link per plate
- Black/Gold theme

## Prerequisites
- Python 3.11+
- MongoDB running locally at `mongodb://localhost:27017`

## Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` as needed.

## Run
```bash
export FLASK_APP=autocam/app.py
export FLASK_ENV=development
flask run --port 5000
```

Login at `http://localhost:5000`.

## Tests
```bash
pytest -q
```

## Environment
- `SECRET_KEY` (required)
- `MONGO_URI` (default `mongodb://localhost:27017`)
- `MONGO_DB` (default `jira`)
- `API_BASE_URL` (default `http://localhost:8000`)
- `ALLOWED_API_BASE_URLS` (default `http://localhost:8000,https://valor6800.com`)
- `ADMIN_EMAILS` (comma list; first run can seed default admin)

## Webhook
Expose `POST /webhook/cam_complete` that includes `plateId` and `downloadUrl`. 