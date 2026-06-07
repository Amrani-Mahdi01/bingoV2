import {
  MCP_SERVER,
  MCP_TOOLS,
  PROTOCOL_VERSION,
  callTool,
} from "@/lib/mcp/server";

/**
 * MCP server over Streamable HTTP (JSON-RPC 2.0), exposed at /mcp via a
 * next.config rewrite. Stateless: each POST is handled and answered with a
 * single JSON response (the spec permits application/json instead of an SSE
 * stream). GET returns 405 (no server-initiated stream). Read-only tools.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, mcp-protocol-version, mcp-session-id",
};

type Rpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function result(id: Rpc["id"], res: unknown) {
  return { jsonrpc: "2.0", id, result: res };
}
function error(id: Rpc["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handle(msg: Rpc): Promise<object | null> {
  const { id, method, params } = msg;
  // Notifications (no id / notifications/*) get no response.
  if (id === undefined || id === null || method?.startsWith("notifications/")) {
    return null;
  }
  switch (method) {
    case "initialize":
      return result(id, {
        protocolVersion:
          (params?.protocolVersion as string) || PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: MCP_SERVER.name, version: MCP_SERVER.version },
        instructions: MCP_SERVER.instructions,
      });
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, { tools: MCP_TOOLS });
    case "tools/call": {
      const name = String(params?.name ?? "");
      const args = (params?.arguments as Record<string, unknown>) || {};
      try {
        const { text, isError } = await callTool(name, args);
        return result(id, { content: [{ type: "text", text }], isError: !!isError });
      } catch (e) {
        return result(id, {
          content: [{ type: "text", text: `Erreur: ${(e as Error).message}` }],
          isError: true,
        });
      }
    }
    default:
      return error(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(error(null, -32700, "Parse error"), {
      status: 400,
      headers: CORS,
    });
  }

  // Single message or JSON-RPC batch.
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handle(m as Rpc)))).filter(
      Boolean,
    );
    if (out.length === 0) return new Response(null, { status: 202, headers: CORS });
    return Response.json(out, { headers: CORS });
  }

  const res = await handle(body as Rpc);
  if (res === null) return new Response(null, { status: 202, headers: CORS });
  return Response.json(res, { headers: CORS });
}

export function GET(): Response {
  return new Response("Method Not Allowed — POST JSON-RPC to this MCP endpoint.", {
    status: 405,
    headers: { ...CORS, allow: "POST, OPTIONS" },
  });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}
