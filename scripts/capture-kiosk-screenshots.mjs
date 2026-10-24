import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://localhost:4173/buurt";
const OUT = "docs/kiosk-screenshots";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
});

async function snap(name) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

await page.goto(BASE, { waitUntil: "networkidle" });
await snap("01-attract");

await page.locator(".kiosk-attract").click();
await snap("02-choose");

await page.getByRole("button", { name: /Zoek bij mij|Search near/i }).click();
await snap("03-search-keyboard");

await page.getByRole("button", { name: /Terug|Back/i }).click();
await page.getByRole("button", { name: /Laat alle plekken|Show all places/i }).click();
await page.waitForTimeout(1200);
await snap("04-map-all");

await page
  .getByRole("button", { name: /Kom in actie|Take action/i })
  .click();
await snap("05-signup");

await browser.close();
console.log(`Saved screenshots to ${OUT}/`);
