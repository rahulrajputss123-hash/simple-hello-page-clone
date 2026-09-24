import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useIsNative } from "@/hooks/useIsNative";
import { ViewedOfferProvider } from "@/lib/viewed-offer";
import { SplashScreen } from "@/components/SplashScreen";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl text-primary">404</h1>
        <h2 className="mt-4 text-xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-soft"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-soft"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background-alt"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FFF8EC" },
      { title: "CashGPT — Earn real rewards for ads & offers" },
      {
        name: "description",
        content:
          "CashGPT turns rewarded videos, partner offers and daily tasks into real wallet credit you can cash out.",
      },
      { property: "og:site_name", content: "CashGPT" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", href: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * Runs before the body paints, so the native shell never shows a frame of the
 * server-rendered web landing.
 *
 * "/" is server-rendered as the marketing page (search engines need that markup),
 * and the platform swap in `useIsNative` can only happen after hydration. This
 * marks the document as native the moment the Capacitor global is available, and
 * `html[data-native] [data-web-only]` in styles.css hides web-only UI immediately.
 */
const NATIVE_PROBE = `try{var c=window.Capacitor;if(c&&(typeof c.isNativePlatform==="function"?c.isNativePlatform():/^(android|ios)$/.test(c.platform||""))){document.documentElement.setAttribute("data-native","1")}}catch(e){}`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: NATIVE_PROBE }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Lets the Support-tab AI assistant know which offer the user opened. */}
        <ViewedOfferProvider>
          <SplashGate>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </SplashGate>
        </ViewedOfferProvider>
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

/**
 * Public marketing routes that must paint immediately.
 *
 * These pages have no session to wait on, and putting a splash screen in front of
 * a download CTA both delays the first paint and swallows taps until the auth
 * check settles. Auth itself is untouched — `AuthProvider` still initialises
 * exactly as it does everywhere else; only the splash overlay is skipped.
 */
const SPLASH_FREE_ROUTES = new Set(["/app"]);

/**
 * Routes that skip the splash on the web but keep it inside the native shell.
 *
 * "/" is the marketing landing on cashgpt.in and the splash → redirect entry point
 * in the packaged app. The web side must paint immediately with no overlay; the
 * native side keeps its splash exactly as before.
 */
const WEB_ONLY_SPLASH_FREE_ROUTES = new Set(["/"]);

function SplashGate({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const native = useIsNative();

  const splashFree =
    SPLASH_FREE_ROUTES.has(pathname) || (!native && WEB_ONLY_SPLASH_FREE_ROUTES.has(pathname));

  if (splashFree) return <>{children}</>;

  return (
    <>
      <SplashScreen loading={loading} />
      {children}
    </>
  );
}
