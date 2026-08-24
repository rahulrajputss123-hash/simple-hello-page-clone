import { assembleFeaturedImpl, getFeaturedFeedImpl, refreshAllFeedsImpl } from "@/lib/offers/feed-cache.server";
import { normalizeCountry } from "@/lib/offers/geo.server";
import { getFeedSettingsImpl } from "@/lib/offers/feed-settings.server";

function line(label: string, v: unknown) {
  console.log(`\n### ${label}`);
  console.log(JSON.stringify(v, null, 2));
}

async function main() {
  line("normalizeCountry cases", {
    us: normalizeCountry("us"),
    gb: normalizeCountry("GB"),
    xx: normalizeCountry("XX"),
    junk: normalizeCountry("USA"),
    empty: normalizeCountry(""),
  });

  const settings = await getFeedSettingsImpl();
  line("settings", settings);

  const us = await assembleFeaturedImpl("US", "home");
  line("assemble US home (slots)", { count: us.length, offers: us.map((o) => ({ t: o.title, r: o.reward_amount, src: o.source })) });

  const usAll = await assembleFeaturedImpl("US", "all");
  line("assemble US all", { count: usAll.length });

  // Ranking check: network offers should be sorted by weight*reward desc.
  const rewards = usAll.filter((o) => o.source === "network").map((o) => o.reward_amount);
  const sorted = [...rewards].sort((a, b) => b - a);
  line("network ranking desc?", { rewards, isDescending: JSON.stringify(rewards) === JSON.stringify(sorted) });

  // On-demand fetch for a fresh country (DE) — should populate cache synchronously.
  const de = await getFeaturedFeedImpl("DE", "home");
  line("on-demand DE feed", { country: de.country, count: de.offers.length });

  // Unknown/null country -> default country fallback.
  const nullCountry = await getFeaturedFeedImpl(null, "home");
  line("null country -> default", { country: nullCountry.country, count: nullCountry.offers.length });

  const summary = await refreshAllFeedsImpl(true);
  line("refreshAllFeeds force (should include US + DE now)", summary);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
