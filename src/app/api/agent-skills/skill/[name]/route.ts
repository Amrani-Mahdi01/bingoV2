import { AGENT_SKILLS } from "@/lib/agent-skills";

/**
 * Serves an individual SKILL.md, exposed at
 * /.well-known/agent-skills/{name}/SKILL.md via a next.config rewrite. Serves
 * the exact `content` the index hashed, so the published sha256 matches.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return AGENT_SKILLS.map((s) => ({ name: s.name }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
): Promise<Response> {
  const { name } = await params;
  const skill = AGENT_SKILLS.find((s) => s.name === name);
  if (!skill) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(skill.content, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
