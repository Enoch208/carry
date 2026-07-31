import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const res = await fetch("https://api.elevenlabs.io/v1/music", {
  method: "POST",
  headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "content-type": "application/json" },
  body: JSON.stringify({
    prompt:
      "Restrained cinematic tech underscore for a serious infrastructure product film. Deep sub bass pulse, sparse muted piano notes, slow evolving synth pad, subtle rising tension that resolves into calm confidence. No drums after the midpoint, no melody that competes with a narrator. Understated, premium, trustworthy.",
    music_length_ms: 42000,
  }),
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
writeFileSync(new URL("./public/audio/update-bed.mp3", import.meta.url), Buffer.from(await res.arrayBuffer()));
console.log("✓ update-bed.mp3");
