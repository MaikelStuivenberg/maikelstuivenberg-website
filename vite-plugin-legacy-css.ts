import type { Plugin } from "vite";
import { processLegacyCss } from "./scripts/legacy-css-pipeline";

/** Post-process emitted CSS assets for old Chromium / WebView targets. */
export function legacyCssCompatPlugin(): Plugin {
  return {
    name: "legacy-css-compat",
    enforce: "post",
    async generateBundle(_options, bundle) {
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type !== "asset" || !fileName.endsWith(".css")) continue;
        const source =
          typeof item.source === "string"
            ? item.source
            : Buffer.from(item.source).toString("utf8");
        item.source = await processLegacyCss(source);
      }
    },
  };
}
