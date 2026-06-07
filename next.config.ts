import type { NextConfig } from "next";

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
