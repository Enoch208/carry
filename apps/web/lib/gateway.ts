import { timingSafeEqual, createHash } from "node:crypto";

/**
 * Keys come from CARRY_API_KEYS as a comma-separated list. With none configured
 * the gateway refuses every request rather than running open — an audit surface
 * that defaults to public is worse than no audit surface.
 */
function configuredKeys(): string[] {
  return (process.env.CARRY_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest();

/** Compares digests so the check does not leak key length or a prefix by timing. */
function matches(presented: string, known: string): boolean {
  const a = sha256(presented);
  const b = sha256(known);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type Caller = { keyId: string };

export function authorize(req: Request): { ok: true; caller: Caller } | { ok: false; res: Response } {
  const keys = configuredKeys();
  if (!keys.length) {
    return { ok: false, res: problem(503, "gateway_not_configured", "No API keys are configured.") };
  }
  const header = req.headers.get("authorization") ?? "";
  const presented = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!presented) {
    return { ok: false, res: problem(401, "missing_key", "Send an API key as `Authorization: Bearer <key>`.") };
  }
  const hit = keys.find((k) => matches(presented, k));
  if (!hit) return { ok: false, res: problem(403, "invalid_key", "That API key is not recognised.") };
  // Identify the caller by a digest prefix so logs never carry the key itself.
  return { ok: true, caller: { keyId: sha256(hit).toString("hex").slice(0, 12) } };
}

export function problem(status: number, code: string, detail: string): Response {
  return Response.json({ error: { code, detail } }, { status });
}

export function ok(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}
