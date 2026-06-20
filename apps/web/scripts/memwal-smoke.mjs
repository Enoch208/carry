import { MemWal } from "@mysten-incubation/memwal";

const key = process.env.MEMWAL_PRIVATE_KEY;
const accountId = process.env.MEMWAL_ACCOUNT_ID;
const serverUrl = process.env.MEMWAL_SERVER_URL;

if (!key || !accountId) {
  console.error("Set MEMWAL_PRIVATE_KEY and MEMWAL_ACCOUNT_ID in apps/web/.env.local first.");
  process.exit(1);
}

const memwal = MemWal.create({ key, accountId, serverUrl, namespace: "health" });

console.log("1. remember('Allergic to penicillin') in namespace 'health' ...");
const accepted = await memwal.remember("Allergic to penicillin", "health");
console.log("   accepted:", accepted);

console.log("2. waitForRememberJob ...");
const status = await memwal.waitForRememberJob(accepted.job_id);
console.log("   status:", status);
console.log("   -> Walrus blob_id:", status.blob_id);

console.log("3. recall('what am I allergic to?') in namespace 'health' ...");
const res = await memwal.recall({ query: "what am I allergic to?", namespace: "health" });
console.log("   results:", JSON.stringify(res, null, 2));
