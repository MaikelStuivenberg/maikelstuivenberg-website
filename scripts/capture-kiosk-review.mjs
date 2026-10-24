import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://127.0.0.1:4173/buurt";
const OUT = path.join(process.cwd(), "artifacts", "kiosk-review");

const VIEWPORTS = [
  { label: "360x640", width: 360, height: 640, query: "" },
  { label: "390x844", width: 390, height: 844, query: "" },
  { label: "1080x1920", width: 1080, height: 1920, query: "" },
  { label: "1920x1080-rotate90", width: 1920, height: 1080, query: "?rotate=90" },
];

async function snap(page, outDir, name) {
  await page.waitForTimeout(450);
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: false,
  });
}

async function captureSet(page, outDir) {
  await page.locator(".kiosk-attract").click();
  await snap(page, outDir, "choose");

  await page
    .getByRole("button", { name: /Zoek in jouw buurt|Search your neighbourhood/i })
    .click();
  await snap(page, outDir, "search");

  await page.getByRole("button", { name: /Terug|Back/i }).first().click();
  await page
    .getByRole("button", { name: /Laat alle plekken zien|Show all places/i })
    .click();
  await page.waitForSelector(".leaflet-interactive", { timeout: 20_000 });
  await snap(page, outDir, "map");

  await page.locator(".leaflet-interactive").first().click({ force: true });
  await page.waitForSelector(".kiosk-map-sheet", { timeout: 10_000 });
  await snap(page, outDir, "map-sheet");

  await page
    .getByRole("button", { name: /Kom in actie in je buurt|Take action in your neighbourhood/i })
    .click();
  await page.waitForSelector(".kiosk-screen--signup", { timeout: 10_000 });
  await snap(page, outDir, "signup");
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const outDir = path.join(OUT, vp.label);
  await mkdir(outDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(`${BASE}${vp.query}`, { waitUntil: "networkidle" });
  await captureSet(page, outDir);
  await page.close();
  console.log(`wrote ${vp.label}/`);
}

await browser.close();
console.log(`capture-kiosk-review: OK → ${OUT}`);
