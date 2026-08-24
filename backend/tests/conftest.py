import os

import pytest
import requests
from dotenv import dotenv_values

ENV = dotenv_values("/app/.env")

APP_URL = os.environ.get("APP_BASE_URL", "http://localhost:8080").rstrip("/")
SUPABASE_URL = (os.environ.get("SUPABASE_URL") or ENV.get("SUPABASE_URL") or "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ENV.get("SUPABASE_SERVICE_ROLE_KEY")
ANON_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY") or ENV.get("SUPABASE_PUBLISHABLE_KEY")
CRON_SECRET = os.environ.get("OFFER_FEED_CRON_SECRET") or ENV.get("OFFER_FEED_CRON_SECRET")

CRON_PATH = "/api/cron/refresh-offer-feed"


def _rest(key):
    s = requests.Session()
    s.headers.update({"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def app_client():
    return requests.Session()


@pytest.fixture(scope="session")
def sb_admin():
    if not (SUPABASE_URL and SERVICE_KEY):
        pytest.fail("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in /app/.env")
    return _rest(SERVICE_KEY)


@pytest.fixture(scope="session")
def sb_anon():
    if not (SUPABASE_URL and ANON_KEY):
        pytest.fail("Missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY in /app/.env")
    return _rest(ANON_KEY)


@pytest.fixture(scope="session")
def cron_run(app_client):
    """Run a forced cron refresh once for the session; return parsed response."""
    r = app_client.get(f"{APP_URL}{CRON_PATH}", params={"secret": CRON_SECRET, "force": "1"}, timeout=180)
    return r
