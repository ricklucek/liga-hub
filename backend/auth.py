
import os, uuid, time
from functools import wraps
from flask import Blueprint, request, jsonify
from sqlalchemy import text
from passlib.hash import bcrypt
import pyotp, jwt

bp = Blueprint('auth', __name__, url_prefix='/auth')

JWT_SECRET = os.getenv("JWT_SECRET", "devsecret-change-me")
JWT_ALG = "HS256"
JWT_EXP_SECONDS = int(os.getenv("JWT_EXP_SECONDS", "7200"))

def create_jwt(payload):
    payload = dict(payload)
    payload.update({"iat": int(time.time()), "exp": int(time.time()) + JWT_EXP_SECONDS})
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_jwt(token):
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])

def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "missing Bearer token"}), 401
        token = auth.split(" ",1)[1].strip()
        try:
            data = decode_jwt(token)
        except Exception:
            return jsonify({"error": "invalid token"}), 401
        request.user = {"id": data.get("sub"), "email": data.get("email")}
        return f(*args, **kwargs)
    return wrapper

@bp.post("/register")
def register():
    from app import engine
    body = request.get_json() or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    if not email or not password:
        return jsonify({"error":"email and password are required"}), 400
    user_id = str(uuid.uuid4())
    pw_hash = bcrypt.hash(password)
    secret = pyotp.random_base32()
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
              id VARCHAR(36) PRIMARY KEY,
              email VARCHAR(255) UNIQUE NOT NULL,
              password_hash VARCHAR(255) NOT NULL,
              two_factor_enabled BOOLEAN DEFAULT FALSE,
              two_factor_secret VARCHAR(32),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        try:
            conn.execute(text("""
                INSERT INTO users (id, email, password_hash, two_factor_secret, two_factor_enabled)
                VALUES (:id, :email, :password_hash, :secret, :enabled)
            """), {"id":user_id, "email":email, "password_hash":pw_hash, "secret":secret, "enabled": False})
        except Exception:
            return jsonify({"error":"email already registered"}), 409
    issuer = os.getenv("TOTP_ISSUER","EsportsMVP")
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=email, issuer_name=issuer)
    return jsonify({"id": user_id, "email": email, "two_factor_secret": secret, "otpauth_url": otpauth_url}), 201

@bp.post("/enable-2fa")
def enable_2fa():
    from app import engine
    body = request.get_json() or {}
    email = (body.get("email") or "").strip().lower()
    code = (body.get("code") or "").strip()
    if not email or not code:
        return jsonify({"error":"email and code are required"}), 400
    with engine.begin() as conn:
        row = conn.execute(text("SELECT id, two_factor_secret FROM users WHERE email=:email"), {"email":email}).mappings().first()
        if not row:
            return jsonify({"error":"user not found"}), 404
        totp = pyotp.TOTP(row["two_factor_secret"])
        if not totp.verify(code):
            return jsonify({"error":"invalid code"}), 400
        conn.execute(text("UPDATE users SET two_factor_enabled=TRUE WHERE id=:id"), {"id": row["id"]})
    return jsonify({"ok": True})

@bp.post("/login")
def login():
    from app import engine
    body = request.get_json() or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    code = (body.get("code") or "").strip()
    if not email or not password:
        return jsonify({"error":"email and password are required"}), 400
    with engine.connect() as conn:
        user = conn.execute(text("SELECT id, email, password_hash, two_factor_enabled, two_factor_secret FROM users WHERE email=:email"),
                            {"email":email}).mappings().first()
        if not user or not bcrypt.verify(password, user["password_hash"]):
            return jsonify({"error":"invalid credentials"}), 401
        if user["two_factor_enabled"]:
            if not code:
                return jsonify({"require_2fa": True}), 401
            totp = pyotp.TOTP(user["two_factor_secret"])
            if not totp.verify(code):
                return jsonify({"error":"invalid code"}), 401
    token = create_jwt({"sub": user["id"], "email": user["email"]})
    return jsonify({"access_token": token, "user": {"id": user["id"], "email": user["email"]}})

@bp.get("/me")
@login_required
def me():
    return jsonify({"user": request.user})
