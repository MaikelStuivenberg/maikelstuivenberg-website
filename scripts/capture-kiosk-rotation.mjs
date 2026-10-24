import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://127.0.0.1:4173/buurt";
const OUT = process.env.KIOSK_ROT_OUT ?? "docs/kiosk-screenshots/rotation";

async function flow(page, outDir, prefix) {
  async function snap(name) {
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${outDir}/${prefix}-${name}.png`,
      fullPage: false,
    });
  }

  await page.goto(BASE, { waitUntil: "networkidle" });
  await snap("attract");

  await page.locator(".kiosk-attract").click();
  await snap("choose");

  await page
    .getByRole("button", { name: /Laat alle plekken|Show all places/i })
    .click();
  await page.waitForTimeout(1200);
  await snap("map");

  await page.getByRole("button", { name: /Terug|Back/i }).first().click();
  await page
    .getByRole("button", { name: /Zoek in jouw buurt|Search your neighbourhood/i })
    .click();
  await snap("search");
}

const browser = await chromium.launch();

const scenarios = [
  {
    label: "native-1080x1920",
    width: 1080,
    height: 1920,
    query: "",
  },
  {
    label: "landscape-1920x1080-rotate90",
    width: 1920,
    height: 1080,
    query: "?rotate=90",
  },
  {
    label: "landscape-1920x1080-rotate270",
    width: 1920,
    height: 1080,
    query: "?rotate=270",
  },
  {
    label: "landscape-1920x1080-no-rotate",
    width: 1920,
    height: 1080,
    query: "",
  },
];

for (const sc of scenarios) {
  const outDir = `${OUT}/${sc.label}`;
  await mkdir(outDir, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: sc.width, height: sc.height },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}${sc.query}`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.removeItem("gidb-kiosk-rotate");
  });
  if (sc.query) {
    await page.goto(`${BASE}${sc.query}`, { waitUntil: "networkidle" });
  }
  await flow(page, outDir, sc.label);
  await page.close();
  console.log(`Saved ${outDir}/`);
}

await browser.close();
