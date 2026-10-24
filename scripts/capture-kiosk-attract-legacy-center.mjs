import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://127.0.0.1:4173/buurt";
const OUT = path.join(process.cwd(), "artifacts", "kiosk-attract-legacy-center");
const CHROME_PATH = process.env.LEGACY_CHROME_PATH;

const shots = [
  { name: "attract-map-390x844", viewport: { width: 390, height: 844 } },
  { name: "attract-map-1080x1920", viewport: { width: 1080, height: 1920 } },
];

await mkdir(OUT, { recursive: true });

const launchOptions = CHROME_PATH
  ? { executablePath: CHROME_PATH, headless: true }
  : { headless: true };

const browser = await chromium.launch(launchOptions);
console.log(
  CHROME_PATH
    ? `capture-kiosk-attract-legacy-center: using ${CHROME_PATH}`
    : "capture-kiosk-attract-legacy-center: bundled Chromium (modern)",
);

for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.viewport });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(".kiosk-attract-map-svg", { timeout: 15_000 });
  await page.waitForTimeout(400);

  const box = await page.locator(".kiosk-attract-map-svg").boundingBox();
  const panel = await page.locator(".kiosk-attract-map-panel").boundingBox();
  if (box && panel) {
    const svgCenter = box.x + box.width / 2;
    const panelCenter = panel.x + panel.width / 2;
    const delta = Math.abs(svgCenter - panelCenter);
    console.log(
      `${shot.name}: map center delta ${delta.toFixed(1)}px (svg ${box.width.toFixed(0)}px in panel ${panel.width.toFixed(0)}px)`,
    );
    if (delta > 4) {
      console.warn(`  WARN: map may be off-center (>${4}px)`);
    }
  }

  await page.screenshot({
    path: path.join(OUT, `${shot.name}.png`),
    fullPage: false,
  });
  await page.close();
  console.log(`wrote ${shot.name}.png`);
}

await browser.close();
console.log(`capture-kiosk-attract-legacy-center: OK → ${OUT}`);
