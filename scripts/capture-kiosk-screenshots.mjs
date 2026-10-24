import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://localhost:4173/buurt";

const VIEWPORTS = [
  { label: "1080x1920", width: 1080, height: 1920 },
  { label: "390x844", width: 390, height: 844 },
];

const OUT_ROOT = process.env.KIOSK_SHOT_OUT ?? "docs/kiosk-screenshots/after";

async function captureFlow(page, outDir) {
  const onlyAttractChoice = process.env.KIOSK_SHOT_ATTRACT_CHOICE === "1";

  async function snap(name) {
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  }

  await page.goto(BASE, { waitUntil: "networkidle" });
  await snap("01-attract");

  await page.locator(".kiosk-attract").click();
  await snap("02-choose");

  if (onlyAttractChoice) return;

  await page.getByRole("button", { name: /Zoek bij mij|Search near/i }).click();
  await snap("03-search-keyboard");

  await page.getByRole("button", { name: /Terug|Back/i }).click();
  await page
    .getByRole("button", { name: /Laat alle plekken|Show all places/i })
    .click();
  await page.waitForTimeout(1200);
  await snap("04-map-all");

  await page
    .getByRole("button", { name: /Kom in actie|Take action/i })
    .click();
  await snap("05-signup");
}

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const outDir = `${OUT_ROOT}/${vp.label}`;
  await mkdir(outDir, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  await captureFlow(page, outDir);
  await page.close();
  console.log(`Saved ${outDir}/`);
}

await browser.close();
