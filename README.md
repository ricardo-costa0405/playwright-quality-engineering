# Playwright Quality Engineering

> Production-grade E2E testing framework built on Playwright — multi-browser, zero flakiness, Page Object Model.

[![Web Tests](https://github.com/ricardo-costa0405/playwright-quality-engineering/actions/workflows/web-tests.yml/badge.svg)](https://github.com/ricardo-costa0405/playwright-quality-engineering/actions/workflows/web-tests.yml)
[![Mobile Tests](https://github.com/ricardo-costa0405/playwright-quality-engineering/actions/workflows/web-mobile-tests.yml/badge.svg)](https://github.com/ricardo-costa0405/playwright-quality-engineering/actions/workflows/web-mobile-tests.yml)

---

## What This Framework Does

- Runs E2E tests across **Chromium, Firefox, WebKit** and **mobile device emulation**
- Enforces **AAA (Arrange-Act-Assert)** structure on every test
- Eliminates flakiness with **zero hardcoded timeouts** — state-based waits only
- Generates **JUnit XML + HTML reports** ready for CI/CD
- Records **screencasts** on failure for instant debugging
- Ships with a **Page Object Model** for clean, maintainable selectors

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/ricardo-costa0405/playwright-quality-engineering.git
cd playwright-quality-engineering

# 2. Install
npm install
npm run install:browsers

# 3. Configure
cp .env.example .env

# 4. Run
npm run test:web
```

> Tests run against [Swag Labs](https://www.saucedemo.com) — a public demo app, no credentials required beyond `.env.example` defaults.

---

## Run Tests

```bash
# Desktop browsers (Chromium, Firefox, WebKit)
npm run test:web

# Mobile device emulation (Pixel 5, iPhone 13, Galaxy S21)
npm run test:web-mobile

# All platforms
npm run test:all

# Headed mode (watch the browser)
npm run test:web:headed

# Debug mode (Playwright Inspector)
npm run test:web:debug

# Smoke tests only
npm run test:smoke
```

---

## Project Structure

```
playwright-quality-engineering/
│
├── tests/
│   ├── web/
│   │   ├── specs/              # Test specifications (*.spec.ts)
│   │   │   ├── swaglabs-login.spec.ts
│   │   │   ├── swaglabs-inventory.spec.ts
│   │   │   ├── swaglabs-cart.spec.ts
│   │   │   ├── swaglabs-checkout.spec.ts
│   │   │   ├── swaglabs-product-details.spec.ts
│   │   │   └── user-variants/  # Edge-case user scenarios
│   │   ├── pages/              # Page Object Model
│   │   │   └── saucedemo/      # One class per page
│   │   └── fixtures/           # Custom Playwright fixtures
│   └── web-mobile/
│       └── specs/              # Mobile-specific smoke tests
│
├── config/
│   ├── playwright.web.config.ts        # Desktop: Chrome, Firefox, Safari
│   ├── playwright.web-mobile.config.ts # Mobile: Pixel, iPhone, Galaxy
│   └── screencast.config.ts            # Recording settings
│
├── utils/
│   ├── helpers/        # env-manager, data-generator
│   ├── patterns/       # AAA validator, anti-timeout guard, assertion builder
│   ├── reporters/      # Failure classifier (reads JSON → outputs Markdown)
│   └── screencast/     # Screencast manager
│
├── .github/workflows/  # CI/CD pipelines
├── .env.example        # Environment template — copy to .env
├── package.json
└── playwright.config.ts
```

---

## Core Principles

### 1. AAA Pattern — Every Test

```typescript
test('user can add product to cart', async ({ inventoryPage }) => {
  // ========== ARRANGE ==========
  await inventoryPage.navigate();

  // ========== ACT ==========
  await inventoryPage.addProductToCart('Sauce Labs Backpack');

  // ========== ASSERT ==========
  await expect(inventoryPage.cartBadge).toHaveText('1');
});
```

### 2. Zero Hardcoded Timeouts

```typescript
// ❌ NEVER
await page.waitForTimeout(2000);

// ✅ ALWAYS — wait for state
await expect(element).toBeVisible();
await page.waitForLoadState('networkidle');
await page.waitForResponse(url => url.includes('/api/'));
```

### 3. Selector Priority

```typescript
// 1st — data-test attributes (most stable)
page.locator('[data-test="login-button"]')

// 2nd — semantic roles
page.getByRole('button', { name: 'Login' })

// 3rd — visible text
page.getByText('Add to cart')

// Last resort — CSS classes (fragile, avoid)
page.locator('.btn-primary')
```

---

## Reports

```bash
# Open HTML report after a run
npm run report:serve

# Classify failures by root cause (reads reports/failures.json)
npm run analyze:failures:md

# Generate + open Allure report
npm run report:allure
```

Reports are written to `reports/` (gitignored — generated on each run).

---

## Code Quality

```bash
npm run lint              # ESLint
npm run format            # Prettier
npm run type-check        # TypeScript strict
npm run validate:aaa      # Verify AAA structure in all tests
npm run validate:timeouts # Scan for forbidden hardcoded waits
```

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

| Variable          | Default                        | Description                     |
|-------------------|--------------------------------|---------------------------------|
| `BASE_URL`        | `https://www.saucedemo.com`   | Target application URL          |
| `HEADLESS`        | `true`                         | Run browsers headless           |
| `TIMEOUT`         | `30000`                        | Test timeout (ms)               |
| `EXPECT_TIMEOUT`  | `10000`                        | Assertion timeout (ms)          |
| `CI`              | `false`                        | Enables CI mode (retries, workers) |

---

## CI/CD

GitHub Actions pipelines run on every push and daily at 2 AM UTC:

| Workflow              | Trigger            | Browsers                        |
|-----------------------|--------------------|---------------------------------|
| `web-tests.yml`       | push / PR / daily  | Chromium · Firefox · WebKit     |
| `web-mobile-tests.yml`| push / PR / daily  | Pixel 5 · iPhone 13 · Galaxy S21|
| `smoke-tests.yml`     | push / PR / manual | Chromium (fast, critical path)  |

Artifacts (JUnit XML, HTML reports, screenshots, traces) are uploaded on every run.

---

## Troubleshooting

**Tests timing out** — use `npm run test:web:debug` to open Playwright Inspector and step through the test.

**Browser launch fails** — run `npm run install:browsers` to reinstall Playwright browsers.

**Flaky test** — check for missing `await`, race conditions, or hardcoded waits. Run `npm run validate:timeouts` to find them.

---

## License

MIT
