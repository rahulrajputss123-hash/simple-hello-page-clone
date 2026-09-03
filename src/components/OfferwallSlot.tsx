import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Layers } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { listSdkOfferwallProviders } from "@/lib/sdk-offerwall.functions";

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
  return `https://offerwall.me/offerwall/${appId}/${encodeURIComponent(userId)}`;
  }
  if (slug === "cpxresearch") {
  return `https://offers.cpx-research.com/index.php?app_id=${appId}&ext_user_id=${encodeURIComponent(userId)}`;
  }
  return null;
}

export function OfferwallSlot({ limit }: { limit?: number }) {
  const { session } = useAuth();
  const fetchProviders = useServerFn(listSdkOfferwallProviders);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  const providers = useQuery({
    queryKey: ["sdk-offerwall-public", limit ?? "all"],
    queryFn: () => fetchProviders({ data: limit ? { limit } : {} }),
  });

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
    <div className="grid grid-cols-2 gap-3">
      {providers.data.map((provider) => {
        const url =
          provider.integrationType === "web_sdk" && provider.appId && session?.user.id
            ? buildOfferwallUrl(provider.slug, provider.appId, session.user.id)
            : null;

        return (
          <article
            key={provider.id}
            className="surface-card flex flex-col overflow-hidden !p-0 shadow-soft transition-shadow duration-200 hover:shadow-gold"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-background-alt">
              {provider.logoUrl && !broken[provider.id] ? (
                <img
                  src={provider.logoUrl}
                  alt={`${provider.name} banner`}
                  loading="lazy"
                  onError={() => setBroken((b) => ({ ...b, [provider.id]: true }))}
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
                <Button size="sm" variant="jade" className="mt-auto gap-1" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    Open <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="mt-auto gap-1" disabled>
                  Mobile app only <ExternalLink className="size-3.5" />
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
