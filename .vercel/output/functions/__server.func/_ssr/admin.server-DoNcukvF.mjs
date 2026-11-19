import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.server-DoNcukvF.js
init_client_server();
async function adminDashboardImpl() {
	const [profiles, pendingWithdrawals, approvedClaims, referrals, networkClaims, providers, offerCounts] = await Promise.all([
		supabaseAdmin.from("profiles").select("id, wallet_balance, held_balance, lifetime_earned, lifetime_withdrawn, is_flagged, updated_at, created_at").limit(5e3),
		supabaseAdmin.from("withdrawal_requests").select("amount, status").limit(5e3),
		supabaseAdmin.from("offer_claims").select("status, reward_amount, offer_id").limit(5e3),
		supabaseAdmin.from("referrals").select("status, bonus_amount").limit(5e3),
		supabaseAdmin.from("offer_claims").select("reward_amount, status, offers:offer_id(source, network_payout)").eq("status", "approved").limit(5e3),
		supabaseAdmin.from("offer_providers").select("id, name, enabled, last_synced_at, sync_status"),
		supabaseAdmin.from("offers").select("id, source, is_active").limit(2e4)
	]);
	const users = profiles.data ?? [];
	const cutoff = Date.now() - 2592e6;
	const claims = approvedClaims.data ?? [];
	const withdrawals = pendingWithdrawals.data ?? [];
	const refs = referrals.data ?? [];
	const offers = offerCounts.data ?? [];
	let networkRevenue = 0;
	for (const claim of networkClaims.data ?? []) {
		const offer = claim.offers;
		if (offer?.source === "network" && offer.network_payout != null) networkRevenue += Number(offer.network_payout) - Number(claim.reward_amount);
	}
	return {
		users: {
			total: users.length,
			active: users.filter((u) => new Date(u.updated_at).getTime() >= cutoff).length,
			flagged: users.filter((u) => u.is_flagged).length
		},
		money: {
			lifetimeEarned: users.reduce((s, u) => s + Number(u.lifetime_earned), 0),
			lifetimeWithdrawn: users.reduce((s, u) => s + Number(u.lifetime_withdrawn), 0),
			walletLiability: users.reduce((s, u) => s + Number(u.wallet_balance), 0),
			heldLiability: users.reduce((s, u) => s + Number(u.held_balance), 0),
			pendingWithdrawalCount: withdrawals.filter((w) => w.status === "pending").length,
			pendingWithdrawalAmount: withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0),
			networkRevenue
		},
		offers: {
			total: offers.length,
			manual: offers.filter((o) => o.source === "manual").length,
			network: offers.filter((o) => o.source === "network").length,
			active: offers.filter((o) => o.is_active).length,
			completions: claims.filter((c) => c.status === "approved").length,
			pendingClaims: claims.filter((c) => c.status === "pending").length
		},
		referrals: {
			total: refs.length,
			credited: refs.filter((r) => r.status !== "pending").length,
			paid: refs.reduce((s, r) => s + Number(r.bonus_amount), 0)
		},
		providers: (providers.data ?? []).map((p) => ({
			id: p.id,
			name: p.name,
			enabled: p.enabled,
			syncStatus: p.sync_status,
			lastSyncedAt: p.last_synced_at
		}))
	};
}
async function listAdminOffersImpl(input) {
	let q = supabaseAdmin.from("offers").select("id, title, description, requirements, not_allowed, icon, source, provider_id, external_offer_id, reward_amount, network_payout, revenue_share, click_url, countries, devices, expires_at, last_seen_at, is_active, is_featured, sort_order, admin_priority, created_at, updated_at, is_limited_deal, deal_group_id, actual_cost, payout_percentage, max_payout_cap, display_price, display_percent, payout_mode, postback_secret_ref, postback_ip_allowlist, category, category_manual, tags, tags_manual, offer_providers:provider_id(name, slug)").order("admin_priority", { ascending: false }).order("sort_order", { ascending: true }).order("created_at", { ascending: false }).limit(input.limit);
	if (input.source !== "all") q = q.eq("source", input.source);
	if (input.providerId) q = q.eq("provider_id", input.providerId);
	if (input.search) q = q.ilike("title", `%${input.search}%`);
	if (input.country) q = q.contains("countries", [input.country.toUpperCase()]);
	if (input.category) q = q.eq("category", input.category);
	if (input.device) q = q.contains("devices", [input.device]);
	if (input.status === "active") q = q.eq("is_active", true);
	if (input.status === "inactive") q = q.eq("is_active", false);
	if (input.status === "featured") q = q.eq("is_featured", true);
	if (input.status === "expired") q = q.lt("expires_at", (/* @__PURE__ */ new Date()).toISOString());
	const { data, error } = await q;
	if (error) throw error;
	return data;
}
async function upsertManualOfferImpl(input) {
	const { normalizeDevices } = await import("./normalize-devices-B-CDoU_V.mjs").then((n) => n.n).then((n) => n.n);
	const hasClickUrl = Boolean(input.clickUrl?.trim());
	if (!hasClickUrl && input.payoutMode !== "manual_proof") throw new Error("Offers without a Click URL must use Manual + proof payout mode.");
	if (input.payoutMode === "auto_postback" && !hasClickUrl) throw new Error("Auto-tracked offers must have a Click URL.");
	let effectiveReward = input.rewardAmount;
	if (input.isLimitedDeal) {
		const { computeLimitedDealReward } = await import("./proof.server-DMSAyAXD.mjs");
		effectiveReward = computeLimitedDealReward({
			actual_cost: input.actualCost ?? null,
			payout_percentage: input.payoutPercentage ?? 110,
			max_payout_cap: input.maxPayoutCap ?? null
		});
	}
	const row = {
		title: input.title,
		description: input.description,
		requirements: input.requirements,
		not_allowed: input.notAllowed ?? "",
		icon: input.icon || "gift",
		reward_amount: effectiveReward,
		network_payout: input.networkPayout ?? null,
		click_url: input.clickUrl ?? null,
		countries: input.countries.map((c) => c.toUpperCase()),
		devices: normalizeDevices(input.devices),
		expires_at: input.expiresAt ?? null,
		is_active: input.isActive,
		is_featured: input.isFeatured,
		sort_order: input.sortOrder,
		admin_priority: input.adminPriority,
		source: "manual",
		is_limited_deal: Boolean(input.isLimitedDeal),
		deal_group_id: input.dealGroupId?.trim() || null,
		actual_cost: input.actualCost ?? null,
		payout_percentage: input.payoutPercentage ?? 110,
		max_payout_cap: input.maxPayoutCap ?? null,
		display_price: input.displayPrice?.trim() || null,
		display_percent: input.displayPercent ?? null,
		payout_mode: input.payoutMode ?? "manual",
		postback_secret_ref: input.postbackSecretRef?.trim() || null,
		postback_ip_allowlist: input.postbackIpAllowlist ?? [],
		category: input.category ?? null,
		category_manual: input.category !== void 0,
		tags: input.tags ?? [],
		tags_manual: input.tags !== void 0
	};
	if (input.id) {
		const existing = await supabaseAdmin.from("offers").select("source").eq("id", input.id).single();
		if (existing.error) throw new Error("Offer not found.");
		if (existing.data.source !== "manual") throw new Error("Only manual offers can be edited here.");
		const { data, error } = await supabaseAdmin.from("offers").update(row).eq("id", input.id).select("id").single();
		if (error) throw error;
		const { clearAssembledCache } = await import("./feed-cache.server-CY3cPWq8.mjs");
		clearAssembledCache();
		return data;
	}
	const { data, error } = await supabaseAdmin.from("offers").insert({
		...row,
		provider_id: null,
		external_offer_id: null
	}).select("id").single();
	if (error) throw error;
	const { clearAssembledCache } = await import("./feed-cache.server-CY3cPWq8.mjs");
	clearAssembledCache();
	return data;
}
async function deleteManualOfferImpl(id) {
	const existing = await supabaseAdmin.from("offers").select("source").eq("id", id).single();
	if (existing.error) throw new Error("Offer not found.");
	if (existing.data.source !== "manual") throw new Error("Network offers can't be deleted — deactivate them instead.");
	if ((await supabaseAdmin.from("offer_claims").select("id").eq("offer_id", id).limit(1)).data?.length) {
		const { error } = await supabaseAdmin.from("offers").update({ is_active: false }).eq("id", id);
		if (error) throw error;
		const { clearAssembledCache } = await import("./feed-cache.server-CY3cPWq8.mjs");
		clearAssembledCache();
		return {
			deleted: false,
			deactivated: true
		};
	}
	const { error } = await supabaseAdmin.from("offers").delete().eq("id", id);
	if (error) throw error;
	const { clearAssembledCache } = await import("./feed-cache.server-CY3cPWq8.mjs");
	clearAssembledCache();
	return {
		deleted: true,
		deactivated: false
	};
}
async function updateOfferControlsImpl(input) {
	const patch = {};
	if (input.isActive !== void 0) patch.is_active = input.isActive;
	if (input.isFeatured !== void 0) patch.is_featured = input.isFeatured;
	if (input.adminPriority !== void 0) patch.admin_priority = input.adminPriority;
	if (input.sortOrder !== void 0) patch.sort_order = input.sortOrder;
	if (input.rewardAmount !== void 0) patch.reward_amount = input.rewardAmount;
	if (input.revenueShare !== void 0) patch.revenue_share = input.revenueShare;
	if (input.payoutMode !== void 0) patch.payout_mode = input.payoutMode;
	if (input.postbackSecretRef !== void 0) patch.postback_secret_ref = input.postbackSecretRef?.trim() || null;
	if (input.pushToBottom !== void 0) patch.push_to_bottom = input.pushToBottom;
	if (input.category !== void 0) {
		patch.category = input.category;
		patch.category_manual = true;
	}
	if (input.tags !== void 0) {
		patch.tags = input.tags;
		patch.tags_manual = true;
	}
	if (!Object.keys(patch).length) return { ok: true };
	const { error } = await supabaseAdmin.from("offers").update(patch).eq("id", input.id);
	if (error) throw error;
	const { clearAssembledCache } = await import("./feed-cache.server-CY3cPWq8.mjs");
	clearAssembledCache();
	return { ok: true };
}
//#endregion
export { adminDashboardImpl, deleteManualOfferImpl, listAdminOffersImpl, updateOfferControlsImpl, upsertManualOfferImpl };
