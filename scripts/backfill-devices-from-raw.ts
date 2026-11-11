/**
 * Backfill devices from raw_payload for Affike and Revtoo offers.
 * 
 * Affike: raw.devices contains device array
 * Revtoo: raw.os contains OS array
 * 
 * Uses shared normalizeDevices to ensure consistent normalization.
 */

import { createClient } from "@supabase/supabase-js";
import { normalizeDevices } from "../src/lib/offers/normalize-devices";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface OfferRow {
  id: string;
  title: string;
  provider_id: string;
  devices: string[];
  raw_payload: any;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  
  console.log(`\n=== Backfill Devices from raw_payload ${dryRun ? "(DRY RUN)" : ""} ===\n`);

  // Get Affike and Revtoo provider IDs
  const { data: providers, error: provError } = await supabase
    .from("offer_providers")
    .select("id, slug")
    .in("slug", ["affike", "revtoo"]);

  if (provError) {
    console.error("Failed to fetch providers:", provError);
    process.exit(1);
  }

  const affikeId = providers?.find(p => p.slug === "affike")?.id;
  const revtooId = providers?.find(p => p.slug === "revtoo")?.id;

  if (!affikeId && !revtooId) {
    console.log("No Affike or Revtoo providers found");
    return;
  }

  console.log(`Affike ID: ${affikeId || "not found"}`);
  console.log(`Revtoo ID: ${revtooId || "not found"}\n`);

  const providerIds = [affikeId, revtooId].filter(Boolean) as string[];

  // Fetch offers with empty devices but non-null raw_payload
  const { data: offers, error: offersError } = await supabase
    .from("offers")
    .select("id, title, provider_id, devices, raw_payload")
    .in("provider_id", providerIds)
    .eq("is_active", true)
    .not("raw_payload", "is", null);

  if (offersError) {
    console.error("Failed to fetch offers:", offersError);
    process.exit(1);
  }

  if (!offers || offers.length === 0) {
    console.log("No offers found to backfill");
    return;
  }

  console.log(`Found ${offers.length} offers with raw_payload\n`);

  let affikeUpdated = 0;
  let revtooUpdated = 0;
  let affikeSkipped = 0;
  let revtooSkipped = 0;
  const updates: Array<{ id: string; devices: string[] }> = [];

  for (const offer of offers as OfferRow[]) {
    const isAffike = offer.provider_id === affikeId;
    const isRevtoo = offer.provider_id === revtooId;

    // Skip if devices already populated
    if (offer.devices && offer.devices.length > 0) {
      if (isAffike) affikeSkipped++;
      if (isRevtoo) revtooSkipped++;
      continue;
    }

    let rawDevices: string[] = [];

    if (isAffike && offer.raw_payload?.devices) {
      rawDevices = Array.isArray(offer.raw_payload.devices)
        ? offer.raw_payload.devices
        : [];
    } else if (isRevtoo && offer.raw_payload?.os) {
      rawDevices = Array.isArray(offer.raw_payload.os)
        ? offer.raw_payload.os
        : [];
    }

    if (rawDevices.length === 0) {
      if (isAffike) affikeSkipped++;
      if (isRevtoo) revtooSkipped++;
      continue;
    }

    // Normalize using shared function
    const normalized = normalizeDevices(rawDevices);

    updates.push({ id: offer.id, devices: normalized });

    if (isAffike) affikeUpdated++;
    if (isRevtoo) revtooUpdated++;

    if (updates.length <= 10 || !dryRun) {
      console.log(`${offer.id} (${isAffike ? "Affike" : "Revtoo"}): ${JSON.stringify(rawDevices)} → ${JSON.stringify(normalized)}`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Affike: ${affikeUpdated} to update, ${affikeSkipped} skipped (already populated or no raw data)`);
  console.log(`Revtoo: ${revtooUpdated} to update, ${revtooSkipped} skipped (already populated or no raw data)`);
  console.log(`Total: ${updates.length} offers to update\n`);

  if (dryRun) {
    console.log("DRY RUN - no changes made. Run without --dry-run to apply.");
    return;
  }

  if (updates.length === 0) {
    console.log("No updates needed");
    return;
  }

  // Apply updates in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    
    for (const update of batch) {
      const { error } = await supabase
        .from("offers")
        .update({ devices: update.devices })
        .eq("id", update.id);

      if (error) {
        console.error(`Failed to update ${update.id}:`, error);
      }
    }

    console.log(`Updated batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(updates.length / BATCH_SIZE)}`);
  }

  console.log(`\n✅ Backfill complete: ${updates.length} offers updated`);
}

main().catch(console.error);
