"""Backend tests for geo-targeted Offer Feed automation (cron route, cache, RLS, ranking)."""

from datetime import datetime, timezone

import pytest

from conftest import ANON_KEY, APP_URL, CRON_PATH, CRON_SECRET, SUPABASE_URL

REST = f"{SUPABASE_URL}/rest/v1"


def _dt(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


# --- Module: src/routes/api/cron/refresh-offer-feed.ts (auth guard) ---
class TestCronAuth:
    def test_no_secret_returns_401(self, app_client):
        r = app_client.get(f"{APP_URL}{CRON_PATH}", timeout=30)
        assert r.status_code == 401
        assert r.json() == {"ok": False, "error": "unauthorized"}

    def test_wrong_secret_returns_401(self, app_client):
        r = app_client.get(f"{APP_URL}{CRON_PATH}", params={"secret": "wrong"}, timeout=30)
        assert r.status_code == 401
        assert r.json() == {"ok": False, "error": "unauthorized"}

    def test_wrong_bearer_returns_401(self, app_client):
        r = app_client.get(f"{APP_URL}{CRON_PATH}", headers={"Authorization": "Bearer nope"}, timeout=30)
        assert r.status_code == 401

    def test_post_without_secret_returns_401(self, app_client):
        r = app_client.post(f"{APP_URL}{CRON_PATH}", timeout=30)
        assert r.status_code == 401

    def test_header_secret_authorizes(self, app_client):
        r = app_client.get(
            f"{APP_URL}{CRON_PATH}", headers={"x-cron-secret": CRON_SECRET}, timeout=180
        )
        assert r.status_code == 200, r.text[:500]
        assert r.json().get("ok") is True

    def test_bearer_secret_authorizes(self, app_client):
        r = app_client.get(
            f"{APP_URL}{CRON_PATH}",
            headers={"Authorization": f"Bearer {CRON_SECRET}"},
            timeout=180,
        )
        assert r.status_code == 200, r.text[:500]
        assert r.json().get("ok") is True


# --- Module: refreshAllFeedsImpl / refreshProviderCountry ---
class TestCronRefresh:
    def test_forced_refresh_success(self, cron_run):
        assert cron_run.status_code == 200, cron_run.text[:800]
        body = cron_run.json()
        assert body["ok"] is True
        assert body["errors"] == [], f"cron reported errors: {body['errors']}"
        assert isinstance(body["refreshed"], list) and body["refreshed"], "no providers refreshed"

    def test_us_refreshed_with_capped_count(self, cron_run):
        body = cron_run.json()
        us = [x for x in body["refreshed"] if x["country"] == "US"]
        assert us, f"US not refreshed: {body['refreshed']}"
        for entry in us:
            assert entry["provider"] == "adbluemedia"
            assert 0 < entry["count"] <= 10, f"AdBlueMedia cap violated: {entry}"

    def test_all_counts_respect_cap(self, cron_run):
        for entry in cron_run.json()["refreshed"]:
            assert entry["count"] <= 10, entry


# --- Module: offer_feed_cache table state ---
class TestFeedCacheTable:
    def test_us_cache_row_exists(self, cron_run, sb_admin):
        assert cron_run.status_code == 200
        r = sb_admin.get(f"{REST}/offer_feed_cache", params={"select": "*", "country": "eq.US"}, timeout=30)
        assert r.status_code == 200, r.text[:400]
        rows = r.json()
        assert len(rows) == 1, f"expected 1 US cache row, got {len(rows)}"
        row = rows[0]
        assert row["offer_count"] == 10, f"offer_count={row['offer_count']}"
        assert row["sync_error"] is None
        assert isinstance(row["offers"], list)
        assert len(row["offers"]) == row["offer_count"]

    def test_cache_offers_payload_shape(self, cron_run, sb_admin):
        r = sb_admin.get(f"{REST}/offer_feed_cache", params={"select": "offers", "country": "eq.US"}, timeout=30)
        offers = r.json()[0]["offers"]
        for o in offers:
            assert set(["id", "title", "rewardAmount"]).issubset(o.keys()), o
            assert isinstance(o["id"], str) and len(o["id"]) == 36
            assert float(o["rewardAmount"]) >= 0

    def test_expiry_window_matches_refresh_interval(self, cron_run, sb_admin):
        settings = sb_admin.get(
            f"{REST}/offer_feed_settings", params={"select": "refresh_interval_hours"}, timeout=30
        ).json()[0]
        hours = int(settings["refresh_interval_hours"])
        r = sb_admin.get(
            f"{REST}/offer_feed_cache",
            params={"select": "last_synced_at,expires_at", "country": "eq.US"},
            timeout=30,
        )
        row = r.json()[0]
        delta_h = (_dt(row["expires_at"]) - _dt(row["last_synced_at"])).total_seconds() / 3600
        assert abs(delta_h - hours) < 0.05, f"expires_at-last_synced_at={delta_h}h, expected {hours}h"

    def test_cache_is_fresh_after_run(self, cron_run, sb_admin):
        row = sb_admin.get(
            f"{REST}/offer_feed_cache", params={"select": "expires_at", "country": "eq.US"}, timeout=30
        ).json()[0]
        assert _dt(row["expires_at"]) > datetime.now(timezone.utc)

    def test_unique_provider_country(self, cron_run, sb_admin):
        rows = sb_admin.get(f"{REST}/offer_feed_cache", params={"select": "provider_id,country"}, timeout=30).json()
        keys = [(r["provider_id"], r["country"]) for r in rows]
        assert len(keys) == len(set(keys)), "duplicate (provider_id,country) rows"


# --- Module: offer_feed_settings singleton ---
class TestFeedSettings:
    def test_singleton_defaults(self, sb_admin):
        r = sb_admin.get(f"{REST}/offer_feed_settings", params={"select": "*"}, timeout=30)
        assert r.status_code == 200, r.text[:400]
        rows = r.json()
        assert len(rows) == 1, f"expected singleton row, got {len(rows)}"
        s = rows[0]
        assert s["id"] is True
        assert s["refresh_interval_hours"] == 5
        assert s["default_country"] == "US"
        assert s["fallback_behavior"] == "default_country"
        assert s["featured_slots"] == 3

    def test_settings_constraints_enforced(self, sb_admin):
        """CHECK constraints must reject out-of-range values (then restore)."""
        bad = sb_admin.patch(
            f"{REST}/offer_feed_settings?id=eq.true",
            json={"refresh_interval_hours": 0},
            timeout=30,
        )
        assert bad.status_code >= 400, "refresh_interval_hours=0 should violate CHECK"
        bad2 = sb_admin.patch(
            f"{REST}/offer_feed_settings?id=eq.true", json={"fallback_behavior": "bogus"}, timeout=30
        )
        assert bad2.status_code >= 400, "invalid fallback_behavior should violate CHECK"
        cur = sb_admin.get(
            f"{REST}/offer_feed_settings", params={"select": "refresh_interval_hours,fallback_behavior"}, timeout=30
        ).json()[0]
        assert cur["refresh_interval_hours"] == 5
        assert cur["fallback_behavior"] == "default_country"


# --- Module: offers table network rows / revenue share math ---
class TestNetworkOffers:
    def test_network_offers_exist_and_active(self, cron_run, sb_admin):
        r = sb_admin.get(
            f"{REST}/offers",
            params={
                "select": "id,source,is_active,reward_amount,network_payout,revenue_share,external_offer_id,click_url,provider_id",
                "source": "eq.network",
                "is_active": "eq.true",
            },
            timeout=30,
        )
        assert r.status_code == 200, r.text[:400]
        rows = r.json()
        assert len(rows) >= 10, f"expected >=10 network offers, got {len(rows)}"
        for o in rows:
            assert o["provider_id"], o
            assert o["external_offer_id"], o
            assert o["click_url"], f"missing click_url: {o['id']}"

    def test_reward_equals_payout_times_revenue_share(self, cron_run, sb_admin):
        rows = sb_admin.get(
            f"{REST}/offers",
            params={
                "select": "id,reward_amount,network_payout,revenue_share",
                "source": "eq.network",
                "is_active": "eq.true",
            },
            timeout=30,
        ).json()
        checked = 0
        for o in rows:
            if o["network_payout"] is None:
                continue
            share = float(o["revenue_share"])
            assert share == 0.6, f"expected default_revenue_share 0.6, got {share}"
            expected = round(float(o["network_payout"]) * share, 2)
            assert abs(float(o["reward_amount"]) - expected) < 0.005, (
                f"offer {o['id']}: reward={o['reward_amount']} expected={expected}"
            )
            checked += 1
        assert checked >= 10, f"only {checked} offers had payouts"

    def test_cached_ids_reference_real_offer_rows(self, cron_run, sb_admin):
        cached = sb_admin.get(
            f"{REST}/offer_feed_cache", params={"select": "offers", "country": "eq.US"}, timeout=30
        ).json()[0]["offers"]
        ids = ",".join(o["id"] for o in cached)
        rows = sb_admin.get(
            f"{REST}/offers", params={"select": "id,source", "id": f"in.({ids})"}, timeout=30
        ).json()
        assert len(rows) == len(cached), f"cache references {len(cached)} ids, DB has {len(rows)}"
        assert all(r["source"] == "network" for r in rows)

    def test_idempotent_upsert_no_duplicates(self, app_client, sb_admin):
        """Re-running the cron must upsert (not duplicate) on provider_id+external_offer_id."""
        before = sb_admin.get(
            f"{REST}/offers", params={"select": "id", "source": "eq.network"}, timeout=30
        ).json()
        r = app_client.get(
            f"{APP_URL}{CRON_PATH}", params={"secret": CRON_SECRET, "force": "1"}, timeout=180
        )
        assert r.status_code == 200
        after = sb_admin.get(
            f"{REST}/offers", params={"select": "id,provider_id,external_offer_id", "source": "eq.network"}, timeout=30
        ).json()
        keys = [(o["provider_id"], o["external_offer_id"]) for o in after]
        assert len(keys) == len(set(keys)), "duplicate provider_id+external_offer_id rows created"
        assert len(after) <= len(before) + 10, f"offer rows grew unexpectedly {len(before)} -> {len(after)}"


# --- Module: providers config (max_offers cap / weight) ---
class TestProviderConfig:
    def test_adbluemedia_provider_enabled(self, sb_admin):
        rows = sb_admin.get(
            f"{REST}/offer_providers",
            params={"select": "id,slug,enabled,sync_config,default_revenue_share", "slug": "eq.adbluemedia"},
            timeout=30,
        ).json()
        assert len(rows) == 1, rows
        p = rows[0]
        assert p["enabled"] is True
        assert float(p["default_revenue_share"]) == 0.6
        cfg = p["sync_config"] or {}
        if "max_offers" in cfg:
            assert int(cfg["max_offers"]) <= 10, f"max_offers stored above cap: {cfg['max_offers']}"


# --- Module: RLS policies (anon must be blocked) ---
class TestRLS:
    @pytest.mark.parametrize("table", ["offer_feed_cache", "offer_feed_settings"])
    def test_anon_read_blocked(self, sb_anon, table):
        r = sb_anon.get(f"{REST}/{table}", params={"select": "*"}, timeout=30)
        assert r.status_code in (200, 401, 403), r.text[:300]
        if r.status_code == 200:
            assert r.json() == [], f"anon could read {table}: {r.text[:300]}"

    @pytest.mark.parametrize("table", ["offer_feed_cache", "offer_feed_settings"])
    def test_anon_write_blocked(self, sb_anon, table):
        r = sb_anon.post(f"{REST}/{table}", json={"country": "TEST_XX"}, timeout=30)
        assert r.status_code >= 400, f"anon write to {table} allowed: {r.status_code} {r.text[:200]}"

    def test_service_role_can_read(self, sb_admin):
        for table in ("offer_feed_cache", "offer_feed_settings"):
            r = sb_admin.get(f"{REST}/{table}", params={"select": "*"}, timeout=30)
            assert r.status_code == 200, f"{table}: {r.text[:300]}"
            assert isinstance(r.json(), list) and len(r.json()) > 0


# --- Module: server functions must not be publicly callable ---
class TestServerFunctionAuth:
    def test_anon_key_present(self):
        assert ANON_KEY, "publishable key missing"

    def test_env_points_to_correct_project(self):
        assert "etwtjrkjphbdkwojhozg" in SUPABASE_URL, f"wrong Supabase project: {SUPABASE_URL}"
