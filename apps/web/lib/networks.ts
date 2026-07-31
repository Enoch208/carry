export type Network = "testnet" | "mainnet";

export type NetCfg = {
  network: Network;
  packageId: string;
  accessPolicy: string;
  grpcUrl: string;
  suiscan: string;
  walrusAggregator: string;
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
  },
  mainnet: {
    network: "mainnet",
    packageId:
      process.env.CARRY_MAINNET_PACKAGE_ID ||
      "0x77bf6a36c2236579f084d7c66ad16b3da3277982d958e43f3d716c81ebe43f61",
    accessPolicy:
      process.env.CARRY_MAINNET_ACCESS_POLICY ||
      "0xc9bbb72830abc30fb995e57e3a752b9c79ffd8ff66f01357a42aeb95224be4b7",
    grpcUrl: process.env.SUI_MAINNET_GRPC_URL || "https://fullnode.mainnet.sui.io:443",
    suiscan: "https://suiscan.xyz/mainnet",
    walrusAggregator:
      process.env.WALRUS_MAINNET_AGGREGATOR || "https://aggregator.walrus-mainnet.walrus.space",
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
