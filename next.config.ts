import type { NextConfig } from "next";

// Origin of the Laravel backend. The browser no longer calls this host
// directly (see the `/bk` rewrite below) — Vercel proxies to it server-side.
const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://bingo.symloop.com";

const nextConfig: NextConfig = {
  // Allow cross-origin dev requests from common LAN ranges + the
  // current network IP so the dev server accepts requests when you
  // open the site from your phone or another device on the network.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.0.0/16",
    "192.168.1.1",
    "192.168.56.1",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "*.local",
    "*.localhost",
  ],
  // Next's app router can't host a literal `.well-known` folder, so expose the
  // RFC 9727 API catalog (served by the route under /api/well-known) at its
  // canonical path.
  async rewrites() {
    return [
      // Same-origin proxy to the Laravel backend. The storefront/admin JS
      // calls these under our OWN domain (`/bk/...`), and Vercel forwards
      // them to the backend server-side over a reliable datacenter link.
      // This fixes mobile networks that can reach Vercel but not the
      // Hostinger host directly, and removes cross-origin CORS entirely.
      {
        source: "/bk/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
      {
        source: "/.well-known/api-catalog",
        destination: "/api/well-known/api-catalog",
      },
      // MCP server card + transport endpoint.
      {
        source: "/.well-known/mcp/server-card.json",
        destination: "/api/well-known/mcp-server-card",
      },
      { source: "/mcp", destination: "/api/mcp" },
      // Agent Skills discovery index + individual SKILL.md docs.
      {
        source: "/.well-known/agent-skills/index.json",
        destination: "/api/agent-skills/index",
      },
      {
        source: "/.well-known/agent-skills/:name/SKILL.md",
        destination: "/api/agent-skills/skill/:name",
      },
    ];
  },
};

export default nextConfig;
