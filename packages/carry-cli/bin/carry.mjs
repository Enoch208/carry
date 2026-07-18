#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { homedir } from "node:os";

// ── config ──────────────────────────────────────────────────────────────────
const PUBLISHER = process.env.WALRUS_PUBLISHER || "https://publisher.walrus-testnet.walrus.space";
const AGGREGATOR = process.env.WALRUS_AGGREGATOR || "https://aggregator.walrus-testnet.walrus.space";
const STORE_PATH = process.env.CARRY_STORE || `${homedir()}/.carry/store.json`;
const EPOCHS = 50;
const PACKAGE_ID = process.env.CARRY_PACKAGE_ID || "0xf3b458bea7002d364d6b6101dbdadb63a314cd529b2e2a576a6ab03a45c064d3";
const ACCESS_POLICY = process.env.CARRY_ACCESS_POLICY || "0x1636920dbdacff4d2c6be0a3c2344c74308de24e5df89e194d6fceffe1e5edfb";

// ── color ───────────────────────────────────────────────────────────────────
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (n) => (s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : String(s));
const dim = c("2"), bold = c("1"), red = c("31"), green = c("32"), cyan = c("36"),
  blue = c("38;2;77;162;255"), gray = c("90"), white = c("97");
const ok = green("✓"), no = red("✕");

// ── store (shared vault file with @carry/mcp) ─────────────────────────────────
const STOP = new Set(["a","an","the","to","of","in","on","at","for","and","or","is","am","are","be","do","does","did","i","me","my","mine","you","your","we","it","its","as","so","if","this","that","these","those","what","which","who","how","when","where","why","with","about","anything","something","can","will","would","should","any"]);
const tokens = (t) => t.toLowerCase().split(/\W+/).filter((w) => w && !STOP.has(w));
const matches = (content, query) => {
  const q = tokens(query);
  if (!q.length) return true;
  const w = new Set(tokens(content));
  return q.some((x) => w.has(x));
};
const load = () => {
  try { return JSON.parse(readFileSync(STORE_PATH, "utf8")); }
  catch { return { memories: [], policy: {}, seq: 0, lastReceipt: null }; }
};
const save = (s) => { mkdirSync(dirname(STORE_PATH), { recursive: true }); writeFileSync(STORE_PATH, JSON.stringify(s, null, 2)); };
const isAllowed = (s, ns) => s.policy[ns] !== false;
const shortRef = (r) => (r && r.length > 16 ? `${r.slice(0, 8)}…${r.slice(-6)}` : r || "");

// ── walrus ────────────────────────────────────────────────────────────────
async function walrusStore(payload) {
  const res = await fetch(`${PUBLISHER}/v1/blobs?epochs=${EPOCHS}`, { method: "PUT", body: JSON.stringify(payload) });
  const j = await res.json();
  const id = j.newlyCreated?.blobObject?.blobId ?? j.alreadyCertified?.blobId;
  if (!id) throw new Error("Walrus store failed");
  return id;
}
const walrusVerify = (id) => fetch(`${AGGREGATOR}/v1/blobs/${id}`).then((r) => r.ok).catch(() => false);

// ── sui (on-chain anchor via the local Sui CLI) ─────────────────────────────
function suiCall(args) {
  for (const bin of [process.env.SUI_BIN, "sui", "/opt/homebrew/bin/sui"].filter(Boolean)) {
    try {
      return execFileSync(bin, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  }
  throw new Error("Sui CLI not found — install it for `--onchain`");
}
function anchorOnChain(receipt, claim) {
  const used = claim ? [claim] : [...new Set(receipt.usedMemories.map((m) => m.namespace))];
  const blocked = receipt.blockedNamespaces || [];
  const answerId = `ans-${Buffer.from(receipt.query || "q").toString("hex").slice(0, 10)}`;
  const digest = "0x" + Buffer.from(answerId).toString("hex").slice(0, 16);
  const out = suiCall([
    "client", "call", "--package", PACKAGE_ID, "--module", "access", "--function", "anchor_receipt",
    "--args", ACCESS_POLICY, answerId, "aria", JSON.stringify(used), JSON.stringify(blocked), digest, "0x6",
    "--gas-budget", "100000000", "--json",
  ]);
  const d = JSON.parse(out);
  const ev = (d.events || []).find((e) => e.parsedJson && "all_authorized" in e.parsedJson);
  return { digest: d.digest, allAuthorized: ev?.parsedJson?.all_authorized ?? false, claimed: used };
}

// ── args ────────────────────────────────────────────────────────────────────
function parse(argv) {
  const flags = {}, pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--ns" || a === "--namespace" || a === "-n") flags.ns = argv[++i];
    else if (a === "--agent" || a === "-a") flags.agent = argv[++i];
    else if (a === "--onchain") flags.onchain = true;
    else if (a === "--claim") flags.claim = argv[++i];
    else if (a === "--json") flags.json = true;
    else pos.push(a);
  }
  return { pos, flags };
}

// ── render ────────────────────────────────────────────────────────────────
const rule = () => gray("─".repeat(64));
const label = (t) => dim(bold(t));

function printReceipt(r, agent) {
  const used = r.usedMemories, blocked = r.blockedNamespaces;
  console.log();
  console.log("  " + blue("◆ ") + white(bold("ANSWER RECEIPT")) + "   " + dim(`carry · ${agent}`));
  console.log("  " + rule());
  console.log("  " + label("MEMORY USED"));
  if (used.length) {
    for (const m of used) {
      console.log("  " + green("●") + " " + cyan(m.namespace.padEnd(9)) + white(m.content));
      const v = m.verified ? green(`verified ${ok} on Walrus`) : gray("unverified");
      console.log("    " + dim(`authorized ${ok}   `) + v + dim(`   walrus:${shortRef(m.walrusRef)}`));
    }
  } else {
    console.log("  " + dim("● (no accessible memory matched this query)"));
  }
  console.log();
  console.log("  " + label("BLOCKED BEFORE RETRIEVAL"));
  if (blocked.length) {
    for (const ns of blocked)
      console.log("  " + red("⛔ ") + cyan(ns) + dim("  never fetched — the gate ran before retrieval"));
  } else {
    console.log("  " + dim("● none"));
  }
  console.log("  " + rule());
  const verdict = blocked.length
    ? red(`${blocked.length} namespace${blocked.length > 1 ? "s" : ""} blocked · your data never reached the model`)
    : green(`${used.length} used · 0 blocked · every source verified on Walrus`);
  console.log("  " + dim("gate ran before retrieval · ") + verdict);
  console.log();
}

// ── commands ────────────────────────────────────────────────────────────────
const SEED = [
  { namespace: "health", content: "Allergic to penicillin", walrusRef: "oHJRrapc1dfUR-IEuS1RO2xQZnGsPx8iFE12MXSylVs" },
  { namespace: "health", content: "Gets migraines a few times a month; they ease in a dark, quiet room", walrusRef: "teb6wF9Ypzec4x3CPbleffMyQfWog0I1RLGPwsqcDUY" },
  { namespace: "health", content: "Takes magnesium nightly to help prevent migraines", walrusRef: "WPPxqHroWzga_IATFzgFZslOUyvqt8Ie9R-_EMiYob8" },
  { namespace: "diet", content: "Prefers vegan meals", walrusRef: "48oFqb9rDKoWi0-ynJbp9cFnerTCL6EhEQ9WFrvmJoU" },
];

function usage() {
  console.log(`
  ${blue("◆")} ${bold("carry")} ${dim("— proof-carrying memory for AI agents")}

  ${label("USAGE")}
    carry remember <text> --ns <namespace>     store a fact on Walrus
    carry recall  <query> [--agent <name>]     recall + print an Answer Receipt
    carry access  <grant|revoke> <namespace>   flip the retrieval gate
    carry policy                               show the access policy
    carry list                                 list every stored memory
    carry anchor  [--onchain] [--claim <ns>]   anchor the last receipt (Walrus, +Sui). --claim forces a namespace to test the on-chain gate
    carry seed                                 load the health-companion demo vault
    carry reset                                clear the vault

  ${label("EXAMPLES")}
    ${dim("$")} carry seed
    ${dim("$")} carry recall "am I allergic to anything?"
    ${dim("$")} carry access revoke health
    ${dim("$")} carry recall "am I allergic to anything?"   ${dim("# now blocked — see the receipt")}

  ${dim(`vault: ${STORE_PATH}`)}
  ${dim(`walrus: ${AGGREGATOR.replace("https://", "")}`)}
`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { pos, flags } = parse(rest);
  const s = load();

  switch (cmd) {
    case "remember": {
      const text = pos.join(" ").trim();
      const ns = flags.ns;
      if (!text || !ns) return fail("usage: carry remember <text> --ns <namespace>");
      process.stdout.write(dim("  storing on Walrus… "));
      const walrusRef = await walrusStore({ namespace: ns, content: text, createdAt: new Date().toISOString() });
      s.memories.push({ memoryId: `m${++s.seq}`, namespace: ns, content: text, walrusRef, createdAt: new Date().toISOString() });
      save(s);
      console.log(green("done"));
      console.log("  " + green("●") + " " + cyan(ns.padEnd(9)) + white(text));
      console.log("    " + dim(`walrus:${shortRef(walrusRef)}  ${ok} stored`));
      break;
    }
    case "recall": {
      const query = pos.join(" ").trim();
      if (!query) return fail("usage: carry recall <query>");
      const agent = flags.agent || "aria";
      const relevant = s.memories.filter((m) => matches(m.content, query));
      const allowed = relevant.filter((m) => isAllowed(s, m.namespace));
      const blocked = [...new Set(relevant.filter((m) => !isAllowed(s, m.namespace)).map((m) => m.namespace))];
      const checks = await Promise.all(allowed.map((m) => walrusVerify(m.walrusRef)));
      const receipt = {
        query, agent,
        usedMemories: allowed.map((m, i) => ({ ...m, authorized: true, verified: checks[i] })),
        blockedNamespaces: blocked,
        createdAt: new Date().toISOString(),
      };
      s.lastReceipt = receipt; save(s);
      if (flags.json) { console.log(JSON.stringify(receipt, null, 2)); break; }
      console.log("  " + dim(`? "${query}"`));
      printReceipt(receipt, agent);
      break;
    }
    case "access": {
      const [action, ns] = pos;
      if (!["grant", "revoke"].includes(action) || !ns) return fail("usage: carry access <grant|revoke> <namespace>");
      s.policy[ns] = action === "grant"; save(s);
      const state = action === "grant" ? green("GRANTED") : red("REVOKED");
      console.log(`  ${action === "grant" ? ok : "⛔"} ${cyan(ns)} ${state} ${dim("· enforced before the next recall")}`);
      break;
    }
    case "policy": {
      const entries = Object.entries(s.policy);
      console.log("  " + label("ACCESS POLICY") + dim("  (namespaces are allowed by default)"));
      if (!entries.length) console.log("  " + dim("● all namespaces allowed"));
      for (const [ns, allowed] of entries)
        console.log("  " + (allowed ? green("●") : red("●")) + " " + cyan(ns.padEnd(12)) + (allowed ? green("allow") : red("deny")));
      break;
    }
    case "list": {
      if (!s.memories.length) return console.log("  " + dim("(vault empty — run `carry seed`)"));
      console.log("  " + label("VAULT") + dim(`  ${s.memories.length} memories`));
      for (const m of s.memories)
        console.log("  " + green("●") + " " + cyan(m.namespace.padEnd(9)) + white(m.content) + dim(`  walrus:${shortRef(m.walrusRef)}`));
      break;
    }
    case "anchor": {
      if (!s.lastReceipt) return fail("no receipt yet — run `carry recall …` first");
      process.stdout.write(dim("  anchoring receipt on Walrus… "));
      const blobId = await walrusStore(s.lastReceipt);
      const verified = await walrusVerify(blobId);
      console.log(green("done"));
      console.log("  " + (verified ? ok : no) + " walrus:" + white(blobId));
      console.log("    " + dim(`${AGGREGATOR}/v1/blobs/${blobId}`));
      if (flags.onchain) {
        process.stdout.write(dim("  anchoring on Sui (consensus recomputes the verdict)… "));
        try {
          const r = anchorOnChain(s.lastReceipt, flags.claim);
          console.log(green("done"));
          const verdict = r.allAuthorized
            ? green(`all_authorized: true  ${ok}`)
            : red(`all_authorized: false  ⛔  the chain caught it`);
          console.log("  " + verdict + dim(`   (claimed: ${r.claimed.join(", ") || "none"})`));
          console.log("  " + dim("  sui:") + white(r.digest));
          console.log("    " + dim(`https://suiscan.xyz/testnet/tx/${r.digest}`));
        } catch (e) {
          console.log(red("failed"));
          console.log("  " + dim(`  ${e.message}`));
        }
      }
      break;
    }
    case "seed": {
      s.memories = SEED.map((m, i) => ({ memoryId: `m${i + 1}`, ...m, createdAt: new Date(0).toISOString() }));
      s.seq = SEED.length; s.policy = {}; s.lastReceipt = null; save(s);
      console.log("  " + green(ok) + " seeded " + white(`${SEED.length} memories`) + dim(" (health, diet) · real Walrus blobs"));
      console.log("  " + dim("try: ") + white(`carry recall "am I allergic to anything?"`));
      break;
    }
    case "reset": {
      save({ memories: [], policy: {}, seq: 0, lastReceipt: null });
      console.log("  " + green(ok) + " vault cleared");
      break;
    }
    default:
      usage();
  }
}

function fail(msg) { console.error("  " + red("✕ ") + msg); process.exitCode = 1; }

main().catch((e) => fail(e.message || String(e)));
