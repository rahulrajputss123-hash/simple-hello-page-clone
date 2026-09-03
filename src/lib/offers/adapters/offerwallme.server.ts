import { createHash } from "crypto";
import type { SdkOfferwallAdapter } from "../types";

function secret(provider: { postback_signature_secret_ref: string | null }): string {
  const ref = provider.postback_signature_secret_ref;
  return (ref && process.env[ref]) || "";
}

export const offerwallMeAdapter: SdkOfferwallAdapter = {
  slug: "offerwallme",
  integrationType: "web_sdk",

  parsePostback: (provider, payload) => {
    const key = secret(provider);
    const subId = String(payload["subId"] ?? "");
    const transId = String(payload["transId"] ?? "");
    const reward = String(payload["reward"] ?? "");
    const providedSig = String(payload["signature"] ?? "");
    const expectedSig = createHash("md5").update(`${subId}${transId}${reward}${key}`).digest("hex");
    const validSignature = key.length > 0 && providedSig.toLowerCase() === expectedSig;

    const status = String(payload["status"] ?? "");
    const amount = validSignature && status === "1" ? Number(reward) : 0; // status 2 = chargeback -> rejected, not debited

    return {
      providerTransactionId: validSignature ? transId : "",
      providerUserRef: subId,
      providerOfferId: payload["offer_name"] ? String(payload["offer_name"]) : undefined,
      currencyAmount: amount,
      raw: payload,
    };
  },
};
