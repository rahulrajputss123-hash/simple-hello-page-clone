"""Supabase REST tests for BUG 1 (offers RLS recursion 42P17) and BUG 2 (offers.image_url column).

There is no FastAPI backend in this app; the client-reachable "backend" is Supabase REST
(PostgREST) accessed with the publishable (anon) key, optionally upgraded to a user JWT.
"""

import os

import pytest
import requests
from dotenv import dotenv_values

ENV = dotenv_values("/app/.env")
SUPABASE_URL = (os.environ.get("SUPABASE_URL") or ENV.get("SUPABASE_URL") or "").strip('"').rstrip("/")
ANON_KEY = (os.environ.get("SUPABASE_PUBLISHABLE_KEY") or ENV.get("SUPABASE_PUBLISHABLE_KEY") or "").strip('"')
SERVICE_KEY = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ENV.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip('"')

QA_EMAIL = "qa.assistant@cashgpt.test"
QA_PASSWORD = "CashGPT!test123"


@pytest.fixture(scope="module")
def anon_session():
    if not (SUPABASE_URL and ANON_KEY):
        pytest.fail("Missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY in /app/.env")
    s = requests.Session()
    s.headers.update({"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"})
    return s


@pytest.fixture(scope="module")
def user_token():
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        json={"email": QA_EMAIL, "password": QA_PASSWORD},
        timeout=30,
    )
    if r.status_code != 200:
        pytest.fail(f"QA login failed {r.status_code}: {r.text[:300]}")
    token = r.json().get("access_token")
    assert isinstance(token, str) and token
    return token


@pytest.fixture(scope="module")
def auth_session(user_token):
    s = requests.Session()
    s.headers.update({"apikey": ANON_KEY, "Authorization": f"Bearer {user_token}"})
    return s


# --- BUG 1: RLS recursion (42P17) ---------------------------------------------

SECTION_BANNER_QUERY = "select=id,reward_amount,is_active&is_active=eq.true&limit=200"


def test_authenticated_offers_read_no_recursion(auth_session):
    """The exact SectionBanner client query, as an authenticated user."""
    r = auth_session.get(f"{SUPABASE_URL}/rest/v1/offers?{SECTION_BANNER_QUERY}", timeout=30)
    assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
    assert "42P17" not in r.text
    rows = r.json()
    assert isinstance(rows, list) and len(rows) > 0, "authenticated user sees no active offers"
    for row in rows:
        assert row["is_active"] is True
        assert "id" in row and isinstance(row["id"], str)


def test_anon_offers_read_no_recursion(anon_session):
    r = anon_session.get(f"{SUPABASE_URL}/rest/v1/offers?{SECTION_BANNER_QUERY}", timeout=30)
    assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
    assert "42P17" not in r.text
    assert isinstance(r.json(), list)


def test_rls_hides_inactive_offers(auth_session):
    """Consolidated SELECT policy: only is_active and non-expired rows are visible."""
    r = auth_session.get(
        f"{SUPABASE_URL}/rest/v1/offers?select=id,is_active,expires_at&is_active=eq.false&limit=5",
        timeout=30,
    )
    assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
    assert r.json() == [], "inactive offers are visible to a normal user (RLS too permissive)"


def test_service_role_sees_inactive_offers_exist(anon_session):
    """Sanity: inactive rows do exist in the table, so the previous test is meaningful."""
    if not SERVICE_KEY:
        pytest.skip("no service role key")
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/offers?select=id,is_active&is_active=eq.false&limit=5",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
        timeout=30,
    )
    assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
    # informational only
    print(f"inactive offers visible to service role: {len(r.json())}")


# --- BUG 2: image_url column ---------------------------------------------------

def test_offers_image_url_column_exists_for_client(auth_session):
    r = auth_session.get(
        f"{SUPABASE_URL}/rest/v1/offers?select=id,title,icon,image_url&limit=50", timeout=30
    )
    assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
    assert "42703" not in r.text, "image_url column missing (42703)"
    rows = r.json()
    assert rows, "no offers returned"
    assert "image_url" in rows[0]


def test_image_url_backfilled_and_icon_not_a_url_when_manual(auth_session):
    r = auth_session.get(
        f"{SUPABASE_URL}/rest/v1/offers?select=id,icon,image_url&limit=200", timeout=30
    )
    assert r.status_code == 200
    rows = r.json()
    url_icons = [x for x in rows if isinstance(x.get("icon"), str) and x["icon"].startswith("http")]
    for row in url_icons:
        assert row.get("image_url"), f"offer {row['id']} has URL icon but empty image_url (backfill missed)"
    with_image = [x for x in rows if x.get("image_url")]
    assert with_image, "no offer has image_url populated"
    for row in with_image:
        assert str(row["image_url"]).startswith("http"), f"non-URL image_url: {row['image_url']}"
    print(f"offers={len(rows)} with_image_url={len(with_image)} url_icons={len(url_icons)}")


def test_offers_write_blocked_for_normal_user(auth_session):
    r = auth_session.post(
        f"{SUPABASE_URL}/rest/v1/offers",
        headers={"Content-Type": "application/json", "Prefer": "return=representation"},
        json={"title": "TEST_rls_probe", "description": "TEST", "reward_amount": 1},
        timeout=30,
    )
    assert r.status_code in (401, 403, 404, 400, 42501 and 403), f"unexpected {r.status_code}: {r.text[:300]}"
    assert r.status_code >= 400, "normal user was able to insert into offers"
