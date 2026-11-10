/**
 * One-time backfill script to populate devices and category fields for existing offers
 * from their raw_payload data using the same adapter logic.
 * 
 * Run with: 
 * - Dry run (default): bun run scripts/backfill-offer-devices-category.ts
 * - Apply changes: bun run scripts/backfill-offer-devices-category.ts --apply
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeDevices } from "@/lib/offers/normalize-devices";

const DRY_RUN = !process.argv.includes('--apply');

if (DRY_RUN) {
  console.log("🔍 DRY RUN MODE - No changes will be written to database");
  console.log("To apply changes, run with --apply flag\n");
} else {
  console.log("✍️  APPLY MODE - Changes will be written to database\n");
}

const OFFER_CATEGORIES = [
  "App Install",
  "Trial",
  "Deals",
  "Survey",
  "Games",
  "Link Locker",
  "Shortlink",
] as const;

type OfferCategory = (typeof OFFER_CATEGORIES)[number];

/**
 * Extract devices from raw_payload based on provider slug.
 * Uses shared normalizeDevices function for consistency.
 */
function extractDevicesFromRaw(providerSlug: string, raw: any): string[] {
  if (!raw || typeof raw !== "object") return [];

  try {
    switch (providerSlug) {
      case "gemiad":
        // device: ["android", "ios", "desktop"]
        if (Array.isArray(raw.device)) {
          return normalizeDevices(raw.device.map((d: any) => String(d)));
        }
        break;

      case "torox":
        // os: "android" | "ios" | "web"
        if (raw.os) {
          return normalizeDevices([String(raw.os)]);
        }
        break;

      case "revtoo":
        // os: ["Android", "iOS"] or ["*"] or ["All"] or null
        // Handle ["*"], ["All"] as empty
        if (Array.isArray(raw.os)) {
          const devices = raw.os.map((o: any) => String(o));
          // If os array contains "*" or "All", treat as empty
          if (devices.some((d) => d === "*" || d.toLowerCase() === "all")) {
            return [];
          }
          return normalizeDevices(devices);
        }
        // If os is null or not an array, return empty
        return [];

      case "adswedmedia":
        // devices: ["Android", "iOS", "Web"]
        if (Array.isArray(raw.devices)) {
          return normalizeDevices(raw.devices.map((d: any) => String(d)));
        } else if (typeof raw.devices === "string") {
          return normalizeDevices([raw.devices]);
        }
        break;

      case "affike":
        // devices: ["Android", "iOS", "Web"] or ["*"] or ["All"] or null
        // Handle ["*"], ["All"] as empty (offer available on all platforms)
        if (Array.isArray(raw.devices)) {
          const devices = raw.devices.map((d: any) => String(d));
          // If devices array contains "*" or "All", treat as empty
          if (devices.some((d) => d === "*" || d.toLowerCase() === "all")) {
            return [];
          }
          return normalizeDevices(devices);
        }
        // If devices is null or not an array, return empty
        return [];

      case "ogads":
        // device: "Android,iOS,Desktop"
        if (raw.device) {
          const devices = String(raw.device).split(",").map((d) => d.trim());
          return normalizeDevices(devices);
        }
        break;

      case "cpxresearch":
        // Surveys work on all devices
        return normalizeDevices(["android", "ios", "web"]);

      case "adbluemedia":
        // No device info in raw payload - return empty array
        return [];
    }
  } catch (err) {
    console.error(`Error extracting devices for ${providerSlug}:`, err);
  }

  return [];
}

/**
 * Extract category from raw_payload based on provider slug
 */
function extractCategoryFromRaw(providerSlug: string, raw: any): OfferCategory | null {
  if (!raw || typeof raw !== "object") return null;

  try {
    switch (providerSlug) {
      case "gemiad":
        // category: "app" | "web" | "survey" | "game" | "click"
        if (raw.category) {
          const cat = String(raw.category).toLowerCase();
          switch (cat) {
            case "app":
              return "App Install";
            case "web":
              return "Trial";
            case "survey":
              return "Survey";
            case "game":
              return "Games";
            case "click":
              return null;
          }
        }
        break;

      case "torox":
        // verticalNames: "Gaming, Strategy" or "Survey" or with packageId -> App Install
        if (raw.verticalNames) {
          const lower = String(raw.verticalNames).toLowerCase();
          
          // Survey categories
          if (lower.includes("survey")) {
            return "Survey";
          }
          
          // Gaming categories
          if (lower.includes("gaming") || lower.includes("strategy") || lower.includes("game")) {
            return "Games";
          }
        }
        
        // App Install: mobile OS + packageId
        if (raw.packageId && raw.os) {
          const osLower = String(raw.os).toLowerCase();
          if (osLower === "ios" || osLower === "android") {
            return "App Install";
          }
        }
        break;

      case "revtoo":
        // category: "survey"
        if (raw.category) {
          const cat = String(raw.category).toLowerCase();
          if (cat === "survey") return "Survey";
        }
        break;

      case "adswedmedia":
        // categories: ["Survey"]
        if (Array.isArray(raw.categories) && raw.categories.length > 0) {
          const cat = String(raw.categories[0]);
          if (OFFER_CATEGORIES.includes(cat as any)) {
            return cat as OfferCategory;
          }
        }
        break;

      case "affike":
        // category: "Survey" (already valid)
        if (raw.category && OFFER_CATEGORIES.includes(raw.category as any)) {
          return raw.category as OfferCategory;
        }
        break;

      case "cpxresearch":
        // Always surveys
        return "Survey";

      case "adbluemedia":
        // Uses category_id mapping (already handled in adapter)
        if (raw.category_id) {
          const ADBLUEMEDIA_CATEGORY_MAP: Record<string, OfferCategory | undefined> = {
            "1": "App Install",
            "2": "Survey",
            "3": "Trial",
            "4": "Trial",
            "5": "Deals",
            "6": "Games",
            "7": "Link Locker",
            "8": "Shortlink",
            "9": "Deals",
          };
          const id = String(raw.category_id).trim();
          return ADBLUEMEDIA_CATEGORY_MAP[id] ?? null;
        }
        break;
    }
  } catch (err) {
    console.error(`Error extracting category for ${providerSlug}:`, err);
  }

  return null;
}

async function backfillOffers() {
  console.log("Starting backfill of devices and category from raw_payload...\n");

  // Fetch all network offers that have raw_payload but missing devices or category
  // AND don't have manual overrides set
  const PAGE_SIZE = 500;
  let offset = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let errorCount = 0;

  while (true) {
    const { data: offers, error } = await supabaseAdmin
      .from("offers")
      .select("id, external_offer_id, provider_id, raw_payload, devices, category, category_manual, offer_providers:provider_id(slug)")
      .eq("source", "network")
      .not("raw_payload", "is", null)
      .eq("category_manual", false) // Only backfill non-manually-set categories
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching offers:", error);
      break;
    }

    if (!offers || offers.length === 0) {
      break;
    }

    console.log(`Processing batch: ${offset} - ${offset + offers.length}...`);

    for (const offer of offers) {
      totalProcessed++;

      try {
        const providerSlug = (offer as any).offer_providers?.slug;
        if (!providerSlug) {
          console.warn(`  Offer ${offer.id}: No provider slug, skipping`);
          continue;
        }

        const raw = offer.raw_payload;
        let needsUpdate = false;
        const update: any = {};

        // Extract devices if missing or empty
        if (!offer.devices || offer.devices.length === 0) {
          const devices = extractDevicesFromRaw(providerSlug, raw);
          if (devices.length > 0) {
            update.devices = devices;
            needsUpdate = true;
          }
        }

        // Extract category if missing and not manually set
        if (!offer.category && !offer.category_manual) {
          const category = extractCategoryFromRaw(providerSlug, raw);
          if (category) {
            update.category = category;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          if (DRY_RUN) {
            totalUpdated++;
            const parts: string[] = [];
            if (update.devices) parts.push(`devices: ${JSON.stringify(update.devices)}`);
            if (update.category) parts.push(`category: ${update.category}`);
            console.log(`  [DRY RUN] Would update offer ${offer.id} (${providerSlug}): ${parts.join(", ")}`);
          } else {
            const { error: updateError } = await supabaseAdmin
              .from("offers")
              .update(update)
              .eq("id", offer.id);

            if (updateError) {
              console.error(`  Error updating offer ${offer.id}:`, updateError);
              errorCount++;
            } else {
              totalUpdated++;
              const parts: string[] = [];
              if (update.devices) parts.push(`devices: ${JSON.stringify(update.devices)}`);
              if (update.category) parts.push(`category: ${update.category}`);
              console.log(`  ✓ Updated offer ${offer.id} (${providerSlug}): ${parts.join(", ")}`);
            }
          }
        }
      } catch (err) {
        console.error(`  Error processing offer ${offer.id}:`, err);
        errorCount++;
      }
    }

    if (offers.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  console.log("\n=== Backfill Complete ===");
  console.log(`Total offers processed: ${totalProcessed}`);
  console.log(`Total offers updated: ${totalUpdated}`);
  console.log(`Errors: ${errorCount}`);
}

// Run the backfill
backfillOffers().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
