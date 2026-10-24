import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://127.0.0.1:4173/buurt";

const browser = await chromium.launch();

async function testRotation(viewport, query, label) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${BASE}${query}`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("gidb-kiosk-rotate"));
  if (query) {
    await page.goto(`${BASE}${query}`, { waitUntil: "networkidle" });
  }

  const dims = await page.evaluate(() => {
    const stage = document.querySelector(".kiosk-rotate-stage");
    const kiosk = document.querySelector(".buurt-kiosk");
    return {
      stageW: stage?.getBoundingClientRect().width ?? 0,
      stageH: stage?.getBoundingClientRect().height ?? 0,
      scrollH: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
      appW: getComputedStyle(stage ?? document.body).getPropertyValue("--app-w"),
      appH: getComputedStyle(stage ?? document.body).getPropertyValue("--app-h"),
    };
  });

  assert.ok(dims.scrollH <= dims.innerH + 2, `${label}: page scroll`);
  assert.ok(dims.stageW > 0 && dims.stageH > 0, `${label}: stage size`);

  await page.getByRole("button", { name: /^en$/i }).click();
  await page.getByRole("button", { name: /^nl$/i }).click();
  await page.locator(".kiosk-attract").click();
  await page.getByRole("button", {
    name: /Zoek in jouw buurt|Search your neighbourhood/i,
  }).click();
  for (const d of "3511") {
    await page.locator("button.kiosk-key").filter({ hasText: d }).first().click();
  }
  await page.locator("button.kiosk-key.kiosk-key--submit").click();
  await page.waitForTimeout(2500);
  await page.getByRole("heading", {
    name: /In jouw buurt|In your neighbourhood/i,
  }).waitFor({
    timeout: 10000,
  });

  if (query.includes("rotate=90") || query.includes("rotate=270")) {
    const zoomIn = page.locator("button.kiosk-map-zoom-btn").first();
    await zoomIn.waitFor({ timeout: 3000 });
    await zoomIn.click();
  }

  await page.close();
  console.log(`${label}: OK`, dims.appW, dims.appH);
}

await testRotation(
  { width: 1920, height: 1080 },
  "?rotate=90",
  "rotate90",
);
await testRotation(
  { width: 1920, height: 1080 },
  "?rotate=270",
  "rotate270",
);
await testRotation(
  { width: 1080, height: 1920 },
  "",
  "native",
);
await testRotation(
  { width: 1920, height: 1080 },
  "",
  "landscape-no-param",
);

await browser.close();
console.log("verify-kiosk-rotation: OK");
