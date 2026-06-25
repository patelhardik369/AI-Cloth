// Read-only setup check: verifies the migration tables + storage buckets exist.
// Usage: node scripts/check-supabase.mjs   (reads .env.local)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// minimal .env.local parser
const env = {};
try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
} catch {
  console.error("Could not read .env.local");
  process.exit(2);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || url.includes("placeholder")) {
  console.log("SKIP: Supabase URL/service key not configured.");
  process.exit(0);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const result = { tables: {}, buckets: {} };

for (const table of ["profiles", "generations"]) {
  const { error } = await supabase.from(table).select("id", { count: "exact", head: true });
  result.tables[table] = error ? `MISSING (${error.message})` : "OK";
}

const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
if (bErr) {
  result.buckets._error = bErr.message;
} else {
  const names = new Set((buckets || []).map((b) => b.id));
  for (const b of ["sari-uploads", "generated-outputs"]) {
    result.buckets[b] = names.has(b) ? "OK" : "MISSING";
  }
}

console.log(JSON.stringify(result, null, 2));
