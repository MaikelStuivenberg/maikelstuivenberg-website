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
  const pageEarly = await browser.newPage({ viewport: shot.viewport });
  await pageEarly.goto(BASE, { waitUntil: "domcontentloaded" });
  await pageEarly.waitForSelector(".kiosk-attract-headline", { timeout: 15_000 });
  await pageEarly.waitForTimeout(500);
  const earlyFile = `${shot.name}-t0p5.png`;
  await pageEarly.screenshot({
    path: path.join(OUT, earlyFile),
    fullPage: false,
  });
  await pageEarly.close();
  console.log(`wrote ${earlyFile}`);

  const pageFinal = await browser.newPage({ viewport: shot.viewport });
  await pageFinal.goto(BASE, { waitUntil: "networkidle" });
  await pageFinal.waitForSelector(".kiosk-attract-headline", { timeout: 15_000 });
  await pageFinal.waitForFunction(
    () => {
      const el = document.querySelector(".kiosk-attract-map-counter-num");
      if (!el) return false;
      const text = (el.textContent ?? "").trim();
      return text.length > 0 && text !== "0" && text !== "…";
    },
    { timeout: 15_000 },
  );
  await pageFinal.waitForTimeout(1600);
  const finalFile = `${shot.name}-final.png`;
  await pageFinal.screenshot({
    path: path.join(OUT, finalFile),
    fullPage: false,
  });
  await pageFinal.close();
  console.log(`wrote ${finalFile}`);
}

await browser.close();
console.log(`capture-kiosk-attract-redesign: OK → ${OUT}`);
