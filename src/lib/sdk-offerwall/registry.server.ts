import affikeSdkAdapter from "./adapters/affike.server";
import cpxResearchSdkAdapter from "./adapters/cpxresearch.server";
import mooffersSdkAdapter from "./adapters/mooffers.server";
import offerwallMeSdkAdapter from "./adapters/offerwallme.server";
import revtooSdkAdapter from "./adapters/revtoo.server";
import timewallSdkAdapter from "./adapters/timewall.server";
import type { SdkOfferwallAdapter } from "./types";

/**
 * SDK adapters register here (one file per network under ./adapters).
 * A provider row without an adapter renders as a configured-but-not-integrated
 * placeholder and falls back to the generic postback pipeline.
 */
const adapters = new Map<string, SdkOfferwallAdapter>();

export function registerSdkAdapter(adapter: SdkOfferwallAdapter) {
  adapters.set(adapter.slug, adapter);
}

export function getSdkAdapter(slug: string): SdkOfferwallAdapter | undefined {
  return adapters.get(slug);
}

export function listSdkAdapterSlugs(): string[] {
  return [...adapters.keys()];
}

registerSdkAdapter(cpxResearchSdkAdapter);
registerSdkAdapter(offerwallMeSdkAdapter);
registerSdkAdapter(revtooSdkAdapter);
registerSdkAdapter(affikeSdkAdapter);
registerSdkAdapter(mooffersSdkAdapter);
registerSdkAdapter(timewallSdkAdapter);
