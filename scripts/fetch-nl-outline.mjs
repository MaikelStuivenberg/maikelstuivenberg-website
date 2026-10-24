/** @deprecated Use `node scripts/generate-nl-outline.mjs` */
import { spawnSync } from "node:child_process";
const r = spawnSync(process.execPath, ["scripts/generate-nl-outline.mjs"], {
  stdio: "inherit",
});
process.exit(r.status ?? 1);
