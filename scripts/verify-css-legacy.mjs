import fs from "node:fs";
import path from "node:path";
import doiuse from "doiuse";
import postcss from "postcss";

const distAssets = path.join(process.cwd(), "dist", "assets");
const cssFile = fs
  .readdirSync(distAssets)
  .find((f) => f.endsWith(".css") && !f.includes("legacy"));

if (!cssFile) {
  console.error("verify-css-legacy: no dist CSS bundle found — run npm run build first");
  process.exit(1);
}

const css = fs.readFileSync(path.join(distAssets, cssFile), "utf8");
const issues = [];

await postcss([
  doiuse({
    browsers: ["chrome 69"],
    ignore: ["css3-cursors"],
    onIssue(info) {
      issues.push({
        feature: info.feature,
        message: info.message,
        line: info.line,
      });
    },
  }),
]).process(css, { from: cssFile });

const bad = issues.filter((i) => !String(i.message).includes("@supports"));

console.log(`verify-css-legacy: ${cssFile} (${issues.length} doiuse notes, chrome 69)`);

if (bad.length > 0) {
  console.error("Unsupported features (outside @supports):");
  for (const item of bad.slice(0, 40)) {
    console.error(`  L${item.line}: [${item.feature}] ${item.message}`);
  }
  if (bad.length > 40) console.error(`  … and ${bad.length - 40} more`);
  process.exit(1);
}

const hasOk = !/\boklch\s*\(/.test(css);
const hasLayer = css.includes("@layer");
const hasProperty = css.includes("@property");
console.log(
  `sanity: oklch=${hasOk ? "none" : "FOUND"} @layer=${hasLayer ? "yes" : "no"} @property=${hasProperty ? "yes" : "no"}`,
);

console.log("verify-css-legacy: OK");
