import { execFile } from "node:child_process";
import { promisify } from "node:util";

const pexec = promisify(execFile);

const PKG = process.env.CARRY_PACKAGE_ID || "0xf3b458bea7002d364d6b6101dbdadb63a314cd529b2e2a576a6ab03a45c064d3";
const POLICY = process.env.CARRY_ACCESS_POLICY || "0x1636920dbdacff4d2c6be0a3c2344c74308de24e5df89e194d6fceffe1e5edfb";
const AGENT = "aria";
const CLOCK = "0x6";

export type OnchainAnchor = { digest: string; allAuthorized: boolean; suiscanUrl: string };

type ReceiptLike = {
  answerId: string;
  usedMemories: { namespace: string }[];
  blockedNamespaces: string[];
};

function toDigest(answerId: string): string {
  const hex = Buffer.from(answerId).toString("hex").slice(0, 16);
  return "0x" + (hex || "00");
}

async function runSui(args: string[]): Promise<string> {
  const bins = [process.env.SUI_BIN, "sui", "/opt/homebrew/bin/sui"].filter(Boolean) as string[];
  let lastErr: unknown;
  for (const bin of bins) {
    try {
      const { stdout } = await pexec(bin, args, { maxBuffer: 32 * 1024 * 1024, timeout: 60000 });
      return stdout;
    } catch (e) {
      lastErr = e;
      if ((e as { code?: string }).code !== "ENOENT") throw e;
    }
  }
  throw lastErr ?? new Error("sui CLI not found");
}

export async function anchorOnChain(
  receipt: ReceiptLike,
  opts?: { claimNamespaces?: string[] }
): Promise<OnchainAnchor> {
  const used = opts?.claimNamespaces ?? [...new Set(receipt.usedMemories.map((m) => m.namespace))];
  const blocked = receipt.blockedNamespaces ?? [];
  const args = [
    "client", "call",
    "--package", PKG,
    "--module", "access",
    "--function", "anchor_receipt",
    "--args", POLICY, receipt.answerId, AGENT, JSON.stringify(used), JSON.stringify(blocked), toDigest(receipt.answerId), CLOCK,
    "--gas-budget", "100000000",
    "--json",
  ];
  const stdout = await runSui(args);
  const parsed = JSON.parse(stdout) as {
    digest?: string;
    events?: { parsedJson?: { all_authorized?: boolean } }[];
  };
  const event = parsed.events?.find((e) => e.parsedJson && "all_authorized" in e.parsedJson);
  const digest = parsed.digest ?? "";
  return {
    digest,
    allAuthorized: event?.parsedJson?.all_authorized ?? false,
    suiscanUrl: `https://suiscan.xyz/testnet/tx/${digest}`,
  };
}
