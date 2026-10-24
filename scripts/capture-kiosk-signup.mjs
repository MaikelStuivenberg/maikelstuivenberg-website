import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://127.0.0.1:4173/buurt";
const OUT = path.join(process.cwd(), "artifacts", "kiosk-signup");

async function openSignup(page) {
  await page.locator(".kiosk-attract").click();
  await page
    .getByRole("button", { name: /Laat alle plekken zien|Show all places/i })
    .click();
  await page.waitForSelector(".kiosk-map-canvas", { timeout: 15_000 });
  await page
    .getByRole("button", { name: /Kom in actie in je buurt|Take action in your neighbourhood/i })
    .click();
  await page.waitForSelector(".kiosk-screen--signup", { timeout: 10_000 });
}

const shots = [
  { name: "signup-390x844", viewport: { width: 390, height: 844 } },
  { name: "signup-360x640", viewport: { width: 360, height: 640 } },
  { name: "signup-1080x1920", viewport: { width: 1080, height: 1920 } },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.viewport });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await openSignup(page);
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT, `${shot.name}.png`),
    fullPage: false,
  });
  await page.close();
  console.log(`wrote ${shot.name}.png`);
}

await browser.close();
console.log(`capture-kiosk-signup: OK → ${OUT}`);
