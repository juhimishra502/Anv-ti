import { test, expect, type Page } from "@playwright/test";

// Visual-regression screenshots for the key screens. Reduced-motion (config) disables
// animation so snapshots are stable. Authenticated screens seed a demo case via the API
// (cookies are shared with the page context). First run: --update-snapshots.

async function setLocale(page: Page, locale: string) {
  await page.addInitScript((loc) => {
    try { localStorage.setItem("id_locale", loc); } catch { /* ignore */ }
  }, locale);
}

async function seedCase(page: Page): Promise<string> {
  await page.request.post("/api/auth/demo", { data: { displayName: "Visual Test" } });
  const created = await (await page.request.post("/api/cases", { data: { title: "Visual test estate" } })).json();
  const id: string = created.case.id;
  await page.request.patch(`/api/cases/${id}/deceased`, {
    data: { residence_state: "UP", death_state: "UP", death_registered: "yes", death_certificate: "available" },
  });
  await page.request.post(`/api/cases/${id}/assets`, {
    data: { asset_type: "bank_deposit", service: "bank_claim", label: "SBI savings", institution: "State Bank of India", location: { state_code: "UP" } },
  });
  await page.request.post(`/api/cases/${id}/assets`, {
    data: { asset_type: "life_insurance", service: "insurance_claim", label: "LIC policy", institution: "LIC" },
  });
  return id;
}

async function settle(page: Page, ms = 1200) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

test.describe("landing", () => {
  for (const loc of ["en", "hi", "ta", "ur"]) {
    test(`landing (${loc})`, async ({ page }) => {
      await setLocale(page, loc);
      await page.goto("/");
      await settle(page, loc === "en" ? 800 : 1600); // non-en waits for shipped dict + render
      await expect(page).toHaveScreenshot(`landing-${loc}.png`);
    });
  }

  test("auth modal", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto("/");
    await settle(page, 600);
    await page.getByRole("button", { name: /start your case/i }).first().click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("auth-modal.png");
  });
});

test.describe("case flow", () => {
  test("questionnaire", async ({ page }) => {
    await setLocale(page, "en");
    const id = await seedCase(page);
    await page.goto(`/onboarding/${id}`);
    await settle(page, 700);
    await expect(page).toHaveScreenshot("questionnaire.png");
  });

  test("roadmap", async ({ page }) => {
    await setLocale(page, "en");
    const id = await seedCase(page);
    await page.goto(`/case/${id}`);
    await settle(page, 1800);
    await expect(page).toHaveScreenshot("roadmap.png", { fullPage: true });
  });

  test("roadmap step detail", async ({ page }) => {
    await setLocale(page, "en");
    const id = await seedCase(page);
    await page.goto(`/case/${id}`);
    await settle(page, 1500);
    const showBtn = page.getByRole("button", { name: /show details/i }).first();
    if (await showBtn.count()) { await showBtn.click(); await settle(page, 1200); }
    await expect(page).toHaveScreenshot("roadmap-step-detail.png", { fullPage: true });
  });

  test("chatbot open", async ({ page }) => {
    await setLocale(page, "en");
    const id = await seedCase(page);
    await page.goto(`/case/${id}`);
    await settle(page, 1200);
    const ask = page.getByRole("button", { name: /ask the assistant/i }).first();
    if (await ask.count()) { await ask.click(); await page.waitForTimeout(500); }
    await expect(page).toHaveScreenshot("chatbot-open.png");
  });
});
