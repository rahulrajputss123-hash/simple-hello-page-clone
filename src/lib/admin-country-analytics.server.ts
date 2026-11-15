/**
 * Admin country-wise analytics
 * Provides insights per country: offers, clicks, claims, users, rewards
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CountryAnalytics = {
  country: string; // ISO-3166 alpha-2 or "Unknown"
  distinctOffersAvailable: number;
  clicks: number;
  distinctOffersClicked: number;
  claimsByStatus: {
    started: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  distinctUsers: number;
  rewardTotalApproved: number;
};

export type FeedHealthStatus = {
  providerId: string;
  providerSlug: string;
  providerName: string;
  totalRows: number;
  freshRows: number;
  expiredRows: number;
  rowsWithError: number;
  rowsWithZeroOffers: number;
};

/**
 * Get country-wise analytics for a date range
 */
export async function getCountryAnalyticsImpl(
  startDate: string,
  endDate: string
): Promise<CountryAnalytics[]> {
  // Get all countries that have any activity or availability
  const countries = new Set<string>();

  // 1. Countries from offer_country_availability
  const { data: availabilityCountries } = await supabaseAdmin
    .from("offer_country_availability")
    .select("country")
    .gte("last_seen_at", startDate)
    .lte("last_seen_at", endDate);
  
  for (const row of availabilityCountries ?? []) {
    if (row.country) countries.add(row.country);
  }

  // 2. Countries from offer_click_events
  const { data: clickCountries } = await supabaseAdmin
    .from("offer_click_events")
    .select("country")
    .gte("created_at", startDate)
    .lte("created_at", endDate);
  
  for (const row of clickCountries ?? []) {
    if (row.country) countries.add(row.country);
  }

  // 3. Countries from offer_claims
  const { data: claimCountries } = await supabaseAdmin
    .from("offer_claims")
    .select("country")
    .gte("created_at", startDate)
    .lte("created_at", endDate);
  
  for (const row of claimCountries ?? []) {
    if (row.country) countries.add(row.country);
  }

  // Also include "Unknown" for null countries
  countries.add("Unknown");

  const results: CountryAnalytics[] = [];

  for (const country of Array.from(countries).sort()) {
    const isUnknown = country === "Unknown";
    const countryFilter = isUnknown ? null : country;

    // Distinct offers available (from offer_country_availability)
    let distinctOffersAvailable = 0;
    if (!isUnknown) {
      const { count } = await supabaseAdmin
        .from("offer_country_availability")
        .select("offer_id", { count: "exact", head: true })
        .eq("country", country)
        .gte("last_seen_at", startDate)
        .lte("last_seen_at", endDate);
      distinctOffersAvailable = count ?? 0;
    }

    // Clicks
    let clicksQuery = supabaseAdmin
      .from("offer_click_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate)
      .lte("created_at", endDate);
    
    if (isUnknown) {
      clicksQuery = clicksQuery.is("country", null);
    } else {
      clicksQuery = clicksQuery.eq("country", country);
    }
    
    const { count: clicks } = await clicksQuery;

    // Distinct offers clicked
    let distinctOffersClickedQuery = supabaseAdmin
      .from("offer_click_events")
      .select("offer_id")
      .gte("created_at", startDate)
      .lte("created_at", endDate);
    
    if (isUnknown) {
      distinctOffersClickedQuery = distinctOffersClickedQuery.is("country", null);
    } else {
      distinctOffersClickedQuery = distinctOffersClickedQuery.eq("country", country);
    }
    
    const { data: clickedOffers } = await distinctOffersClickedQuery;
    const distinctOffersClicked = new Set(
      (clickedOffers ?? []).map((r: any) => r.offer_id)
    ).size;

    // Claims by status
    const claimsByStatus = {
      started: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    for (const status of ["started", "pending", "approved", "rejected"]) {
      let claimsQuery = supabaseAdmin
        .from("offer_claims")
        .select("*", { count: "exact", head: true })
        .eq("status", status)
        .gte("created_at", startDate)
        .lte("created_at", endDate);
      
      if (isUnknown) {
        claimsQuery = claimsQuery.is("country", null);
      } else {
        claimsQuery = claimsQuery.eq("country", country);
      }
      
      const { count } = await claimsQuery;
      claimsByStatus[status as keyof typeof claimsByStatus] = count ?? 0;
    }

    // Distinct users who claimed
    let distinctUsersQuery = supabaseAdmin
      .from("offer_claims")
      .select("user_id")
      .gte("created_at", startDate)
      .lte("created_at", endDate);
    
    if (isUnknown) {
      distinctUsersQuery = distinctUsersQuery.is("country", null);
    } else {
      distinctUsersQuery = distinctUsersQuery.eq("country", country);
    }
    
    const { data: claimUsers } = await distinctUsersQuery;
    const distinctUsers = new Set(
      (claimUsers ?? []).map((r: any) => r.user_id)
    ).size;

    // Reward total for approved claims
    let rewardQuery = supabaseAdmin
      .from("offer_claims")
      .select("reward_amount")
      .eq("status", "approved")
      .gte("created_at", startDate)
      .lte("created_at", endDate);
    
    if (isUnknown) {
      rewardQuery = rewardQuery.is("country", null);
    } else {
      rewardQuery = rewardQuery.eq("country", country);
    }
    
    const { data: approvedClaims } = await rewardQuery;
    const rewardTotalApproved = (approvedClaims ?? []).reduce(
      (sum: number, c: any) => sum + Number(c.reward_amount ?? 0),
      0
    );

    // Only include countries with activity
    if (
      distinctOffersAvailable > 0 ||
      (clicks ?? 0) > 0 ||
      distinctOffersClicked > 0 ||
      Object.values(claimsByStatus).some(v => v > 0) ||
      distinctUsers > 0
    ) {
      results.push({
        country,
        distinctOffersAvailable,
        clicks: clicks ?? 0,
        distinctOffersClicked,
        claimsByStatus,
        distinctUsers,
        rewardTotalApproved,
      });
    }
  }

  return results;
}

/**
 * Get feed health status per provider
 */
export async function getFeedHealthStatusImpl(): Promise<FeedHealthStatus[]> {
  // Get all providers
  const { data: providers } = await supabaseAdmin
    .from("offer_providers")
    .select("id, slug, name")
    .order("name");

  if (!providers) return [];

  const results: FeedHealthStatus[] = [];
  const now = new Date().toISOString();

  for (const provider of providers) {
    // Get all cache rows for this provider
    const { data: cacheRows } = await supabaseAdmin
      .from("offer_feed_cache")
      .select("expires_at, sync_error, offer_count")
      .eq("provider_id", provider.id);

    const totalRows = cacheRows?.length ?? 0;
    let freshRows = 0;
    let expiredRows = 0;
    let rowsWithError = 0;
    let rowsWithZeroOffers = 0;

    for (const row of cacheRows ?? []) {
      const expired = new Date(row.expires_at).getTime() < new Date(now).getTime();
      
      if (expired) {
        expiredRows++;
      } else {
        freshRows++;
      }
      
      if (row.sync_error) {
        rowsWithError++;
      }
      
      if (row.offer_count === 0) {
        rowsWithZeroOffers++;
      }
    }

    results.push({
      providerId: provider.id,
      providerSlug: provider.slug,
      providerName: provider.name,
      totalRows,
      freshRows,
      expiredRows,
      rowsWithError,
      rowsWithZeroOffers,
    });
  }

  return results;
}
