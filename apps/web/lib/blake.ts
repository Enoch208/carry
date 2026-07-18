import { blake2b } from "@noble/hashes/blake2.js";

// Canonical JSON: keys sorted recursively, so the digest is reproducible
// regardless of how Walrus serialized the stored bytes.
function sortValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortValue(o[k])]));
  }
  return v;
}

export function toHex(b: Uint8Array): string {
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function fromHex(h: string): Uint8Array {
  const s = h.startsWith("0x") ? h.slice(2) : h;
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function canonicalBytes(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(sortValue(obj)));
}

export function blake2b256Hex(bytes: Uint8Array): string {
  return toHex(blake2b(bytes, { dkLen: 32 }));
}

/** blake2b256 of an object's canonical JSON — the content-binding `digest`. */
export function digestHexOf(obj: unknown): string {
  return blake2b256Hex(canonicalBytes(obj));
}

/** chain_digest = blake2b256(prev_digest ++ digest). Empty prev hashes digest alone. */
export function chainDigestHex(prevHex: string, digestHex: string): string {
  const prev = prevHex ? fromHex(prevHex) : new Uint8Array(0);
  const dig = fromHex(digestHex);
  const buf = new Uint8Array(prev.length + dig.length);
  buf.set(prev, 0);
  buf.set(dig, prev.length);
  return blake2b256Hex(buf);
}

/** Robust to how Walrus serialized the blob (key order/whitespace). */
export function digestMatches(blobBytes: Uint8Array, expectedDigestHex: string): boolean {
  try {
    const obj = JSON.parse(new TextDecoder().decode(blobBytes));
    return digestHexOf(obj) === expectedDigestHex.replace(/^0x/, "");
  } catch {
    return false;
  }
}
