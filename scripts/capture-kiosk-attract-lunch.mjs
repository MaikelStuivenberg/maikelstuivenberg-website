import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://127.0.0.1:4173/buurt";
const OUT = path.join(process.cwd(), "artifacts", "kiosk-attract-lunch");

const shots = [
  { name: "attract-lunch-360x640", viewport: { width: 360, height: 640 } },
  { name: "attract-lunch-390x844", viewport: { width: 390, height: 844 } },
  {
    name: "attract-lunch-390x844-en",
    viewport: { width: 390, height: 844 },
    locale: "en",
  },
  {
    name: "attract-lunch-390x844-rotate90",
    viewport: { width: 390, height: 844 },
    url: `${BASE}?rotate=90`,
  },
  { name: "attract-lunch-1080x1920", viewport: { width: 1080, height: 1920 } },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.viewport });
  await page.goto(shot.url ?? BASE, { waitUntil: "networkidle" });
  if (shot.locale === "en") {
    await page.locator("button.kiosk-lang-btn", { hasText: /^en$/i }).click();
    await page.waitForTimeout(250);
  }
  await page.waitForSelector(".kiosk-lunch-lockup", { timeout: 15_000 });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT, `${shot.name}.png`),
    fullPage: false,
  });
  await page.close();
  console.log(`wrote ${shot.name}.png`);
}

await browser.close();
console.log(`capture-kiosk-attract-lunch: OK → ${OUT}`);
