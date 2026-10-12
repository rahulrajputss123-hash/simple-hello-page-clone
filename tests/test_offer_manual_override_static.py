"""
Static-code regression tests for the `category_manual` / `tags_manual` sync
protection fix (replacement of the buggy `preserve_offer_admin_overrides`
DB trigger with in-sync-engine stripping).

This repo is a TanStack Start + Supabase + Bun app with no installed
node_modules and no live DB in this sandbox, so verification is static.
"""

import re
from pathlib import Path

import pytest

APP = Path("/app")
SYNC = APP / "src/lib/offers/sync.server.ts"
MIG_OLD = APP / "supabase/migrations/20261125000000_offer_tags_category_clicks.sql"
MIG_NEW = APP / "supabase/migrations/20261126000000_drop_preserve_offer_admin_overrides_trigger.sql"
ADMIN = APP / "src/lib/offers/admin.server.ts"


def read(p: Path) -> str:
    assert p.exists(), f"missing file: {p}"
    return p.read_text(encoding="utf-8")


# --- sync engine: manual-flag stripping before upsert -----------------------
class TestSyncEngineProtection:
    def test_fetches_manual_flags_for_provider(self):
        src = read(SYNC)
        assert re.search(
            r'\.from\("offers"\)\s*\n\s*\.select\("external_offer_id, category_manual, tags_manual"\)\s*\n\s*\.eq\("provider_id", provider\.id\)',
            src,
        ), "syncProviderImpl must select manual flags for the provider's offers"

    def test_flag_fetch_happens_after_adapter_fetch_and_before_rows(self):
        src = read(SYNC)
        i_fetch = src.index("adapter.fetchOffers")
        i_flags = src.index("category_manual, tags_manual")
        i_rows = src.index("const rows = offers.map")
        i_upsert = src.index(".upsert(rows")
        assert i_fetch < i_flags < i_rows < i_upsert

    def test_builds_map_keyed_by_external_offer_id(self):
        src = read(SYNC)
        assert "const manualFlags = new Map<" in src
        assert "manualFlags.set(row.external_offer_id" in src
        assert "manualFlags.get(o.externalOfferId)" in src

    def test_deletes_locked_columns_from_row(self):
        src = read(SYNC)
        assert re.search(r'if \(flags\?\.categoryManual\) delete row\["category"\]', src)
        assert re.search(r'if \(flags\?\.tagsManual\) delete row\["tags"\]', src)

    def test_upsert_uses_mutated_rows(self):
        src = read(SYNC)
        assert re.search(
            r'\.upsert\(rows as never, \{ onConflict: "provider_id,external_offer_id" \}\)', src
        )

    def test_category_still_sent_for_unlocked_offers(self):
        src = read(SYNC)
        assert "category: offer.category ?? null," in src, "toRow must still pass category through"

    def test_error_from_flag_query_is_propagated(self):
        src = read(SYNC)
        assert re.search(r"if \(pageError\) throw pageError;", src), (
            "an error from any manual-flag page must abort the sync"
        )

    # --- iteration 3: pagination of the manual-flag lookup -------------------
    def test_manual_flag_lookup_is_paginated(self):
        src = read(SYNC)
        assert "const PAGE_SIZE = 1000;" in src
        assert re.search(r"for \(let from = 0; ; from \+= PAGE_SIZE\)", src)
        assert re.search(r"\.range\(from, from \+ PAGE_SIZE - 1\)", src)
        assert re.search(r"if \(rows\.length < PAGE_SIZE\) break;", src)

    def test_pagination_populates_single_map_declared_outside_loop(self):
        src = read(SYNC)
        i_map = src.index("const manualFlags = new Map<")
        i_loop = src.index("for (let from = 0; ; from += PAGE_SIZE)")
        assert i_map < i_loop, "manualFlags must be declared before the paging loop"


# --- iteration 3: network-offer admin write path (category/tags) -------------
class TestUpdateOfferControls:
    def test_impl_accepts_category_and_tags(self):
        src = read(ADMIN)
        block = src[src.index("export async function updateOfferControlsImpl") :]
        assert "category?:" in block
        assert 'tags?: ("Hot" | "Trending" | "Easy" | "Popular")[] | undefined;' in block

    def test_impl_flips_manual_flags_only_when_provided(self):
        src = read(ADMIN)
        block = src[src.index("export async function updateOfferControlsImpl") :]
        assert re.search(
            r"if \(input\.category !== undefined\) \{\s*patch\.category = input\.category;\s*patch\.category_manual = true;",
            block,
        )
        assert re.search(
            r"if \(input\.tags !== undefined\) \{\s*patch\.tags = input\.tags;\s*patch\.tags_manual = true;",
            block,
        )

    def test_server_fn_zod_schema_accepts_category_and_tags(self):
        src = read(APP / "src/lib/offers.functions.ts")
        block = src[src.index("export const updateOfferControls") :][:1600]
        assert re.search(
            r'category: z\s*\n?\s*\.enum\(\["App Install", "Trial", "Deals", "Survey", "Games", "Link Locker", "Shortlink"\]\)\s*\n?\s*\.nullable\(\)\s*\n?\s*\.optional\(\)',
            block,
        )
        assert (
            'tags: z.array(z.enum(["Hot", "Trending", "Easy", "Popular"])).max(4).optional(),'
            in block
        )
        for field in [
            "isActive: z.boolean().optional()",
            "isFeatured: z.boolean().optional()",
            "adminPriority:",
            "sortOrder:",
            "rewardAmount:",
            "revenueShare:",
            "payoutMode: z.enum([",
            "postbackSecretRef:",
        ]:
            assert field in block, f"existing field regressed: {field}"


# --- iteration 3: stale comments cleaned up ---------------------------------
class TestStaleComments:
    def test_torow_comment_no_longer_mentions_db_trigger(self):
        src = read(SYNC)
        i = src.index("// Sync-provided category")
        comment = src[i : src.index("category: offer.category", i)]
        assert "trigger" not in comment.lower()
        assert "syncProviderImpl" in comment

    def test_migration_header_describes_sync_engine_strip(self):
        sql = read(MIG_OLD)
        header = sql[: sql.index("ALTER TABLE public.offers")]
        assert "trigger below freezes the field" not in header
        assert "sync engine" in header.lower()
        assert "syncProviderImpl" in header

    def test_trigger_mentions_only_in_migration_drops_and_notes(self):
        needles = ("preserve_offer_admin_overrides", "preserve_manual_offer_overrides")
        offenders = []
        for base in (APP / "src", APP / "supabase"):
            for p in base.rglob("*"):
                if not p.is_file() or p.suffix not in {".ts", ".tsx", ".js", ".jsx", ".sql"}:
                    continue
                text = p.read_text(encoding="utf-8", errors="ignore")
                if any(n in text for n in needles) and p.name not in {
                    "20261125000000_offer_tags_category_clicks.sql",
                    "20261126000000_drop_preserve_offer_admin_overrides_trigger.sql",
                }:
                    offenders.append(str(p))
        assert offenders == [], f"unexpected trigger references: {offenders}"


# --- migrations: buggy trigger removed / dropped ----------------------------
class TestMigrations:
    def test_original_migration_no_longer_creates_trigger(self):
        sql = read(MIG_OLD)
        assert not re.search(r"(?i)create\s+(or\s+replace\s+)?function\s+.*preserve_manual_offer_overrides", sql)
        assert not re.search(r"(?i)create\s+trigger\s+preserve_offer_admin_overrides", sql)

    def test_original_migration_drops_trigger_and_function(self):
        sql = read(MIG_OLD)
        assert "DROP TRIGGER IF EXISTS preserve_offer_admin_overrides ON public.offers;" in sql
        assert "DROP FUNCTION IF EXISTS public.preserve_manual_offer_overrides();" in sql

    def test_cleanup_migration_is_idempotent_drop_only(self):
        sql = read(MIG_NEW)
        assert "DROP TRIGGER IF EXISTS preserve_offer_admin_overrides ON public.offers;" in sql
        assert "DROP FUNCTION IF EXISTS public.preserve_manual_offer_overrides();" in sql
        assert not re.search(r"(?i)create\s+(or\s+replace\s+)?(function|trigger)", sql)


# --- no code references the dropped trigger/function ------------------------
class TestNoTriggerReferences:
    @pytest.mark.parametrize("needle", ["preserve_offer_admin_overrides", "preserve_manual_offer_overrides"])
    def test_not_referenced_in_src(self, needle):
        hits = [
            str(p)
            for p in (APP / "src").rglob("*")
            if p.is_file()
            and p.suffix in {".ts", ".tsx", ".js", ".jsx", ".sql"}
            and needle in p.read_text(encoding="utf-8", errors="ignore")
        ]
        assert hits == [], f"{needle} still referenced in: {hits}"


# --- admin save path must remain able to write category/tags ---------------
class TestAdminSavePathUnaffected:
    def test_writes_category_tags_and_flips_manual_flags(self):
        src = read(ADMIN)
        block = src[src.index("export async function upsertManualOfferImpl") :]
        assert "category: input.category ?? null," in block
        assert "category_manual: input.category !== undefined," in block
        assert "tags: input.tags ?? []," in block
        assert "tags_manual: input.tags !== undefined," in block

    def test_admin_path_has_no_manual_flag_guard_blocking_edits(self):
        src = read(ADMIN)
        block = src[src.index("export async function upsertManualOfferImpl") :]
        assert "category_manual" in block and "if (existing" not in block.split("const row")[0]
