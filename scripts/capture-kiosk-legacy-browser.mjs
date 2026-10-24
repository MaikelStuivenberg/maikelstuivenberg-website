import fs from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

/** Install legacy Chromium once: `npx @puppeteer/browsers install chromium@800071` */
const BASE = process.env.KIOSK_URL ?? "http://127.0.0.1:4173/buurt";
const OUT = path.join(process.cwd(), "artifacts", "kiosk-legacy-browser");
const VIEWPORT = { width: 390, height: 844 };

const LEGACY_CHROMIUM =
  process.env.LEGACY_CHROMIUM_PATH ??
  path.join(process.cwd(), "chromium", "linux-800071", "chrome-linux", "chrome");

async function domClick(page, selector) {
  await page.waitForFunction(
    (sel) => Boolean(document.querySelector(sel)),
    selector,
    { timeout: 20_000 },
  );
  await page.evaluate((sel) => {
    document.querySelector(sel)?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  }, selector);
}

async function domClickButtonMatching(page, pattern) {
  await page.waitForFunction(
    (reSource) => {
      const re = new RegExp(reSource, "i");
      return [...document.querySelectorAll("button")].some((b) =>
        re.test(b.textContent ?? ""),
      );
    },
    pattern,
    { timeout: 20_000 },
  );
  await page.evaluate((reSource) => {
    const re = new RegExp(reSource, "i");
    const btn = [...document.querySelectorAll("button")].find((b) =>
      re.test(b.textContent ?? ""),
    );
    btn?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }, pattern);
}

async function openAttract(page) {
  await domClick(page, ".kiosk-attract");
}

async function openChoose(page) {
  await openAttract(page);
}

async function openSearch(page) {
  await openAttract(page);
  await domClickButtonMatching(
    page,
    "Zoek in jouw buurt|Search your neighbourhood",
  );
}

async function openSignup(page) {
  await openAttract(page);
  await domClickButtonMatching(page, "Laat alle plekken zien|Show all places");
  await page.waitForFunction(
    () => Boolean(document.querySelector(".kiosk-map-canvas")),
    { timeout: 20_000 },
  );
  await domClickButtonMatching(
    page,
    "Kom in actie in je buurt|Take action in your neighbourhood",
  );
  await page.waitForFunction(
    () => Boolean(document.querySelector(".kiosk-screen--signup")),
    { timeout: 15_000 },
  );
}

const shots = [
  { name: "attract", run: openAttract },
  { name: "choose", run: openChoose },
  { name: "search-keyboard", run: openSearch },
  { name: "signup", run: openSignup },
];

await mkdir(OUT, { recursive: true });

const hasLegacyChromium = fs.existsSync(LEGACY_CHROMIUM);

async function captureSet(browserLabel, launchOptions) {
  const browser = await chromium.launch(launchOptions);
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: VIEWPORT });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await shot.run(page);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(OUT, `${shot.name}-${browserLabel}.png`),
      fullPage: false,
    });
    await page.close();
    console.log(`wrote ${shot.name}-${browserLabel}.png`);
  }
  await browser.close();
}

await captureSet("modern-playwright-chromium", { channel: "chromium", headless: true });

async function captureLegacyViaCdp() {
  const debugPort = 9333;
  const chrome = spawn(
    LEGACY_CHROMIUM,
    [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      `--remote-debugging-port=${debugPort}`,
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  await new Promise((resolve) => setTimeout(resolve, 900));
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${debugPort}`);
  const context =
    browser.contexts()[0] ??
    await browser.newContext({ viewport: VIEWPORT });
  const page = context.pages()[0] ?? await context.newPage();
  await page.setViewportSize(VIEWPORT);

  for (const shot of shots) {
    await page.goto(BASE, { waitUntil: "load", timeout: 45_000 });
    await page.waitForTimeout(2500);
    await shot.run(page);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(OUT, `${shot.name}-legacy-chromium-86.png`),
    });
    console.log(`wrote ${shot.name}-legacy-chromium-86.png`);
  }

  await browser.close();
  chrome.kill("SIGTERM");
}

if (hasLegacyChromium) {
  await captureLegacyViaCdp();
}

console.log(`capture-kiosk-legacy-browser: OK → ${OUT}`);
