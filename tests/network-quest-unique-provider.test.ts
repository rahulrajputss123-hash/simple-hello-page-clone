/**
 * Network Quest - Unique Provider Completion Test
 * 
 * Verifies that completing multiple offers from the SAME network
 * only counts as 1 completion (unique per session + provider_id).
 */

import { describe, it, expect, beforeAll } from "vitest";

describe("Network Quest - Unique Provider Completions", () => {
  let testUserId: string;
  let testSessionId: string;
  let testProviderId: string;
  let testConversionId1: string;
  let testConversionId2: string;
  let supabaseAdmin: any;

  beforeAll(async () => {
    // Skip if no Supabase credentials
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("[TEST] Skipping network quest test - no Supabase credentials");
      return;
    }

    const { supabaseAdmin: client } = await import("@/integrations/supabase/client.server");
    supabaseAdmin = client;

    // Create test user
    const { data: user, error: userError } = await supabaseAdmin
      .from("profiles")
      .insert({
        username: `netquest_test_${Date.now()}`,
        balance: 0,
      })
      .select("id")
      .single();

    if (userError || !user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }
    testUserId = user.id;

    // Get first available provider
    const { data: provider } = await supabaseAdmin
      .from("sdk_offerwall_providers")
      .select("id")
      .eq("enabled", true)
      .limit(1)
      .single();

    if (!provider) {
      throw new Error("No enabled providers found");
    }
    testProviderId = provider.id;

    // Create test session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("quest_sessions")
      .insert({
        user_id: testUserId,
        quest_key: "test-network-quest",
        status: "started",
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      throw new Error(`Failed to create session: ${sessionError?.message}`);
    }
    testSessionId = session.id;

    // Create two test conversions
    const { data: conversion1, error: conv1Error } = await supabaseAdmin
      .from("sdk_offerwall_conversions")
      .insert({
        user_id: testUserId,
        provider_id: testProviderId,
        transaction_id: `test_tx_1_${Date.now()}`,
        reward_coins: 100,
        reward_usd: 1.0,
        ip_address: "127.0.0.1",
        user_agent: "test",
        status: "pending",
      })
      .select("id")
      .single();

    if (conv1Error || !conversion1) {
      throw new Error(`Failed to create conversion 1: ${conv1Error?.message}`);
    }
    testConversionId1 = conversion1.id;

    const { data: conversion2, error: conv2Error } = await supabaseAdmin
      .from("sdk_offerwall_conversions")
      .insert({
        user_id: testUserId,
        provider_id: testProviderId,
        transaction_id: `test_tx_2_${Date.now()}`,
        reward_coins: 200,
        reward_usd: 2.0,
        ip_address: "127.0.0.1",
        user_agent: "test",
        status: "pending",
      })
      .select("id")
      .single();

    if (conv2Error || !conversion2) {
      throw new Error(`Failed to create conversion 2: ${conv2Error?.message}`);
    }
    testConversionId2 = conversion2.id;
  });

  it.skipIf(!process.env.SUPABASE_URL)("should insert first completion from a provider successfully", async () => {
    const { error } = await supabaseAdmin
      .from("quest_network_completions")
      .insert({
        session_id: testSessionId,
        provider_id: testProviderId,
        conversion_id: testConversionId1,
        step_index: 1,
        kind: "network",
        amount_usd: 1.0,
      });

    expect(error).toBeNull();

    // Verify it was inserted
    const { data: completions, error: fetchError } = await supabaseAdmin
      .from("quest_network_completions")
      .select("*")
      .eq("session_id", testSessionId)
      .eq("kind", "network");

    expect(fetchError).toBeNull();
    expect(completions).toHaveLength(1);
    expect(completions?.[0].provider_id).toBe(testProviderId);
  });

  it.skipIf(!process.env.SUPABASE_URL)("should reject second completion from the SAME provider (unique constraint)", async () => {
    // Try to insert another completion from the same provider
    const { error } = await supabaseAdmin
      .from("quest_network_completions")
      .insert({
        session_id: testSessionId,
        provider_id: testProviderId, // Same provider as first completion
        conversion_id: testConversionId2,
        step_index: 2,
        kind: "network",
        amount_usd: 2.0,
      });

    // Should fail with unique constraint violation
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505"); // Postgres unique violation
    expect(error?.message).toContain("quest_network_completions_network_uniq");

    // Verify still only 1 completion
    const { data: completions } = await supabaseAdmin
      .from("quest_network_completions")
      .select("*")
      .eq("session_id", testSessionId)
      .eq("kind", "network");

    expect(completions).toHaveLength(1);
  });

  it.skipIf(!process.env.SUPABASE_URL)("should count unique providers correctly (Set logic)", async () => {
    // Fetch all completions for this session
    const { data: completions } = await supabaseAdmin
      .from("quest_network_completions")
      .select("provider_id")
      .eq("session_id", testSessionId)
      .eq("kind", "network");

    // Create Set to count unique providers
    const uniqueProviders = new Set(completions?.map((c) => c.provider_id) ?? []);

    // Should be exactly 1 unique provider despite multiple conversion attempts
    expect(uniqueProviders.size).toBe(1);
  });
});
