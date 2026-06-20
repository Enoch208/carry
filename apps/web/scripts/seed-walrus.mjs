const PUBLISHER = process.env.WALRUS_PUBLISHER;
const EPOCHS = Number(process.env.SEED_EPOCHS ?? 50);

if (!PUBLISHER) {
  console.error("WALRUS_PUBLISHER is not set. Run with: node --env-file=.env.local scripts/seed-walrus.mjs");
  process.exit(1);
}

const createdAt = new Date(0).toISOString();
const seeds = [
  { memoryId: "m1", namespace: "diet", content: "Prefers vegan meals", sourceAgent: "agent-a" },
  { memoryId: "m2", namespace: "health", content: "Allergic to penicillin", sourceAgent: "agent-a" },
  { memoryId: "m3", namespace: "project", content: "Building Carry", sourceAgent: "agent-a" },
];

for (const seed of seeds) {
  const body = JSON.stringify({
    namespace: seed.namespace,
    content: seed.content,
    sourceAgent: seed.sourceAgent,
    createdAt,
  });
  const res = await fetch(`${PUBLISHER}/v1/blobs?epochs=${EPOCHS}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    console.error(`${seed.memoryId} FAILED: HTTP ${res.status} ${await res.text()}`);
    continue;
  }
  const json = await res.json();
  const blobId = json.newlyCreated?.blobObject?.blobId ?? json.alreadyCertified?.blobId;
  console.log(`${seed.memoryId}\t${seed.content}\t${blobId ?? "NO_BLOB_ID " + JSON.stringify(json)}`);
}
