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
  ["uv1", "Your AI assistant remembers everything you tell it. But can it prove which memories it used?"],
  ["uv2", "Carry is proof-carrying memory for AI agents. A major update is now live on Sui mainnet."],
  ["uv3", "The gate runs before generation, so restricted memory never enters the model's context."],
  ["uv4", "An adversarial lab tested nine attack classes. A permissive baseline let eight through. Carry: zero."],
  ["uv5", "Sealed receipts prove what an answer used without revealing it. And a refusal is proof too, recorded by consensus."],
  ["uv6", "Everything is publicly checkable. No wallet required."],
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
