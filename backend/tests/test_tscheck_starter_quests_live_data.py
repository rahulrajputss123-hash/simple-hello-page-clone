"""Verifies the live Supabase `quests` table backing the Starter Quests carousel.

Criteria covered:
- "Ads quest cards adapt to live admin data" (starter_5 / starter_25)
- "Shortlink quest card adapts to live admin data" (starter_50)

Read-only: this test never mutates the `quests` or `quest_sessions` tables — it
only asserts on the three pre-existing active rows described in the briefing's
seed_facts (starter_5, starter_25, starter_50), matching the discipline note
that this live seed must be code-reviewed / API-reviewed rather than mutated.
"""

import os

import pytest
from dotenv import dotenv_values

ENV = dotenv_values("/app/.env")
SUPABASE_URL = (os.environ.get("SUPABASE_URL") or ENV.get("SUPABASE_URL") or "").rstrip("/")


@pytest.fixture(scope="module")
def active_quests(sb_admin):
    r = sb_admin.get(
        f"{SUPABASE_URL}/rest/v1/quests",
        params={
            "select": "key,label,icon,quest_type,ads_required,reward_amount,"
            "shortlink_steps,is_active,sort_order",
            "is_active": "eq.true",
            "order": "sort_order.asc",
        },
        timeout=30,
    )
    assert r.status_code == 200, f"GET /rest/v1/quests -> {r.status_code}: {r.text[:300]}"
    return r.json()


def test_exactly_three_active_quests_in_expected_order(active_quests):
    keys = [q["key"] for q in active_quests]
    assert keys == ["starter_5", "starter_25", "starter_50"], (
        f"GET /rest/v1/quests?is_active=eq.true -> 200, keys={keys}"
    )


def test_starter_5_ads_quest_fields(active_quests):
    q = next(q for q in active_quests if q["key"] == "starter_5")
    assert q["label"] == "5 Ads"
    assert q["quest_type"] == "ads"
    assert q["ads_required"] == 5
    assert float(q["reward_amount"]) == 1.00
    assert q["icon"] == "play"
    # Evidence: GET /rest/v1/quests?is_active=eq.true row starter_5 ->
    # {label:"5 Ads", quest_type:"ads", ads_required:5, reward_amount:1.0, icon:"play"}


def test_starter_25_ads_quest_fields(active_quests):
    q = next(q for q in active_quests if q["key"] == "starter_25")
    assert q["label"] == "25 Ads"
    assert q["quest_type"] == "ads"
    assert q["ads_required"] == 25
    assert float(q["reward_amount"]) == 1.00
    assert q["icon"] == "play"
    # Evidence: GET /rest/v1/quests?is_active=eq.true row starter_25 ->
    # {label:"25 Ads", quest_type:"ads", ads_required:25, reward_amount:1.0, icon:"play"}


def test_starter_50_shortlink_quest_fields(active_quests):
    q = next(q for q in active_quests if q["key"] == "starter_50")
    assert q["label"] == "3 Shortlink"
    assert q["quest_type"] == "shortlink"
    assert float(q["reward_amount"]) == 1.00
    assert q["icon"] == "play"
    assert isinstance(q["shortlink_steps"], list)
    assert len(q["shortlink_steps"]) == 3
    for step in q["shortlink_steps"]:
        assert step.get("network")
        assert step.get("url", "").startswith("http")
    # Evidence: GET /rest/v1/quests?is_active=eq.true row starter_50 ->
    # {label:"3 Shortlink", quest_type:"shortlink", reward_amount:1.0,
    #  shortlink_steps: 3 configured {network,url} entries}
