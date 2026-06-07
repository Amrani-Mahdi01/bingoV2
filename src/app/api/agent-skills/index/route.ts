import { createHash } from "crypto";

import { AGENT_SKILLS } from "@/lib/agent-skills";
import { SITE_URL } from "@/lib/seo/config";

/**
 * Agent Skills discovery index (RFC v0.2.0), served at
 * /.well-known/agent-skills/index.json via a next.config rewrite. Each entry's
 * sha256 is computed over the exact SKILL.md the per-skill route serves.
 */
export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET(): Response {
  const skills = AGENT_SKILLS.map((s) => ({
    name: s.name,
    type: s.type,
    description: s.description,
    url: `${SITE_URL}/.well-known/agent-skills/${s.name}/SKILL.md`,
    digest: "sha256:" + createHash("sha256").update(s.content, "utf8").digest("hex"),
  }));

  const body = {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
