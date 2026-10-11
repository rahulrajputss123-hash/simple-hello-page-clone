// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const projectEnv = loadEnv("project", "/vercel/share", "");

export default defineConfig({
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        projectEnv.VITE_SUPABASE_URL || projectEnv.SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        projectEnv.VITE_SUPABASE_PUBLISHABLE_KEY || projectEnv.SUPABASE_PUBLISHABLE_KEY,
      ),
    },
    server: { allowedHosts: true, host: "0.0.0.0", port: 3000 },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    routeRules: {
      // Immutable hashed assets - 1 year cache
      "/assets/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      
      // Icons and images - 30 days with stale-while-revalidate
      "/icons/**": { headers: { "cache-control": "public, max-age=2592000, stale-while-revalidate=86400" } },
      "/assistant-mascot.webp": { headers: { "cache-control": "public, max-age=2592000, stale-while-revalidate=86400" } },
      "/icon-128.webp": { headers: { "cache-control": "public, max-age=2592000, stale-while-revalidate=86400" } },
      "/logo-horizontal-light.webp": { headers: { "cache-control": "public, max-age=2592000, stale-while-revalidate=86400" } },
      "/logo-horizontal-dark.webp": { headers: { "cache-control": "public, max-age=2592000, stale-while-revalidate=86400" } },
      "/**/*.webp": { headers: { "cache-control": "public, max-age=2592000, stale-while-revalidate=86400" } },
      "/landing/**": { headers: { "cache-control": "public, max-age=2592000, stale-while-revalidate=86400" } },
      
      // Fonts - 1 year cache
      "/**/*.woff2": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/**/*.woff": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      
      // No caching for HTML, APIs, server functions, auth
      "/**/*.html": { headers: { "cache-control": "no-cache, no-store, must-revalidate" } },
      "/_serverFn/**": { headers: { "cache-control": "no-cache, no-store, must-revalidate" } },
      "/api/**": { headers: { "cache-control": "no-cache, no-store, must-revalidate" } },
      "/auth/**": { headers: { "cache-control": "no-cache, no-store, must-revalidate" } },
      "/manifest.json": { headers: { "cache-control": "no-cache, no-store, must-revalidate" } },
    },
  },
});
