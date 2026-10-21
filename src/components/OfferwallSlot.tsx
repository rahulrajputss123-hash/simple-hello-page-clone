import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Layers } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getOfferwallMeSignedUrl, listSdkOfferwallProviders } from "@/lib/sdk-offerwall.functions";

function buildOfferwallUrl(slug: string, appId: string, userId: string): string | null {
  if (slug === "mooffers") {
    return `https://wall.mooffers.com/offerwall/${appId}?uid=${encodeURIComponent(userId)}`;
  }
  if (slug === "affike") {
    return `https://affike.com/offerwall/${appId}/${encodeURIComponent(userId)}`;
  }
  if (slug === "revtoo") {
    return `https://revtoo.com/offerwall/${appId}/${encodeURIComponent(userId)}`;
  }
  if (slug === "offerwallme") {
    // Return placeholder - actual signed URL is fetched on click via server function
    return "signed-url-required";
  }
  if (slug === "timewall") {
    return `https://timewall.io/users/login?oid=${appId}&uid=${encodeURIComponent(userId)}`;
  }
  if (slug === "cpxresearch") {
    return `https://offers.cpx-research.com/index.php?app_id=${appId}&ext_user_id=${encodeURIComponent(userId)}`;
  }
  if (slug === "adswedmedia") {
    return `https://adswedmedia.com/offer/${appId}/${encodeURIComponent(userId)}`;
  }
  return null;
}

const OfferwallCard = memo(function OfferwallCard({
  provider,
  url,
  slug,
  onImageError,
}: {
  provider: { id: string; name: string; tagline: string; logoUrl: string | null };
  url: string | null;
  slug: string;
  onImageError: (id: string) => void;
}) {
  const [broken, setBroken] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchSignedUrl = useServerFn(getOfferwallMeSignedUrl);

  const handleError = useCallback(() => {
    setBroken(true);
    onImageError(provider.id);
  }, [provider.id, onImageError]);

  const handleOfferwallMeClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    // Open blank tab synchronously to avoid popup blockers
    const tab = window.open("", "_blank");
    
    try {
      const signedUrl = await fetchSignedUrl({});
      if (tab) {
        tab.location.href = signedUrl;
      }
    } catch (err) {
      if (tab) tab.close();
      toast.error(err instanceof Error ? err.message : "Failed to open offerwall.me");
    } finally {
      setLoading(false);
    }
  }, [fetchSignedUrl, loading]);

  return (
    <article
      className="surface-card flex flex-col overflow-hidden !p-0 shadow-soft transition-[transform,box-shadow] duration-200 active:scale-[0.98]"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 200px" }}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-background-alt">
        {provider.logoUrl && !broken ? (
          <img
            src={provider.logoUrl}
            alt={`${provider.name} banner`}
            loading="lazy"
            decoding="async"
            onError={handleError}
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center bg-jade-gradient text-primary-foreground">
            <Layers className="size-7" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="font-semibold leading-tight">{provider.name}</p>
          <p className="text-xs text-muted-foreground">{provider.tagline}</p>
        </div>
        {url ? (
          slug === "offerwallme" ? (
            <Button 
              size="sm" 
              variant="jade" 
              className="mt-auto gap-1"
              onClick={handleOfferwallMeClick}
              disabled={loading}
            >
              {loading ? "Opening…" : "Open"} <ExternalLink className="size-3.5" />
            </Button>
          ) : (
            <Button size="sm" variant="jade" className="mt-auto gap-1" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                Open <ExternalLink className="size-3.5" />
              </a>
            </Button>
          )
        ) : (
          <Button size="sm" variant="outline" className="mt-auto gap-1" disabled>
            Mobile app only <ExternalLink className="size-3.5" />
          </Button>
        )}
      </div>
    </article>
  );
});

export function OfferwallSlot({ limit }: { limit?: number }) {
  const { session } = useAuth();
  const fetchProviders = useServerFn(listSdkOfferwallProviders);

  const providers = useQuery({
    queryKey: ["sdk-offerwall-public", limit ?? "all"],
    queryFn: () => fetchProviders({ data: limit ? { limit } : {} }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleImageError = useCallback((_id: string) => {
    // Noop - error state is per-card now
  }, []);

  if (providers.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading offerwalls…</p>;
  }

  if (!providers.data?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No offerwall networks are active yet. Check back soon.
      </p>
    );
  }

  return (
    <div className="stagger-children grid grid-cols-2 gap-3">
      {providers.data.map((provider) => {
        const url =
          provider.integrationType === "web_sdk" && provider.appId && session?.user.id
            ? buildOfferwallUrl(provider.slug, provider.appId, session.user.id)
            : null;

        return (
          <OfferwallCard
            key={provider.id}
            provider={provider}
            url={url}
            slug={provider.slug}
            onImageError={handleImageError}
          />
        );
      })}
    </div>
  );
}
