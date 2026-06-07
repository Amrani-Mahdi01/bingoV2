import { MCP_SERVER, MCP_TOOLS, PROTOCOL_VERSION } from "@/lib/mcp/server";
import { SITE_URL } from "@/lib/seo/config";

/**
 * MCP Server Card (SEP-1649), served at /.well-known/mcp/server-card.json via a
 * next.config rewrite. Points at the real MCP server in app/api/mcp (exposed at
 * /mcp). Lists the tools the server actually implements.
 */
export const dynamic = "force-static";

export function GET(): Response {
  const card = {
    serverInfo: {
      name: MCP_SERVER.name,
      version: MCP_SERVER.version,
      instructions: MCP_SERVER.instructions,
    },
    protocolVersion: PROTOCOL_VERSION,
    transport: {
      type: "streamable-http",
      endpoint: `${SITE_URL}/mcp`,
    },
    capabilities: { tools: { listChanged: false } },
    tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
  };

  return new Response(JSON.stringify(card, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
