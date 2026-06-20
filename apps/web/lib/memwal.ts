import type { MemWal } from "@mysten-incubation/memwal";
import type { NamespaceId } from "@carry/core";

export function memwalEnabled(): boolean {
  return (
    process.env.CARRY_MEMORY === "memwal" &&
    Boolean(process.env.MEMWAL_PRIVATE_KEY) &&
    Boolean(process.env.MEMWAL_ACCOUNT_ID)
  );
}

let clientPromise: Promise<MemWal> | null = null;

function getClient(): Promise<MemWal> {
  if (!clientPromise) {
    clientPromise = import("@mysten-incubation/memwal").then(({ MemWal }) =>
      MemWal.create({
        key: process.env.MEMWAL_PRIVATE_KEY!,
        accountId: process.env.MEMWAL_ACCOUNT_ID!,
        serverUrl: process.env.MEMWAL_SERVER_URL,
      })
    );
  }
  return clientPromise;
}

export async function rememberOnMemwal(content: string, namespace: NamespaceId): Promise<string> {
  const client = await getClient();
  const accepted = await client.remember(content, namespace);
  const status = await client.waitForRememberJob(accepted.job_id);
  return status.blob_id ?? accepted.job_id;
}
