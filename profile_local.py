from flask import Blueprint, make_response, redirect, render_template, request

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
            return None

        if path.startswith("/api/"):
            return {"error": "Inte inloggad"}, 401

        return redirect("/login")
