from flask import Blueprint, make_response, redirect, render_template, request
import httpx
import re

PIN = "mikal13"
COOKIE = "mikal_profile"
COOKIE_VALUE = "mikal"

bp = Blueprint("mikal_profile", __name__)


def logged_in():
    return request.cookies.get(COOKIE) == COOKIE_VALUE


@bp.route("/login", methods=["GET", "POST"])
def login():
    if logged_in():
        return redirect("/")

    error = None
    if request.method == "POST":
        pin = str(request.form.get("pin", "")).strip()
        if pin == PIN:
            response = make_response(redirect("/"))
            response.set_cookie(
                COOKIE,
                COOKIE_VALUE,
                max_age=60 * 60 * 24 * 90,
                httponly=True,
                samesite="Lax",
                secure=request.headers.get("X-Forwarded-Proto", request.scheme) == "https",
                path="/",
            )
            return response
        error = "Fel kod. Försök igen."

    return render_template("login.html", error=error)


@bp.route("/logout")
def logout():
    response = make_response(redirect("/login"))
    response.delete_cookie(COOKIE, path="/")
    return response


@bp.route("/utveckling")
def utveckling():
    if not logged_in():
        return redirect("/login")
    return render_template("utveckling.html")


@bp.route("/prov")
def prov():
    if not logged_in():
        return redirect("/login")
    return render_template("prov.html")


@bp.route("/api/prov/check", methods=["POST"])
def prov_check():
    if not logged_in():
        return {"ok": False, "error": "Inte inloggad"}, 401

    data = request.get_json(silent=True) or {}
    text = str(data.get("text", ""))

    if len(text.strip()) < 20:
        return {"ok": False, "error": "Texten är för kort."}, 400

    if len(text) > 12000:
        return {"ok": False, "error": "Texten är för lång."}, 400

    try:
        response = httpx.post(
            "https://api.languagetool.org/v2/check",
            data={
                "text": text,
                "language": "sv-SE",
                "enabledOnly": "false",
            },
            headers={"User-Agent": "MikalLearn/1.0"},
            timeout=15.0,
        )
        response.raise_for_status()
        payload = response.json()
    except Exception:
        return {"ok": False, "error": "Stavningskontrollen är tillfälligt otillgänglig."}, 502

    errors = []
    used_ranges = set()

    for match in payload.get("matches", []):
        rule = match.get("rule") or {}
        issue_type = str(rule.get("issueType", "")).lower()
        category = rule.get("category") or {}
        category_id = str(category.get("id", "")).upper()

        if issue_type not in {"misspelling", "typographical"} and category_id != "TYPOS":
            continue

        offset = int(match.get("offset", -1))
        length = int(match.get("length", 0))
        if offset < 0 or length <= 0 or offset + length > len(text):
            continue

        original = text[offset:offset + length]
        if not re.search(r"[A-Za-zÅÄÖåäö]", original):
            continue

        range_key = (offset, length)
        if range_key in used_ranges:
            continue
        used_ranges.add(range_key)

        suggestions = []
        for item in match.get("replacements", [])[:8]:
            value = str(item.get("value", "")).strip()
            if value and value.lower() != original.lower() and value not in suggestions:
                suggestions.append(value)
            if len(suggestions) >= 5:
                break

        errors.append({
            "offset": offset,
            "length": length,
            "word": original,
            "suggestions": suggestions,
        })

    errors.sort(key=lambda item: item["offset"])
    return {"ok": True, "errors": errors}


def init_profile(app):
    if "mikal_profile" not in app.blueprints:
        app.register_blueprint(bp)

    @app.before_request
    def require_profile_login():
        path = request.path or "/"

        if (
            path == "/login"
            or path.startswith("/static/")
            or path == "/favicon.ico"
        ):
            return None

        if logged_in():
            if path in {"/lasa", "/lasloop"}:
                return redirect("/")
            return None

        if path.startswith("/api/"):
            return {"error": "Inte inloggad"}, 401

        return redirect("/login")
