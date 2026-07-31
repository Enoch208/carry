import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const KEY = env.ELEVENLABS_API_KEY;
const GEORGE = "JBFqnCBsd6RMkjVDRZzb";
const LINES = [
  ["lv1", "Carry is live."],
  ["lv2", "The proof layer for AI memory."],
  ["lv3", "Explore the docs, install the CLI, and try it live."],
  ["lv4", "Memory you can prove."],
];
for (const [name, text] of LINES) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${GEORGE}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true } }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  writeFileSync(new URL(`./public/audio/${name}.mp3`, import.meta.url), Buffer.from(await res.arrayBuffer()));
  console.log("✓", name);
}
const m = await fetch("https://api.elevenlabs.io/v1/music", {
  method: "POST",
  headers: { "xi-api-key": KEY, "content-type": "application/json" },
  body: JSON.stringify({
    prompt: "Short energetic launch stinger for a premium tech product, 10 seconds. Minimal electronic, confident pulsing sub bass, bright airy synth accents, quick understated build, lands on a clean satisfying final hit at the end. No vocals. Modern, premium, restrained.",
    music_length_ms: 11000,
  }),
});
if (!m.ok) throw new Error(`music: ${m.status}`);
writeFileSync(new URL("./public/audio/launch-bed.mp3", import.meta.url), Buffer.from(await m.arrayBuffer()));
console.log("✓ launch-bed");
