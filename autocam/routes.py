from __future__ import annotations
import json
import uuid
from typing import Any
import requests
from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify, session
from flask_login import login_required, current_user
from bson import ObjectId
from urllib.parse import urlparse, quote, unquote
from datetime import datetime
from .db import get_db
from .models import (
    parse_thickness,
    save_plates,
    get_plates,
    update_plates,
    assign_plate,
    set_plate_download,
    save_draft,
    list_drafts,
    get_draft,
    delete_draft,
    upsert_user_api_base_url,
    append_user_allowed_api_base_url,
)
import os
import shutil
import tempfile
import zipfile
from werkzeug.utils import secure_filename

main_bp = Blueprint("main", __name__)


def _user_api_base() -> str:
    return current_user.api_base_url or current_app.config["API_BASE_URL"]


def _mt_key(material: str, thickness: float | None) -> dict[str, Any]:
    return {"material": material, "thickness": thickness}

def _norm_material_val(val: str | None) -> str:
    if val is None:
        return ""
    s = str(val).strip()
    if (len(s) >= 2) and ((s[0] == s[-1] == '"') or (s[0] == s[-1] == "'")):
        s = s[1:-1]
    return s


def _normalize_assignments(selected: list[dict[str, Any]], assignments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    # Cap per-part total across all plates to selected quantity
    target = {str(i.get('id')): int(i.get('quantity') or 0) for i in (selected or [])}
    # Flatten counts
    counts: dict[str, int] = {}
    for a in (assignments or []):
        for p in (a.get('parts') or []):
            pid = str(p.get('id'))
            qty = int(p.get('quantity') or 0)
            counts[pid] = counts.get(pid, 0) + qty
    # If over, trim from the end per plate order
    over_ids = [pid for pid, c in counts.items() if c > (target.get(pid) or 0)]
    if not over_ids:
        return assignments
    remaining = {pid: (target.get(pid) or 0) for pid in over_ids}
    normalized: list[dict[str, Any]] = []
    for a in (assignments or []):
        new_parts = []
        for p in (a.get('parts') or []):
            pid = str(p.get('id'))
            qty = int(p.get('quantity') or 0)
            if pid in remaining:
                allow = max(0, remaining[pid])
                take = min(qty, allow)
                if take > 0:
                    new_parts.append({'id': pid, 'quantity': take})
                remaining[pid] = allow - take
            else:
                new_parts.append({'id': pid, 'quantity': qty})
        normalized.append({'plateId': a.get('plateId'), 'parts': new_parts})
    return normalized


def _clear_all_plate_screenshots_for(material: str, thickness: float | None, plate_ids: list[str] | None = None):
    db = get_db()
    doc = db.mt_sessions.find_one(_mt_key(material, thickness))
    if not doc:
        return
    plates = doc.get("plates") or []
    changed = False
    for p in plates:
        pid = p.get("id") or p.get("plateId")
        if plate_ids and pid not in plate_ids:
            continue
        rel = p.get("screenshot_path_rel")
        url = p.get("screenshot_url") or ""
        if not rel and url.startswith("/static/"):
            rel = url[len("/static/"):]
        if rel:
            full = os.path.join(current_app.static_folder, rel)
            try:
                if os.path.exists(full):
                    os.remove(full)
            except Exception:
                pass
        for k in ("screenshot_url", "screenshot_path_rel"):
            if p.pop(k, None) is not None:
                changed = True
    if changed:
        db.mt_sessions.update_one(_mt_key(material, thickness), {"$set": {"plates": plates, "updatedAt": datetime.utcnow().isoformat() + "Z"}})


@main_bp.route("/")
@login_required
def index():
    return redirect(url_for("main.dashboard"))


@main_bp.route("/dashboard")
@login_required
def dashboard():
    # Redirect FTC user to upload flow
    try:
        if getattr(current_user, 'email', '') == 'ftc':
            return redirect(url_for('main.ftc_upload'))
    except Exception:
        pass
    db = get_db()
    raw_tasks = list(db[current_app.config["TASKS_COLLECTION"]].find({}, {"Material": 1, "Thickness": 1, "name": 1, "Parts": 1}))
    # Group tasks by (Material, Thickness)
    combo_map: dict[tuple[str, float | None], dict[str, Any]] = {}
    for t in raw_tasks:
        material = t.get("Material") or "Unknown"
        thickness_val = parse_thickness(t.get("Thickness"))
        key = (material, thickness_val)
        entry = combo_map.get(key)
        if not entry:
            entry = {
                "Material": material,
                "Thickness": thickness_val,
                "Tasks": [],
                "Parts": set(),
            }
            combo_map[key] = entry
        entry["Tasks"].append(t)
        for p in t.get("Parts", []) or []:
            entry["Parts"].add(p)

    combos = []
    for (material, thickness_val), entry in combo_map.items():
        combos.append({
            "Material": material,
            "ThicknessDisplay": thickness_val,
            "PartsCount": len(entry["Parts"]),
            "MaterialEsc": quote(material, safe=""),
            "ThicknessEsc": quote(str(thickness_val if thickness_val is not None else ""), safe=""),
        })

    # Recently added parts from imported collection (sorted by newest ObjectId)
    recent_imported = list(db.imported.find({}, {"child": 1, "name": 1, "quantity": 1}).sort("_id", -1).limit(10))
    recent_parts = [
        {
            "id": doc.get("child"),
            "name": doc.get("name"),
            "quantity": doc.get("quantity"),
        }
        for doc in recent_imported
    ]

    return render_template("dashboard.html", combos=combos, recent_parts=recent_parts)


@main_bp.route("/mt/<material_enc>/<thickness_enc>")
@login_required
def material_thickness(material_enc: str, thickness_enc: str):
    material = _norm_material_val(unquote(material_enc))
    thickness = None if thickness_enc in ("", "None") else float(unquote(thickness_enc))
    # FTC override: if session contains uploaded parts and ftc=1, use those
    parts_info: list[dict[str, Any]] = []
    if request.args.get('ftc') == '1':
        ftc_parts = session.get('ftc_parts') or []
        ftc_material = session.get('ftc_material')
        ftc_thickness = session.get('ftc_thickness')
        if ftc_parts and ftc_material == material and ftc_thickness == thickness:
            parts_info = [{
                "id": p.get('id'),
                "display": p.get('display') or p.get('id'),
                "recommended": 0,
                "available": 1,
            } for p in ftc_parts]
    if not parts_info:
        db = get_db()
        # Fetch all matching tasks and aggregate parts with available counts
        tasks = list(db[current_app.config["TASKS_COLLECTION"]].find({"Material": material}, {"Parts": 1, "Thickness": 1, "name": 1}))
        part_to_count: dict[str, int] = {}
        for t in tasks:
            if parse_thickness(t.get("Thickness")) == thickness:
                for p in t.get("Parts", []) or []:
                    part_to_count[p] = part_to_count.get(p, 0) + 1
        part_ids = list(part_to_count.keys())
        id_to_display: dict[str, str] = {}
        id_to_recommended: dict[str, int] = {}
        if part_ids:
            imported_docs = list(db.imported.find({"child": {"$in": part_ids}}, {"child": 1, "name": 1, "quantity": 1}))
            for d in imported_docs:
                cid = d.get("child")
                dname = d.get("name")
                qraw = d.get("quantity")
                try:
                    rq = int(qraw)
                except Exception:
                    rq = 0
                if cid and dname:
                    id_to_display[str(cid)] = str(dname)
                if cid:
                    id_to_recommended[str(cid)] = rq
        parts_info = [{
            "id": pid,
            "display": id_to_display.get(pid, pid),
            "recommended": id_to_recommended.get(pid, 0),
            "available": part_to_count[pid],
        } for pid in sorted(part_to_count.keys())]

    # Load any existing shared session state
    # Try normalized material first, then fallback to quoted variant if present in DB
    session_doc = db.mt_sessions.find_one(_mt_key(material, thickness))
    if not session_doc:
        session_doc = db.mt_sessions.find_one({"material": f'"{material}"', "thickness": thickness})
    session_doc = session_doc or {}
    initial_selected = session_doc.get("selected_parts") or []
    initial_plates = session_doc.get("plates") or []
    initial_assignments = session_doc.get("assignments") or []
    updated_at = session_doc.get("updatedAt")

    if not parts_info:
        flash("No parts found for this Material/Thickness", "warning")
    return render_template(
        "material_thickness.html",
        material=material,
        thickness=thickness,
        parts_info=parts_info,
        initial_selected=initial_selected,
        initial_plates=initial_plates,
        initial_assignments=initial_assignments,
        updated_at=updated_at or "",
    )


@main_bp.route("/ftc", methods=["GET", "POST"])
@login_required
def ftc_upload():
    # Only 'ftc' user can access
    if getattr(current_user, 'email', '') != 'ftc':
        flash("FTC upload page is restricted", "warning")
        return redirect(url_for("main.dashboard"))
    if request.method == "POST":
        material = _norm_material_val(request.form.get("material") or "")
        t_raw = request.form.get("thickness") or ""
        try:
            thickness = float(t_raw) if t_raw != "" else None
        except Exception:
            thickness = None
        files = request.files.getlist("files") or []
        save_dir = os.path.join(current_app.static_folder, "ftc_uploads")
        os.makedirs(save_dir, exist_ok=True)
        parts: list[dict[str, Any]] = []
        for fs in files:
            if not fs or not getattr(fs, 'filename', None):
                continue
            base = os.path.basename(fs.filename)
            safe_name = secure_filename(base)
            if not safe_name:
                continue
            out = os.path.join(save_dir, safe_name)
            try:
                fs.save(out)
            except Exception:
                continue
            part_id = os.path.splitext(safe_name)[0]
            parts.append({"id": part_id, "display": base})
        session['ftc_parts'] = parts
        session['ftc_material'] = material
        session['ftc_thickness'] = thickness
        return redirect(url_for("main.material_thickness", material_enc=quote(material, safe=""), thickness_enc=quote(str(thickness if thickness is not None else ''), safe=""), ftc=1))
    return render_template("ftc_upload.html")


@main_bp.route("/mt/<material_enc>/<thickness_enc>/state")
@login_required
def mt_state(material_enc: str, thickness_enc: str):
    material = _norm_material_val(unquote(material_enc))
    thickness = None if thickness_enc in ("", "None") else float(unquote(thickness_enc))
    db = get_db()
    session_doc = db.mt_sessions.find_one(_mt_key(material, thickness))
    if not session_doc:
        session_doc = db.mt_sessions.find_one({"material": f'"{material}"', "thickness": thickness})
    session_doc = session_doc or {}
    return jsonify({
        "selected_parts": session_doc.get("selected_parts") or [],
        "plates": session_doc.get("plates") or [],
        "assignments": session_doc.get("assignments") or [],
        "updatedAt": session_doc.get("updatedAt") or "",
    })


@main_bp.route("/mt/<material_enc>/<thickness_enc>/save", methods=["POST"])
@login_required
def save_mt_session(material_enc: str, thickness_enc: str):
    material = _norm_material_val(unquote(material_enc))
    thickness = None if thickness_enc in ("", "None") else float(unquote(thickness_enc))
    db = get_db()
    data = request.get_json(force=True, silent=True) or {}
    # Basic validation
    selected = data.get("selected_parts") or []
    plates = data.get("plates") or []
    assignments = data.get("assignments") or []
    assignments = _normalize_assignments(selected, assignments)
    # Clear screenshots if assignments changed
    _clear_all_plate_screenshots_for(material, thickness)
    db.mt_sessions.update_one(
        _mt_key(material, thickness),
        {"$set": {
            "material": material,
            "thickness": thickness,
            "selected_parts": selected,
            "plates": plates,
            "assignments": assignments,
            "updatedBy": str(getattr(current_user, 'id', 'unknown')),
            "updatedAt": datetime.utcnow().isoformat() + "Z",
        }},
        upsert=True,
    )
    return {"status": "ok"}


@main_bp.route("/mt/webhook/sync", methods=["POST"])
def mt_sync_webhook():
    data = request.get_json(force=True, silent=True) or {}
    material = data.get("material")
    thickness = data.get("thickness")
    if material is None or thickness is None:
        return {"status": "invalid"}, 400
    db = get_db()
    selected = data.get("selected_parts") or []
    plates = data.get("plates") or []
    assignments = _normalize_assignments(selected, data.get("assignments") or [])
    db.mt_sessions.update_one(
        _mt_key(material, float(thickness)),
        {"$set": {
            "material": material,
            "thickness": float(thickness),
            "selected_parts": selected,
            "plates": plates,
            "assignments": assignments,
            "updatedBy": "webhook",
            "updatedAt": datetime.utcnow().isoformat() + "Z",
        }},
        upsert=True,
    )
    return {"status": "ok"}


@main_bp.route("/mt/webhook/not_fit", methods=["POST"])
def mt_not_fit_webhook():
    db = get_db()
    updated = []

    # 1) Optional corrections payload (JSON body or 'payload' form field)
    data = request.get_json(silent=True) or {}
    if not data and request.form.get('payload'):
        try:
            data = json.loads(request.form.get('payload') or '{}')
        except Exception:
            data = {}

    if isinstance(data, dict) and data:
        for plate_id, arr in (data.items() if isinstance(data, dict) else []):
            # Support both array-of-entry and single dict forms
            entry = None
            if isinstance(arr, list) and arr:
                entry = arr[0]
            elif isinstance(arr, dict):
                entry = arr
            else:
                continue
            parts = entry.get("occurances") or entry.get("occurrences") or []
            quantities = entry.get("quantities") or entry.get("quantity") or []
            if not isinstance(parts, list) or not isinstance(quantities, list):
                continue
            if len(parts) != len(quantities):
                n = min(len(parts), len(quantities))
                parts = parts[:n]
                quantities = quantities[:n]
            # Find mt_session document that contains this plate
            doc = db.mt_sessions.find_one({"plates.id": plate_id})
            if not doc:
                continue
            assignments = doc.get("assignments") or []
            # Locate plate assignment and decrement quantities
            for a in assignments:
                if a.get("plateId") == plate_id:
                    current = {str(p.get("id")): int(p.get("quantity") or 0) for p in (a.get("parts") or [])}
                    for pid, q in zip(parts, quantities):
                        try:
                            dec = int(q)
                        except Exception:
                            dec = 0
                        key = str(pid)
                        newq = max(0, current.get(key, 0) - dec)
                        if newq > 0:
                            current[key] = newq
                        else:
                            current.pop(key, None)
                    a["parts"] = [{"id": k, "quantity": v} for k, v in current.items()]
                    break
            # Persist assignments
            db.mt_sessions.update_one(
                {"_id": doc["_id"]},
                {"$set": {"assignments": assignments}},
            )
            # Compute verified signature of current assignment for this plate and store on plates[]
            plate_signature = ",".join(
                f"{pid}:{qty}" for pid, qty in sorted(
                    ((p.get("id"), int(p.get("quantity") or 0)) for p in (next((a for a in assignments if a.get("plateId") == plate_id), {}).get("parts") or [])),
                    key=lambda x: x[0],
                )
            )
            plates = doc.get("plates") or []
            for p in plates:
                if p.get("id") == plate_id:
                    p["verifiedSignature"] = plate_signature
                    p["verifiedAt"] = datetime.utcnow().isoformat() + "Z"
            db.mt_sessions.update_one(
                {"_id": doc["_id"]},
                {"$set": {"plates": plates, "updatedBy": "webhook-not-fit", "updatedAt": datetime.utcnow().isoformat() + "Z"}},
            )
            updated.append(str(doc["_id"]))

    # 2) Optional screenshots as files
    if request.files:
        save_dir = os.path.join(current_app.static_folder, "plate_images")
        os.makedirs(save_dir, exist_ok=True)
        # Case A: repeated key 'screenshots[]' with filenames like PLATE_ID.png
        for fs in request.files.getlist('screenshots[]'):
            if not fs or not getattr(fs, 'filename', None):
                continue
            base = os.path.basename(fs.filename)
            plate_id = os.path.splitext(base)[0]
            if not plate_id:
                continue
            doc = db.mt_sessions.find_one({"plates.id": plate_id})
            if not doc:
                continue
            filename = secure_filename(f"{plate_id}-{int(datetime.utcnow().timestamp())}.png")
            path = os.path.join(save_dir, filename)
            try:
                fs.save(path)
            except Exception:
                continue
            rel = f"plate_images/{filename}"
            url = f"/static/{rel}"
            # compute current signature from assignments
            assignments = doc.get("assignments") or []
            parts = next((a.get("parts") or [] for a in assignments if a.get("plateId") == plate_id), [])
            signature = ",".join(f"{p.get('id')}:{int(p.get('quantity') or 0)}" for p in sorted(parts, key=lambda x: x.get('id')))
            plates = doc.get("plates") or []
            for p in plates:
                if p.get("id") == plate_id or p.get("plateId") == plate_id:
                    p["screenshot_url"] = url
                    p["screenshot_path_rel"] = rel
                    p["verifiedSignature"] = signature
                    p["verifiedAt"] = datetime.utcnow().isoformat() + "Z"
            db.mt_sessions.update_one({"_id": doc["_id"]}, {"$set": {"plates": plates, "updatedBy": "webhook-not-fit-image", "updatedAt": datetime.utcnow().isoformat() + "Z"}})
            updated.append(str(doc["_id"]))
        # Case A2: repeated key 'screenshots' (without brackets) with filenames like PLATE_ID.png
        for fs in request.files.getlist('screenshots'):
            if not fs or not getattr(fs, 'filename', None):
                continue
            base = os.path.basename(fs.filename)
            plate_id = os.path.splitext(base)[0]
            if not plate_id:
                continue
            doc = db.mt_sessions.find_one({"plates.id": plate_id})
            if not doc:
                continue
            filename = secure_filename(f"{plate_id}-{int(datetime.utcnow().timestamp())}.png")
            path = os.path.join(save_dir, filename)
            try:
                fs.save(path)
            except Exception:
                continue
            rel = f"plate_images/{filename}"
            url = f"/static/{rel}"
            # compute current signature from assignments
            assignments = doc.get("assignments") or []
            parts = next((a.get("parts") or [] for a in assignments if a.get("plateId") == plate_id), [])
            signature = ",".join(f"{p.get('id')}:{int(p.get('quantity') or 0)}" for p in sorted(parts, key=lambda x: x.get('id')))
            plates = doc.get("plates") or []
            for p in plates:
                if p.get("id") == plate_id or p.get("plateId") == plate_id:
                    p["screenshot_url"] = url
                    p["screenshot_path_rel"] = rel
                    p["verifiedSignature"] = signature
                    p["verifiedAt"] = datetime.utcnow().isoformat() + "Z"
            db.mt_sessions.update_one({"_id": doc["_id"]}, {"$set": {"plates": plates, "updatedBy": "webhook-not-fit-image", "updatedAt": datetime.utcnow().isoformat() + "Z"}})
            updated.append(str(doc["_id"]))
        # Case B: key is plateId with single file (backward-compatible)
        for plate_id, file in request.files.items(multi=True):
            if plate_id in ('screenshots[]', 'screenshots'):
                continue
            if not file:
                continue
            doc = db.mt_sessions.find_one({"plates.id": plate_id})
            if not doc:
                continue
            filename = secure_filename(f"{plate_id}-{int(datetime.utcnow().timestamp())}.png")
            path = os.path.join(save_dir, filename)
            try:
                file.save(path)
            except Exception:
                continue
            rel = f"plate_images/{filename}"
            url = f"/static/{rel}"
            # compute current signature from assignments
            assignments = doc.get("assignments") or []
            parts = next((a.get("parts") or [] for a in assignments if a.get("plateId") == plate_id), [])
            signature = ",".join(f"{p.get('id')}:{int(p.get('quantity') or 0)}" for p in sorted(parts, key=lambda x: x.get('id')))
            plates = doc.get("plates") or []
            for p in plates:
                if p.get("id") == plate_id or p.get("plateId") == plate_id:
                    p["screenshot_url"] = url
                    p["screenshot_path_rel"] = rel
                    p["verifiedSignature"] = signature
                    p["verifiedAt"] = datetime.utcnow().isoformat() + "Z"
            db.mt_sessions.update_one({"_id": doc["_id"]}, {"$set": {"plates": plates, "updatedBy": "webhook-not-fit-image", "updatedAt": datetime.utcnow().isoformat() + "Z"}})
            updated.append(str(doc["_id"]))

    return {"status": "ok", "updated": list(sorted(set(updated)))}


@main_bp.route("/mt/<material_enc>/<thickness_enc>/auto_breakdown", methods=["POST"])
@login_required
def auto_breakdown_mt(material_enc: str, thickness_enc: str):
    material = _norm_material_val(unquote(material_enc))
    thickness = None if thickness_enc in ("", "None") else float(unquote(thickness_enc))
    selected_json = request.form.get("selected_parts_json") or "[]"
    plates_json = request.form.get("plates_json") or "[]"
    try:
        selected_list = json.loads(selected_json)
    except Exception:
        selected_list = []
    try:
        plates_list = json.loads(plates_json)
    except Exception:
        plates_list = []

    # Normalize and filter selected parts
    parts_selected: list[dict[str, Any]] = []
    for item in selected_list:
        part_id = (item.get("id") or "").strip()
        qty_raw = item.get("quantity")
        try:
            qty = int(qty_raw)
        except Exception:
            qty = 0
        if part_id and qty > 0:
            parts_selected.append({"name": part_id, "quantity": qty})

    # Validate plates
    valid_plates: list[dict[str, Any]] = []
    for p in plates_list:
        try:
            w = float(p.get("Width") or 0)
            l = float(p.get("Length") or 0)
            td = float(p.get("trueDepth") or 0)
        except Exception:
            w = l = td = 0
        if w > 0 and l > 0 and td > 0:
            valid_plates.append({"Width": w, "Length": l, "trueDepth": td})

    if not parts_selected or not valid_plates:
        flash("Select parts and add at least one valid plate before requesting breakdown", "danger")
        return redirect(url_for("main.material_thickness", material_enc=material_enc, thickness_enc=thickness_enc))

    payload = {
        "taskId": f"{material}:{thickness}",
        "material": material,
        "thickness": thickness,
        "parts": parts_selected,
        "plates": valid_plates,
    }
    # Optional pre-assignment hints from UI drag-and-drop
    plate_parts_json = request.form.get("plate_parts_json")
    if plate_parts_json:
        try:
            plate_parts = json.loads(plate_parts_json)
            if isinstance(plate_parts, list):
                payload["plateParts"] = plate_parts
        except Exception:
            pass
    try:
        resp = requests.post(f"{_user_api_base()}/breakdown", json=payload, timeout=30)
        resp.raise_for_status()
        try:
            data = resp.json()
        except Exception:
            data = {}
    except Exception as e:
        flash("Breakdown request sent; awaiting server processing.", "info")
        return redirect(url_for("main.material_thickness", material_enc=material_enc, thickness_enc=thickness_enc))

    plates_raw = data.get("Plates") or []
    normalized: list[dict[str, Any]] = []
    for idx, p in enumerate(plates_raw):
        if isinstance(p, dict) and "Parts" not in p and len(p) == 1:
            p = list(p.values())[0]
        plate_id = p.get("id") or str(uuid.uuid4())
        normalized.append({
            "plateId": plate_id,
            "name": p.get("name") or f"Plate {idx+1}",
            "Width": p.get("Width") or p.get("width") or 24,
            "Length": p.get("Length") or p.get("length") or 48,
            "trueDepth": p.get("trueDepth") or thickness,
            "Parts": [
                {"name": item.get("name"), "quantity": int(item.get("quantity", item.get("quanitty", 0) or 0))}
                for item in p.get("Parts", [])
            ],
        })

    # Optionally persist a snapshot of the server result on the MT session for reference
    db = get_db()
    db.mt_sessions.update_one(
        _mt_key(material, thickness),
        {"$set": {"last_breakdown_result": normalized, "updatedAt": datetime.utcnow().isoformat() + "Z"}},
        upsert=True,
    )
    flash("Breakdown request sent. You'll see updates as the server completes.", "info")
    return redirect(url_for("main.material_thickness", material_enc=quote(material, safe=""), thickness_enc=quote(str(thickness if thickness is not None else ""), safe="")))


@main_bp.route("/mt/<material_enc>/<thickness_enc>/cam/<plate_id>", methods=["POST"])
@login_required
def mt_cam_request(material_enc: str, thickness_enc: str, plate_id: str):
    material = _norm_material_val(unquote(material_enc))
    thickness = None if thickness_enc in ("", "None") else float(unquote(thickness_enc))
    db = get_db()
    doc = db.mt_sessions.find_one(_mt_key(material, thickness))
    if not doc:
        doc = db.mt_sessions.find_one({"material": f'"{material}"', "thickness": thickness})
    doc = doc or {}
    plates = doc.get("plates") or []
    assignments = doc.get("assignments") or []
    plate = next((p for p in plates if p.get("id") == plate_id), None)
    a_entry = next((a for a in assignments if a.get("plateId") == plate_id), None)
    if not plate or not a_entry or not (a_entry.get("parts") or []):
        return jsonify({"error": "plate empty"}), 400
    machine = request.form.get("machine") or "IQ"
    body = {
        "plateId": plate_id,
        "material": material,
        "trueDepth": plate.get("trueDepth"),
        "width": plate.get("Width"),
        "length": plate.get("Length"),
        "machine": machine,
        "parts": [{"name": p.get("id"), "quantity": int(p.get("quantity") or 0)} for p in (a_entry.get("parts") or [])],
        "thickness": thickness,
    }
    try:
        requests.post(f"{_user_api_base()}/autocam", json=body, timeout=10)
        # Clear screenshot for this plate on CAM request
        _clear_all_plate_screenshots_for(material, thickness, [plate_id])
        # mark in session for UI
        db.mt_sessions.update_one(_mt_key(material, thickness), {"$set": {"lastCamFor": plate_id, "updatedAt": datetime.utcnow().isoformat() + "Z"}})
    except Exception:
        pass
    return redirect(url_for("main.material_thickness", material_enc=quote(material, safe=""), thickness_enc=quote(str(thickness if thickness is not None else ""), safe="")))


@main_bp.route("/mt/<material_enc>/<thickness_enc>/cam_json/<plate_id>", methods=["POST"])
@login_required
def mt_cam_request_json(material_enc: str, thickness_enc: str, plate_id: str):
    material = _norm_material_val(unquote(material_enc))
    thickness = None if thickness_enc in ("", "None") else float(unquote(thickness_enc))
    db = get_db()
    doc = db.mt_sessions.find_one(_mt_key(material, thickness))
    if not doc:
        doc = db.mt_sessions.find_one({"material": f'"{material}"', "thickness": thickness})
    doc = doc or {}
    # Accept client-provided body (no plateId required)
    payload = request.get_json(force=True, silent=True) or {}
    required = ["material", "trueDepth", "width", "length", "machine", "parts"]
    if any(k not in payload for k in required):
        return jsonify({"error": "invalid body"}), 400
    try:
        payload.setdefault("thickness", thickness)
        payload.setdefault("plateId", plate_id)
        requests.post(f"{_user_api_base()}/autocam", json=payload, timeout=10)
        # Clear screenshot for this plate on CAM request
        _clear_all_plate_screenshots_for(material, thickness, [plate_id])
        db.mt_sessions.update_one(_mt_key(material, thickness), {"$set": {"lastCamFor": plate_id, "updatedAt": datetime.utcnow().isoformat() + "Z"}})
    except Exception:
        # Still clear screenshot to enforce refresh of image after CAM attempt
        _clear_all_plate_screenshots_for(material, thickness, [plate_id])
        return jsonify({"status": "sent_with_warning"})
    return jsonify({"status": "ok"})


@main_bp.route("/task/<task_id>")
@login_required
def task_detail(task_id: str):
    db = get_db()
    task = db[current_app.config["TASKS_COLLECTION"]].find_one({"_id": ObjectId(task_id)})
    if not task:
        flash("Task not found", "warning")
        return redirect(url_for("main.dashboard"))
    thickness = parse_thickness(task.get("Thickness"))
    return render_template("task.html", task=task, thickness=thickness)


@main_bp.route("/task/<task_id>/auto_breakdown", methods=["POST"])
@login_required
def auto_breakdown(task_id: str):
    db = get_db()
    task = db[current_app.config["TASKS_COLLECTION"]].find_one({"_id": ObjectId(task_id)})
    if not task:
        flash("Task not found", "warning")
        return redirect(url_for("main.dashboard"))

    payload = {
        "taskId": task_id,
        "material": task.get("Material"),
        "thickness": parse_thickness(task.get("Thickness")),
        "parts": task.get("Parts", []),
    }
    try:
        resp = requests.post(f"{_user_api_base()}/breakdown", json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        flash(f"Breakdown request failed: {e}", "danger")
        return redirect(url_for("main.task_detail", task_id=task_id))

    plates_raw = data.get("Plates") or []
    normalized: list[dict[str, Any]] = []
    for idx, p in enumerate(plates_raw):
        # p might be dict under name keys like Plate1; handle both forms
        if isinstance(p, dict) and "Parts" not in p and len(p) == 1:
            p = list(p.values())[0]
        plate_id = p.get("id") or str(uuid.uuid4())
        normalized.append({
            "plateId": plate_id,
            "name": p.get("name") or f"Plate {idx+1}",
            "Width": p.get("Width") or p.get("width") or 24,
            "Length": p.get("Length") or p.get("length") or 48,
            "trueDepth": p.get("trueDepth") or payload["thickness"],
            "Parts": [
                {"name": item.get("name"), "quantity": int(item.get("quantity", item.get("quanitty", 0) or 0))}
                for item in p.get("Parts", [])
            ],
        })

    plates_id = save_plates(
        task_id=task_id,
        material=payload["material"],
        thickness=payload["thickness"],
        plates=normalized,
    )
    return redirect(url_for("main.edit_plates", plates_id=plates_id))


@main_bp.route("/plates/<plates_id>")
@login_required
def edit_plates(plates_id: str):
    doc = get_plates(plates_id)
    if not doc:
        flash("Plates not found", "warning")
        return redirect(url_for("main.dashboard"))
    # Hide assigned plates to others if not admin or assignee
    if not current_user.is_admin:
        for p in doc.get("plates", []):
            assigned = p.get("assigned_to")
            if assigned and ObjectId(current_user.id) != assigned:
                p["hidden"] = True
    return render_template("plates.html", plates_doc=doc)


@main_bp.route("/plates/<plates_id>/save", methods=["POST"])
@login_required
def save_plates_route(plates_id: str):
    incoming = request.form.get("plates_json")
    if not incoming:
        flash("Nothing to save", "warning")
        return redirect(url_for("main.edit_plates", plates_id=plates_id))
    try:
        plates = json.loads(incoming)
        update_plates(plates_id, plates)
        flash("Saved", "success")
    except Exception as e:
        flash(f"Save failed: {e}", "danger")
    return redirect(url_for("main.edit_plates", plates_id=plates_id))


@main_bp.route("/plates/<plates_id>/state")
@login_required
def plates_state(plates_id: str):
    doc = get_plates(plates_id)
    if not doc:
        return jsonify({"error": "not found"}), 404
    out = {
        "_id": str(doc.get("_id")),
        "material": doc.get("material"),
        "thickness": doc.get("thickness"),
        "plates": [
            {
                "plateId": p.get("plateId"),
                "name": p.get("name"),
                "Width": p.get("Width"),
                "Length": p.get("Length"),
                "trueDepth": p.get("trueDepth"),
                "cam_download_url": p.get("cam_download_url"),
                "screenshot_url": p.get("screenshot_url"),
                "status": p.get("status"),
                "Parts": p.get("Parts", []),
            }
            for p in (doc.get("plates") or [])
        ],
    }
    return jsonify(out)


def _clear_plate_screenshot(mt_doc_id, plate_id: str):
    db = get_db()
    doc = db.mt_sessions.find_one({"_id": mt_doc_id})
    if not doc:
        return
    plates = doc.get("plates") or []
    changed = False
    for p in plates:
        if p.get("id") == plate_id or p.get("plateId") == plate_id:
            rel = p.get("screenshot_path_rel")
            url = p.get("screenshot_url") or ""
            if not rel and url.startswith("/static/"):
                rel = url[len("/static/"):]
            if rel:
                full = os.path.join(current_app.static_folder, rel)
                try:
                    if os.path.exists(full):
                        os.remove(full)
                except Exception:
                    pass
            for k in ("screenshot_url", "screenshot_path_rel"):
                if p.pop(k, None) is not None:
                    changed = True
    if changed:
        db.mt_sessions.update_one({"_id": mt_doc_id}, {"$set": {"plates": plates, "updatedAt": datetime.utcnow().isoformat() + "Z"}})


@main_bp.route("/mt/webhook/plate_image", methods=["POST"])
def mt_plate_image_webhook():
    plate_id = request.form.get("plateId") or request.args.get("plateId")
    if not plate_id:
        return {"status": "invalid", "error": "plateId required"}, 400
    file = request.files.get("image")
    if not file:
        return {"status": "invalid", "error": "image file required"}, 400
    db = get_db()
    doc = db.mt_sessions.find_one({"plates.id": plate_id})
    if not doc:
        return {"status": "not_found"}, 404
    save_dir = os.path.join(current_app.static_folder, "plate_images")
    os.makedirs(save_dir, exist_ok=True)
    filename = secure_filename(f"{plate_id}-{int(datetime.utcnow().timestamp())}.png")
    path = os.path.join(save_dir, filename)
    file.save(path)
    rel = f"plate_images/{filename}"
    url = f"/static/{rel}"
    plates = doc.get("plates") or []
    for p in plates:
        if p.get("id") == plate_id or p.get("plateId") == plate_id:
            p["screenshot_url"] = url
            p["screenshot_path_rel"] = rel
    db.mt_sessions.update_one({"_id": doc["_id"]}, {"$set": {"plates": plates, "updatedBy": "webhook-plate-image", "updatedAt": datetime.utcnow().isoformat() + "Z"}})
    return {"status": "ok", "url": url}


@main_bp.route("/drafts")
@login_required
def drafts():
    drafts_list = list_drafts(current_user.id)
    return render_template("drafts.html", drafts=drafts_list)


@main_bp.route("/drafts/save", methods=["POST"])
@login_required
def save_draft_route():
    task_id = request.form.get("task_id") or ""
    payload_str = request.form.get("payload") or "{}"
    payload = json.loads(payload_str)
    draft_id = save_draft(current_user.id, task_id, payload)
    flash("Draft saved", "success")
    return redirect(url_for("main.drafts"))


@main_bp.route("/drafts/<draft_id>/delete", methods=["POST"])
@login_required
def delete_draft_route(draft_id: str):
    delete_draft(draft_id, current_user.id)
    flash("Draft deleted", "success")
    return redirect(url_for("main.drafts"))


@main_bp.route("/settings", methods=["GET", "POST"])
@login_required
def settings():
    db = get_db()
    user_doc = db.users.find_one({"_id": ObjectId(current_user.id)}, {"allowed_api_bases": 1, "api_base_url": 1}) or {}
    user_allowed = user_doc.get("allowed_api_bases", []) or []
    base_allowed = current_app.config["ALLOWED_API_BASE_URLS"]
    allowed = sorted({*base_allowed, *user_allowed})

    def is_valid_url(u: str) -> bool:
        try:
            parsed = urlparse(u)
            return parsed.scheme in ("http", "https") and bool(parsed.netloc)
        except Exception:
            return False

    if request.method == "POST":
        custom = (request.form.get("custom_api_base_url") or "").strip()
        chosen = request.form.get("api_base_url") or current_app.config["API_BASE_URL"]
        if custom:
            if not is_valid_url(custom):
                flash("Invalid custom URL. Use http(s)://host[:port]", "danger")
                return redirect(url_for("main.settings"))
            append_user_allowed_api_base_url(current_user.id, custom)
            allowed = sorted({*allowed, custom})
            chosen = custom
        if chosen not in allowed:
            flash("Invalid selection", "danger")
        else:
            upsert_user_api_base_url(current_user.id, chosen)
            flash("Settings updated", "success")
        return redirect(url_for("main.settings"))

    return render_template("settings.html", allowed=allowed, current=_user_api_base())


@main_bp.route("/plates/<plates_id>/cam/<plate_id>", methods=["POST"])
@login_required
def cam_request(plates_id: str, plate_id: str):
    machine = request.form.get("machine") or "IQ"
    doc = get_plates(plates_id)
    if not doc:
        return jsonify({"error": "not found"}), 404
    plate = next((p for p in doc.get("plates", []) if p.get("plateId") == plate_id), None)
    if not plate:
        return jsonify({"error": "plate not found"}), 404

    # Visibility: assign to requester now
    assign_plate(plates_id, plate_id, current_user.id)

    body = {
        "plateId": plate_id,
        "material": doc.get("material"),
        "trueDepth": plate.get("trueDepth"),
        "width": plate.get("Width"),
        "length": plate.get("Length"),
        "machine": machine,
        "parts": plate.get("Parts", []),
        "thickness": doc.get("thickness"),
    }
    try:
        requests.post(f"{_user_api_base()}/autocam", json=body, timeout=10)
    except Exception:
        # Even if it fails, the assignment stands; surface warning on UI
        flash("CAM request could not be sent to server", "warning")
    return redirect(url_for("main.edit_plates", plates_id=plates_id))


@main_bp.route("/webhook/cam_complete", methods=["POST"])
def cam_complete_webhook():
    data = request.get_json(force=True, silent=True) or {}
    plate_id = data.get("plateId")
    download_url = data.get("downloadUrl")
    if not plate_id or not download_url:
        return {"status": "invalid"}, 400
    plates_doc_id = data.get("platesId")  # optional; otherwise we search
    db = get_db()
    if not plates_doc_id:
        doc = db.plates.find_one({"plates.plateId": plate_id}, {"_id": 1})
        if doc:
            plates_doc_id = str(doc["_id"])
    if plates_doc_id:
        set_plate_download(plates_doc_id, plate_id, download_url)
    # Also update MT session if present
    mt_doc = db.mt_sessions.find_one({"plates.id": plate_id})
    if mt_doc:
        plates = mt_doc.get("plates") or []
        for p in plates:
            if p.get("id") == plate_id:
                p["cam_download_url"] = download_url
        db.mt_sessions.update_one({"_id": mt_doc["_id"]}, {"$set": {"plates": plates, "updatedAt": datetime.utcnow().isoformat() + "Z"}})
    return {"status": "ok"}


@main_bp.route("/mt/webhook/cam_bundle", methods=["POST"])
def mt_cam_bundle_webhook():
    # Accept JSON or form-data. Do not require auth (called by external CAM server)
    data_json = request.get_json(silent=True) or {}
    plate_id = data_json.get("plateId") or request.form.get("plateId")
    # Fallback: try infer from first filename like PLATE_ID.ext
    if not plate_id:
        files_any = request.files.getlist('files[]') or request.files.getlist('files') or list(request.files.values())
        if files_any:
            base = os.path.basename(getattr(files_any[0], 'filename', '') or '')
            if base:
                plate_id = os.path.splitext(base)[0]
    if not plate_id:
        return {"status": "invalid", "error": "plateId required"}, 400

    db = get_db()
    # Find session by plateId
    doc = db.mt_sessions.find_one({"plates.id": plate_id})
    if not doc:
        return {"status": "not_found"}, 404

    # Collect files
    incoming = request.files.getlist('files[]') or request.files.getlist('files') or list(request.files.values())
    if not incoming:
        return {"status": "invalid", "error": "files required"}, 400

    bundles_dir = os.path.join(current_app.static_folder, "cam_bundles")
    os.makedirs(bundles_dir, exist_ok=True)

    # If exactly one file and it's a zip, save directly as the bundle
    if len(incoming) == 1 and getattr(incoming[0], 'filename', '').lower().endswith('.zip'):
        fs = incoming[0]
        base = os.path.basename(fs.filename)
        name_only = os.path.splitext(base)[0]
        safe = secure_filename(f"{name_only}-{int(datetime.utcnow().timestamp())}.zip")
        out_path = os.path.join(bundles_dir, safe)
        try:
            fs.save(out_path)
        except Exception:
            return {"status": "error", "error": "save_failed"}, 500
        rel = f"cam_bundles/{safe}"
        url = f"/static/{rel}"
        plates = doc.get("plates") or []
        for p in plates:
            if p.get("id") == plate_id or p.get("plateId") == plate_id:
                p["cam_download_url"] = url
                p["cam_bundle_rel"] = rel
        db.mt_sessions.update_one({"_id": doc["_id"]}, {"$set": {"plates": plates, "updatedBy": "webhook-cam-bundle", "updatedAt": datetime.utcnow().isoformat() + "Z"}})
        return {"status": "ok", "bundle": url}

    # Otherwise, save multiple files to temp and zip
    import shutil, tempfile, zipfile
    tmpdir = tempfile.mkdtemp(prefix=f"cam_{plate_id}_")
    try:
        saved_files: list[str] = []
        for fs in incoming:
            if not fs or not getattr(fs, 'filename', None):
                continue
            fname = secure_filename(fs.filename)
            out = os.path.join(tmpdir, fname)
            fs.save(out)
            saved_files.append(out)
        if not saved_files:
            return {"status": "invalid", "error": "no files saved"}, 400

        zip_name = secure_filename(f"{plate_id}-{int(datetime.utcnow().timestamp())}.zip")
        zip_path = os.path.join(bundles_dir, zip_name)
        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
            for f in saved_files:
                arcname = os.path.basename(f)
                zf.write(f, arcname)
        rel = f"cam_bundles/{zip_name}"
        url = f"/static/{rel}"

        plates = doc.get("plates") or []
        changed = False
        old_rel = None
        for p in plates:
            if p.get("id") == plate_id or p.get("plateId") == plate_id:
                old_url = p.get("cam_download_url") or ""
                if old_url.startswith("/static/"):
                    old_rel = old_url[len("/static/"):]
                p["cam_download_url"] = url
                p["cam_bundle_rel"] = rel
                changed = True
        if changed:
            if old_rel:
                old_full = os.path.join(current_app.static_folder, old_rel)
                try:
                    if os.path.exists(old_full):
                        os.remove(old_full)
                except Exception:
                    pass
            db.mt_sessions.update_one({"_id": doc["_id"]}, {"$set": {"plates": plates, "updatedBy": "webhook-cam-bundle", "updatedAt": datetime.utcnow().isoformat() + "Z"}})
    finally:
        try:
            shutil.rmtree(tmpdir)
        except Exception:
            pass

    return {"status": "ok", "bundle": url} 