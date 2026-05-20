import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load schema
const schema = JSON.parse(readFileSync(resolve(ROOT, ".env.schema.json"), "utf-8"));
const expectedVars = new Set(Object.keys(schema.properties));

// Parse .env.example — extract VAR_NAME=value lines (ignore comments and blanks)
const envExample = readFileSync(resolve(ROOT, ".env.example"), "utf-8");
const actualVars = new Set(
  [...envExample.matchAll(/^([A-Z_][A-Z0-9_]*)=/gm)].map(m => m[1])
);

// Diff
let exitCode = 0;

const missing = [...expectedVars].filter(v => !actualVars.has(v));
if (missing.length) {
  console.error("❌ Missing from .env.example:", missing.join(", "));
  exitCode = 1;
} else {
  console.log("✅ All schema vars present in .env.example");
}

const extra = [...actualVars].filter(v => !expectedVars.has(v));
if (extra.length) {
  console.warn("⚠️  In .env.example but not in schema:", extra.join(", "));
  // Not fatal — could be intentional, just warn
}

// Check for drift between local and schema
if (existsSync(resolve(ROOT, ".env.local"))) {
  const envLocal = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
  const localVars = new Set(
    [...envLocal.matchAll(/^([A-Z_][A-Z0-9_]*)=/gm)].map(m => m[1])
  );
  const missingLocal = [...expectedVars].filter(v => !localVars.has(v) && schema.properties[v]?.required);
  if (missingLocal.length) {
    console.warn("⚠️  Required vars missing from .env.local:", missingLocal.join(", "));
  }
}

process.exit(exitCode);
