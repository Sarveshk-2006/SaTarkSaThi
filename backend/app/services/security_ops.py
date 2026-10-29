"""
Operational security helpers: in-memory rate limiting, secret redaction for logs, evidence retention.
"""

import datetime
import logging
import re
import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Optional, Tuple

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.config import settings

logger = logging.getLogger("satark_saathi.security")

# ── Rate limiting ────────────────────────────────────────────────────────────

_LOGIN_PATHS = ("/api/auth/login", "/api/auth/demo-token")
_ANALYSIS_PREFIXES = ("/api/v1/analyze", "/api/scanner", "/api/sdk", "/api/whatsapp", "/api/payment")
_SENSITIVE_PREFIXES = (
    "/api/settings/reset-database",
    "/api/settings/system",
    "/api/integrations/",
    "/api/admin",
    "/api/contacts/invitations",
    "/api/safety",
)


def _bucket_for(path: str, method: str) -> Optional[Tuple[str, int]]:
    if method in ("GET", "HEAD", "OPTIONS") and not path.startswith("/api/whatsapp"):
        return None
    if path in _LOGIN_PATHS:
        return "login", settings.rate_limit_login_per_minute
    if path.startswith(_SENSITIVE_PREFIXES):
        return "sensitive", settings.rate_limit_sensitive_per_minute
    if path.startswith(_ANALYSIS_PREFIXES):
        return "analysis", settings.rate_limit_analysis_per_minute
    return None


class _SlidingWindow:
    def __init__(self):
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def hit(self, key: str, limit: int, window: float = 60.0) -> Optional[int]:
        """Records a hit; returns seconds to wait if over the limit, else None."""
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            while q and now - q[0] > window:
                q.popleft()
            if len(q) >= limit:
                return max(1, int(window - (now - q[0])) + 1)
            q.append(now)
            if len(self._hits) > 10000:
                for k in [k for k, v in self._hits.items() if not v][:5000]:
                    self._hits.pop(k, None)
            return None

    def reset(self):
        with self._lock:
            self._hits.clear()


rate_limiter = _SlidingWindow()


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if settings.rate_limit_enabled:
            bucket = _bucket_for(request.url.path, request.method)
            if bucket:
                name, limit = bucket
                client_ip = request.client.host if request.client else "unknown"
                wait = rate_limiter.hit(f"{name}:{client_ip}", limit)
                if wait is not None:
                    logger.warning(f"Rate limit '{name}' exceeded for {client_ip} on {request.url.path}")
                    return JSONResponse(
                        status_code=429,
                        headers={"Retry-After": str(wait)},
                        content={
                            "status": "error",
                            "error_code": "RATE_LIMITED",
                            "message": f"Too many requests. Please wait {wait} seconds and try again.",
                        },
                    )
        return await call_next(request)


# ── Log redaction ────────────────────────────────────────────────────────────

_REDACTIONS = [
    (re.compile(r"(?i)(bearer\s+)[A-Za-z0-9\-._~+/]+=*"), r"\1[REDACTED]"),
    (re.compile(r"\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+"), "[REDACTED_JWT]"),
    (re.compile(r"(?i)((?:api[_-]?key|apikey|access[_-]?token|secret|password|passcode|authorization)"
                r"[\"']?\s*[:=]\s*[\"']?)[^\s\"'&,}]+"), r"\1[REDACTED]"),
    (re.compile(r"(?i)\b(otp|pin)(\s*(?:is|:|=)?\s*)\d{4,8}\b"), r"\1\2[REDACTED]"),
]


def redact(text: str) -> str:
    if not text:
        return text
    for pattern, repl in _REDACTIONS:
        text = pattern.sub(repl, text)
    return text


class RedactingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            record.msg = redact(record.getMessage())
            record.args = None
            if record.exc_info and not record.exc_text:
                record.exc_text = redact(logging.Formatter().formatException(record.exc_info))
        except Exception:
            pass
        return True


def install_log_redaction():
    flt = RedactingFilter()
    for name in ("", "uvicorn", "uvicorn.error", "uvicorn.access"):
        for handler in logging.getLogger(name).handlers:
            if not any(isinstance(f, RedactingFilter) for f in handler.filters):
                handler.addFilter(flt)


# ── Evidence retention ───────────────────────────────────────────────────────

REDACTED_TEXT = "[Redacted after retention period]"


def purge_expired_evidence(db) -> dict:
    """Redacts raw scanned text and matched excerpts older than EVIDENCE_RETENTION_DAYS.
    Risk scores, categories and audit events are kept so history stays meaningful."""
    from backend.app.models import ScamAnalysis, ScamEvidence

    days = settings.evidence_retention_days
    if days <= 0:
        return {"redacted_analyses": 0, "redacted_evidence": 0, "retention_days": days}

    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)
    analyses = db.query(ScamAnalysis).filter(
        ScamAnalysis.created_at < cutoff,
        ScamAnalysis.is_seed_data == False,  # noqa: E712
        ScamAnalysis.input_text != REDACTED_TEXT,
    ).all()
    ids = [a.id for a in analyses]
    for a in analyses:
        a.input_text = REDACTED_TEXT
    evidence_count = 0
    if ids:
        evidence_count = db.query(ScamEvidence).filter(
            ScamEvidence.analysis_id.in_(ids), ScamEvidence.matched_text.isnot(None)
        ).update({ScamEvidence.matched_text: None}, synchronize_session=False)
    db.commit()
    if analyses:
        logger.info(f"Retention purge redacted {len(analyses)} analyses older than {days} days")
    return {"redacted_analyses": len(analyses), "redacted_evidence": evidence_count, "retention_days": days}
