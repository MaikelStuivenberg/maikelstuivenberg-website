import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.KIOSK_URL ?? "http://localhost:4173/buurt";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

let supabasePost = null;
await page.route("**/gidb_kiosk_signups", async (route) => {
  if (route.request().method() === "POST") {
    supabasePost = JSON.parse(route.request().postData() ?? "{}");
    await route.fulfill({ status: 201, body: "" });
    return;
  }
  await route.continue();
});

await page.goto(BASE, { waitUntil: "networkidle" });

async function tapKey(ch) {
  const escaped = ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await page
    .locator("button.kiosk-key")
    .filter({ hasText: new RegExp(`^${escaped}$`) })
    .first()
    .click();
}

// Search flow: 3521 + keyboard Zoek
await page.locator(".kiosk-attract").click();
await page.getByRole("button", { name: /Zoek bij mij|Search near/i }).click();
for (const ch of "3521") {
  await tapKey(ch);
}
await page
  .locator("button")
  .filter({ hasText: /^Zoek$|^Search$/ })
  .last()
  .click({ force: true });
await page.waitForTimeout(1500);
assert.ok(
  page.url().includes("/buurt"),
  "still on kiosk after search",
);
await page.getByRole("heading", { name: /Dichtbij|Near you/i }).waitFor({
  timeout: 8000,
});

// Sign-up + email keyboard
await page.getByRole("button", { name: /Kom in actie|Take action/i }).click();
await page.getByRole("button", { name: /e-mail|email/i }).click();

for (const ch of "test.user-1+x") {
  await tapKey(ch);
}
await page.getByRole("button", { name: "@gmail.com", exact: true }).click();

const displayed = await page
  .getByRole("button", { name: /e-mail|email/i })
  .innerText();
assert.equal(displayed.includes("test.user-1+x@gmail.com"), true, displayed);

await page.getByRole("button", { name: /naam|name/i }).click();
for (const ch of "anne-marie") {
  await tapKey(ch);
}
await tapKey("'");
await tapKey("s");
await tapKey("o");
await tapKey("u");
await tapKey("z");
await tapKey("a");
await page.locator('input[type="checkbox"]').check({ force: true });
await page.getByRole("button", { name: /Versturen|Send/i }).click();
await page.waitForTimeout(1200);

assert.equal(supabasePost?.email, "test.user-1+x@gmail.com");
assert.equal(supabasePost?.name, "anne-marie'souza");
assert.equal(supabasePost?.consent, true);

console.log("verify-kiosk-flows: OK");
await browser.close();
