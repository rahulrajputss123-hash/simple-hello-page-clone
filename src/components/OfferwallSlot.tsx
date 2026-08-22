import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { listSdkOfferwallProviders } from "@/lib/sdk-offerwall.functions";

function buildOfferwallUrl(slug: string, appId: string, userId: string): string | null {
  if (slug === "mooffers") {
    return `https://wall.mooffers.com/offerwall/${appId}?uid=${encodeURIComponent(userId)}`;
  }
  return null;
}

export function OfferwallSlot({ limit }: { limit?: number }) {
  const { session } = useAuth();
  const fetchProviders = useServerFn(listSdkOfferwallProviders);

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
          <article key={provider.id} className="surface-card flex flex-col gap-2 p-3">
            <span className="grid size-9 place-items-center overflow-hidden rounded-xl bg-jade-gradient text-primary-foreground">
              {provider.logoUrl ? (
                <img src={provider.logoUrl} alt={`${provider.name} logo`} className="size-9 object-cover" />
              ) : (
                <Layers className="size-4" />
              )}
            </span>
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
          </article>
        );
      })}
    </div>
  );
}
