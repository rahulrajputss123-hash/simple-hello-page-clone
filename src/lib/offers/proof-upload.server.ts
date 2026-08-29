import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Signs a short-lived upload URL scoped to the user's own path under
 * offer-proofs/{userId}/{offerId}/{timestamp}-{filename}. The client PUTs the
 * file directly to that URL, then submits the returned `path` back with the
 * claim in the same insert (offer_claims has no UPDATE grant).
 */
export async function requestProofUploadUrlImpl(
  userId: string,
  offerId: string,
  filename: string,
): Promise<{ path: string; uploadUrl: string; token: string }> {
  const safeName = filename.replace(/[^A-Za-z0-9._-]/g, "_");
  const path = `${userId}/${offerId}/${Date.now()}-${safeName}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = (supabaseAdmin as any).storage;
  const { data, error } = await storage
    .from("offer-proofs")
    .createSignedUploadUrl(path);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create upload URL.");
  }
  return {
    path,
    uploadUrl: data.signedUrl ?? data.signed_url ?? "",
    token: data.token ?? "",
  };
}
