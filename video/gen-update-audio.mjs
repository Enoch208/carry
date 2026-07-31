import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const KEY = env.ELEVENLABS_API_KEY;
const VOICE = "UgBBYS2sOqTuMpoF3BR0";

// Confident and factual: this is research we ran and hardening we shipped.
const LINES = [
  ["uv1", "Carry is proof-carrying memory for AI agents. It is now live on Sui mainnet."],
  ["uv2", "We built an adversarial lab to measure what permissive memory access really costs."],
  ["uv3", "Against a permissive default, eight of nine attacks reached memory they should never have touched."],
  ["uv4", "Carry's gate is default-deny, enforced on chain. The same nine attacks: zero."],
  ["uv5", "We also shipped sealed receipts, a portable vault, and migrated to gRPC the day legacy RPC retired."],
  ["uv6", "Every claim is one click from proof. No wallet required."],
];

for (const [name, text] of LINES) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true },
      }),
    }
  );
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  writeFileSync(new URL(`./public/audio/${name}.mp3`, import.meta.url), Buffer.from(await res.arrayBuffer()));
  console.log("✓", name, `"${text.slice(0, 46)}…"`);
}
