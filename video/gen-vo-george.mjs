import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const KEY = env.ELEVENLABS_API_KEY;
const GEORGE = "JBFqnCBsd6RMkjVDRZzb";
const LINES = [
  ["vo1", "Your AI remembers everything."],
  ["vo2", "Carry proves exactly what it used — verified on Walrus."],
  ["vo3", "Revoke access, and it's never even fetched. Enforced on Sui."],
  ["vo4", "Carry. Memory you can prove."],
];
for (const [name, text] of LINES) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${GEORGE}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  writeFileSync(new URL(`./public/audio/${name}.mp3`, import.meta.url), Buffer.from(await res.arrayBuffer()));
  console.log("✓", name);
}
