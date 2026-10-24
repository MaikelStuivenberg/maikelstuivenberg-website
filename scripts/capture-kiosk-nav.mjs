import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://127.0.0.1:4173/buurt";
const OUT = path.join(process.cwd(), "artifacts", "kiosk-nav");

const shots = [
  {
    name: "choose-390x844",
    viewport: { width: 390, height: 844 },
    async run(page) {
      await page.locator(".kiosk-attract").click();
    },
  },
  {
    name: "search-390x844",
    viewport: { width: 390, height: 844 },
    async run(page) {
      await page.locator(".kiosk-attract").click();
      await page
        .getByRole("button", { name: /Zoek in jouw buurt|Search your neighbourhood/i })
        .click();
    },
  },
  {
    name: "choose-1080x1920",
    viewport: { width: 1080, height: 1920 },
    async run(page) {
      await page.locator(".kiosk-attract").click();
    },
  },
  {
    name: "map-sheet-390x844",
    viewport: { width: 390, height: 844 },
    async run(page) {
      await page.locator(".kiosk-attract").click();
      await page
        .getByRole("button", { name: /Laat alle plekken zien|Show all places/i })
        .click();
      await page.waitForSelector(".leaflet-interactive", { timeout: 20_000 });
      await page.locator(".leaflet-interactive").first().click({ force: true });
      await page.waitForSelector(".kiosk-map-sheet", { timeout: 10_000 });
    },
  },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.viewport });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await shot.run(page);
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT, `${shot.name}.png`),
    fullPage: false,
  });
  await page.close();
  console.log(`wrote ${shot.name}.png`);
}

await browser.close();
console.log(`capture-kiosk-nav: OK → ${OUT}`);
