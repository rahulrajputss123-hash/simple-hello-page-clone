import { createFileRoute } from "@tanstack/react-router";

/**
 * Generic SDK offerwall postback endpoint.
 * Providers may call it with GET (query string) or POST (form / JSON body).
 * Caller verification, dedupe and crediting live in the automation pipeline.
 */

function clientIp(request: Request): string | null {
  const header =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for");
  if (!header) return null;
  return header.split(",")[0]?.trim() ?? null;
}

function headerMap(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

async function handle(request: Request, slug: string) {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  let rawBody = "";
    if (request.method !== "GET" && request.method !== "HEAD") {
      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.includes("multipart/form-data")) {
        try {
          const form = await request.formData();
          form.forEach((value, key) => {
            if (typeof value === "string") params[key] = value;
          });
        } catch {
          // Malformed multipart body — fall through to query-param handling.
        }
      } else {
        rawBody = await request.text();
        try {
          if (contentType.includes("application/json") && rawBody) {
            const parsed = JSON.parse(rawBody) as Record<string, unknown>;
            for (const [key, value] of Object.entries(parsed)) {
              if (value !== null && typeof value !== "object") params[key] = String(value);
            }
          } else if (rawBody) {
            new URLSearchParams(rawBody).forEach((value, key) => {
              params[key] = value;
            });
          }
        } catch {
          // Malformed bodies fall through to query-param handling.
        }
      }
    }
  const { processSdkPostback } = await import("@/lib/automation/postback.server");
  const result = await processSdkPostback({
    slug,
    params,
    rawBody,
    headers: headerMap(request),
    sourceIp: clientIp(request),
  });

  const status = result.ok ? 200 : result.status === "rejected" ? 400 : 200;
    if (slug === "adswedmedia") {
      // AdswedMedia reads a literal plain-text body: "OK" = newly credited,
      // "DUP" = already processed (stop retrying), otherwise an error string.
      const body = result.status === "duplicate" ? "DUP" : result.ok ? "OK" : "ERROR";
      return new Response(body, { status, headers: { "Content-Type": "text/plain" } });
    }
    if (slug === "bitcotasks" || slug === "revtoo") {
      const okText = result.ok || result.status === "duplicate" ? "ok" : "error";
      return new Response(okText, { status, headers: { "Content-Type": "text/plain" } });
    }
    return Response.json(result, { status });
 
}

export const Route = createFileRoute("/api/public/offerwall/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handle(request, params.slug),
      POST: async ({ request, params }) => handle(request, params.slug),
    },
  },
});
