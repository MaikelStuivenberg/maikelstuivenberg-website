import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://127.0.0.1:4173/buurt";

const viewports = [
  { w: 1080, h: 1920, name: "stand" },
  { w: 390, h: 844, name: "phone" },
  { w: 360, h: 640, name: "phone-small" },
];

const browser = await chromium.launch();
let failed = false;

for (const vp of viewports) {
  const page = await browser.newPage({
    viewport: { width: vp.w, height: vp.h },
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const metrics = await page.evaluate(() => {
    const attract = document.querySelector(".kiosk-attract");
    const map = document.querySelector(".kiosk-attract-map-panel");
    const cta = document.querySelector(".kiosk-attract-cta");
    const question = document.querySelector(".kiosk-attract-question");
    const main = document.querySelector(".kiosk-main");
    if (!attract || !map || !cta || !main || !question) return null;
    const mainR = main.getBoundingClientRect();
    const attractR = attract.getBoundingClientRect();
    const mapR = map.getBoundingClientRect();
    const ctaR = cta.getBoundingClientRect();
    const questionR = question.getBoundingClientRect();
    const attractEl = document.querySelector(".kiosk-attract");
    return {
      mainHeight: mainR.height,
      attractHeight: attractR.height,
      mapHeight: mapR.height,
      mapRatio: mapR.height / attractR.height,
      ctaInsetFromAttractBottom: attractR.bottom - ctaR.bottom,
      attractBottomGap: mainR.bottom - attractR.bottom,
      mapToQuestionGap: questionR.top - mapR.bottom,
      pageScrolls:
        document.documentElement.scrollHeight > window.innerHeight + 2,
      attractScrolls:
        !!attractEl &&
        attractEl.scrollHeight > attractEl.clientHeight + 2,
    };
  });
  await page.close();
  if (!metrics) {
    console.error(`${vp.name}: missing elements`);
    failed = true;
    continue;
  }
  console.log(vp.name, metrics);
  if (metrics.attractBottomGap > 24) {
    console.error(`${vp.name}: attract does not fill main (gap ${metrics.attractBottomGap}px)`);
    failed = true;
  }
  if (vp.w >= 1080 && metrics.ctaInsetFromAttractBottom > 80) {
    console.error(
      `${vp.name}: CTA not low enough on stand (inset ${metrics.ctaInsetFromAttractBottom}px)`,
    );
    failed = true;
  }
  if (vp.w >= 1080 && metrics.mapRatio < 0.45) {
    console.error(`${vp.name}: map too small (${(metrics.mapRatio * 100).toFixed(1)}% of attract)`);
    failed = true;
  }
  if (vp.w >= 1080 && metrics.mapToQuestionGap > 56) {
    console.error(
      `${vp.name}: excessive gap between map and question (${metrics.mapToQuestionGap.toFixed(1)}px)`,
    );
    failed = true;
  }
  if (metrics.pageScrolls || metrics.attractScrolls) {
    console.error(`${vp.name}: vertical scroll on attract`);
    failed = true;
  }
}

await browser.close();
if (failed) process.exit(1);
console.log("check-attract-layout: OK");
