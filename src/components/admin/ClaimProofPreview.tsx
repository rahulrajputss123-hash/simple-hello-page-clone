import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileImage } from "lucide-react";

import { adminSignProofUrl } from "@/lib/offers.functions";

/**
 * Renders a short-lived signed URL preview for a stored proof file.
 * The URL is fetched fresh each mount (300s expiry) and never cached to the DOM.
 */
export function ClaimProofPreview({ path }: { path: string }) {
  const sign = useServerFn(adminSignProofUrl);
  const q = useQuery({
    queryKey: ["proof-signed-url", path],
    queryFn: () => sign({ data: { path } }),
    staleTime: 240_000,
  });
  if (q.isLoading) {
    return (
      <p className="mt-2 text-xs text-muted-foreground" data-testid="claim-proof-loading">
        Loading proof…
      </p>
    );
  }
  const url = q.data?.url;
  if (!url) {
    return (
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <FileImage className="size-3.5" />
        Proof unavailable
      </p>
    );
  }
  const isPdf = /\.pdf($|\?)/i.test(path);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block overflow-hidden rounded-xl border border-border bg-background-alt"
      data-testid="claim-proof-preview"
    >
      {isPdf ? (
        <div className="flex items-center gap-2 p-3 text-sm">
          <FileImage className="size-4 text-primary" />
          Open proof PDF
        </div>
      ) : (
        <img
          src={url}
          alt="Proof of completion"
          className="max-h-64 w-full object-contain"
          loading="lazy"
        />
      )}
    </a>
  );
}
