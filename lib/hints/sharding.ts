export function hintShardKey(itemKey: string): string {
  // FNV-1a gives us a small deterministic shard key without pulling a
  // cryptographic dependency into the client bundle.
  let hash = 2166136261;

  for (const character of itemKey) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 2);
}
