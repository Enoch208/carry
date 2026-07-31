import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const KEY = env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("no ELEVENLABS_API_KEY in apps/web/.env.local");

const H = { "xi-api-key": KEY, "content-type": "application/json" };

// Brian — premade deep, confident narration voice
const VOICE = process.env.CARRY_VOICE_ID || "nPczCjzI2devNBz1zQrb";

const LINES = [
  ["vo1", "Your AI remembers everything."],
  ["vo2", "Carry proves exactly what it used — verified on Walrus."],
  ["vo3", "Revoke it? Never fetched. Enforced on Sui."],
  ["vo4", "Carry. Memory you can prove."],
];

async function tts(name, text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      text,
      model_id: "eleven_v3",
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  writeFileSync(new URL(`./public/audio/${name}.mp3`, import.meta.url), Buffer.from(await res.arrayBuffer()));
  console.log("✓", name);
}

async function sfx(name, text, seconds) {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: H,
    body: JSON.stringify({ text, duration_seconds: seconds, prompt_influence: 0.4 }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  writeFileSync(new URL(`./public/audio/${name}.mp3`, import.meta.url), Buffer.from(await res.arrayBuffer()));
  console.log("✓", name);
}

for (const [name, text] of LINES) await tts(name, text);
await sfx(
  "bed",
  "Dark minimal ambient electronic pulse bed for a premium tech product film. Soft deep synth heartbeat around 90 bpm, subtle airy texture, no melody, understated, seamless, background level.",
  16
);
await sfx("lock", "A single soft digital lock click, short, subtle, satisfying, UI sound", 1.2);
await sfx("whoosh", "A very soft short air whoosh transition, subtle, clean, product film", 1.0);
console.log("all audio generated");
