import fs from "node:fs";
import path from "node:path";
import doiuse from "doiuse";
import postcss from "postcss";

const distAssets = path.join(process.cwd(), "dist", "assets");
const kioskCssPath = path.join(process.cwd(), "src", "pages", "buurt", "buurt-kiosk.css");

const cssFile = fs
  .readdirSync(distAssets)
  .find((f) => f.endsWith(".css") && !f.includes("legacy"));

if (!cssFile) {
  console.error("verify-css-legacy: no dist CSS bundle found — run npm run build first");
  process.exit(1);
}

const css = fs.readFileSync(path.join(distAssets, cssFile), "utf8");
const kioskCss = fs.readFileSync(kioskCssPath, "utf8");

const DOIUSE_TARGETS = [
  { label: "chrome 69 (stand baseline)", browsers: ["chrome 69"] },
  { label: "chrome 61 (older embedded)", browsers: ["chrome 61"] },
  { label: "safari 11", browsers: ["safari 11"] },
];

/** Patterns risky on Chrome 61 / Safari 11 — flagged in attract-related source CSS */
const ATTRACT_RISK_PATTERNS = [
  { id: "place-*", regex: /\bplace-(content|items|self)\s*:/ },
  { id: "aspect-ratio", regex: /\baspect-ratio\s*:/ },
  {
    id: "logical margin/padding",
    regex: /\b(margin|padding)-(inline|block)(-[a-z]+)?\s*:/,
  },
  { id: "inset shorthand", regex: /\binset\s*:/ },
  {
    id: "individual transform",
    regex: /\b(translate|rotate|scale|scaleX|scaleY|translateX|translateY)\s*:/,
  },
  { id: "fit-content sizing", regex: /\b(width|height|max-width|min-width)\s*:\s*fit-content\b/ },
];

function scanAttractSource(cssText) {
  const lines = cssText.split("\n");
  const hits = [];
  let inAttract = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.includes(".kiosk-attract") || line.includes(".kiosk-lunch")) {
      inAttract = true;
    }
    if (!inAttract) continue;

    for (const { id, regex } of ATTRACT_RISK_PATTERNS) {
      if (regex.test(line)) {
        hits.push({ line: i + 1, id, text: line.trim() });
      }
    }

    braceDepth += (line.match(/{/g) ?? []).length;
    braceDepth -= (line.match(/}/g) ?? []).length;
    if (braceDepth <= 0 && line.includes("}")) {
      inAttract = false;
    }
  }

  return hits;
}

let failed = false;

for (const target of DOIUSE_TARGETS) {
  const issues = [];
  await postcss([
    doiuse({
      browsers: target.browsers,
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
  console.log(
    `verify-css-legacy: ${cssFile} — ${target.label}: ${issues.length} doiuse notes, ${bad.length} unsupported (outside @supports)`,
  );

  if (target.browsers.includes("chrome 69") && bad.length > 0) {
    failed = true;
    console.error("Unsupported features (chrome 69 baseline):");
    for (const item of bad.slice(0, 40)) {
      console.error(`  L${item.line}: [${item.feature}] ${item.message}`);
    }
    if (bad.length > 40) console.error(`  … and ${bad.length - 40} more`);
  } else if (bad.length > 0) {
    console.log(`  (informational) ${bad.length} items on ${target.label}`);
  }
}

const attractHits = scanAttractSource(kioskCss);
if (attractHits.length > 0) {
  console.log(
    `verify-css-legacy: attract-related patterns to avoid on Chrome 61 / Safari 11 (${attractHits.length} in buurt-kiosk.css):`,
  );
  for (const hit of attractHits.slice(0, 30)) {
    console.log(`  L${hit.line} [${hit.id}]: ${hit.text}`);
  }
  if (attractHits.length > 30) {
    console.log(`  … and ${attractHits.length - 30} more`);
  }
} else {
  console.log("verify-css-legacy: no flagged attract patterns in buurt-kiosk.css source");
}

const hasOk = !/\boklch\s*\(/.test(css);
const hasLayer = css.includes("@layer");
const hasProperty = css.includes("@property");
console.log(
  `sanity: oklch=${hasOk ? "none" : "FOUND"} @layer=${hasLayer ? "yes" : "no"} @property=${hasProperty ? "yes" : "no"}`,
);

if (failed) {
  process.exit(1);
}

console.log("verify-css-legacy: OK");
