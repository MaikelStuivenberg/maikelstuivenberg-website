import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://127.0.0.1:4173/buurt";
const OUT = path.join(process.cwd(), "artifacts", "kiosk-attract-redesign");

const shots = [
  { name: "attract-390x844", viewport: { width: 390, height: 844 } },
  { name: "attract-1080x1920", viewport: { width: 1080, height: 1920 } },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.viewport });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(".kiosk-attract-headline", { timeout: 15_000 });
  await page.waitForSelector(".kiosk-attract-map-counter-num", { timeout: 15_000 });
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(OUT, `${shot.name}.png`),
    fullPage: false,
  });
  await page.close();
  console.log(`wrote ${shot.name}.png`);
}

await browser.close();
console.log(`capture-kiosk-attract-redesign: OK → ${OUT}`);
