export type Network = "testnet" | "mainnet";

export type NetCfg = {
  network: Network;
  packageId: string;
  accessPolicy: string;
  grpcUrl: string;
  suiscan: string;
  walrusAggregator: string;
  /// On-chain anchor for the portable memory vault (empty until created).
  carryVault: string;
};

// Public fullnodes stopped serving raw JSON-RPC on 2026-07-31; reads go over gRPC,
// which lets us talk to the canonical fullnodes instead of third-party mirrors.
export const NETWORKS: Record<Network, NetCfg> = {
  testnet: {
    network: "testnet",
    packageId: process.env.CARRY_PACKAGE_ID || "0xf7acc10ee3de95ed5bb4560e48d5bf4a4e24f7c4003b892b56632c7ff398b6f9",
    accessPolicy: process.env.CARRY_ACCESS_POLICY || "0x7bac6b5168a646d7ef06a05fcdebb1526a831bae91c42bb1fd295f976af2cd51",
    grpcUrl: process.env.SUI_GRPC_URL || "https://fullnode.testnet.sui.io:443",
    suiscan: "https://suiscan.xyz/testnet",
    walrusAggregator: process.env.WALRUS_AGGREGATOR || "https://aggregator.walrus-testnet.walrus.space",
    carryVault: process.env.CARRY_VAULT || "",
  },
  mainnet: {
    network: "mainnet",
    packageId:
      process.env.CARRY_MAINNET_PACKAGE_ID ||
      "0x010719e5141bc53bc32c1e75acf39872d1ee535d2f2b8bcdb059e4ece13ad0a4",
    accessPolicy:
      process.env.CARRY_MAINNET_ACCESS_POLICY ||
      "0xf84eca67c85149ba18f581907dc5d95b9e3aa3b0e0cb3490c946e41de428a673",
    grpcUrl: process.env.SUI_MAINNET_GRPC_URL || "https://fullnode.mainnet.sui.io:443",
    suiscan: "https://suiscan.xyz/mainnet",
    walrusAggregator:
      process.env.WALRUS_MAINNET_AGGREGATOR || "https://aggregator.walrus-mainnet.walrus.space",
    carryVault:
      process.env.CARRY_MAINNET_VAULT ||
      "0x7d7afe98ab2c57ca0817e3b58128bfdf2cf2a86c5f2474024378c11b1f702c48",
  },
};

export const DEFAULT_NETWORK: Network = process.env.CARRY_NETWORK === "mainnet" ? "mainnet" : "testnet";

export const isDeployed = (n: Network): boolean => NETWORKS[n].packageId.length > 0;

/** A requested network is honored only if it's actually deployed; otherwise fall back. */
export function resolveNetwork(requested?: string): Network {
  if (requested === "mainnet" && isDeployed("mainnet")) return "mainnet";
  if (requested === "testnet") return "testnet";
  return isDeployed(DEFAULT_NETWORK) ? DEFAULT_NETWORK : "testnet";
}

export const netCfg = (n?: Network): NetCfg => NETWORKS[n ?? DEFAULT_NETWORK];
