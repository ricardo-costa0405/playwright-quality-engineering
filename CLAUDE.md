# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies and browsers
npm ci
npm run install:browsers

# Run tests
npm test                    # All desktop tests (Chromium, Firefox, WebKit)
npm run test:web            # Desktop tests only
npm run test:web:headed     # Desktop tests, visible browser
npm run test:web:debug      # Desktop tests with Playwright Inspector
npm run test:web-mobile     # Mobile emulation (Pixel 5, iPhone 13, Galaxy S24)
npm run test:all            # Desktop + mobile sequentially
npm run test:smoke          # @smoke-tagged tests, Chromium only
npm run test:parallel       # 4 parallel workers

# Run a single test file
npx playwright test tests/web/specs/swaglabs-login.spec.ts --config config/playwright.web.config.ts

# Run a single test by title
npx playwright test -g "user can login" --config config/playwright.web.config.ts

# Code quality
npm run lint
npm run format
npm run type-check
npm run validate:aaa        # Validate Arrange-Act-Assert pattern
npm run validate:timeouts   # Scan for forbidden hardcoded waits

# Reports
npm run report:serve        # Open HTML report
npm run report:allure       # Generate and open Allure report
npm run analyze:failures    # Analyze test failures
```

## Architecture

**Multi-config setup:** `playwright.config.ts` re-exports `config/playwright.web.config.ts`. Mobile tests use `config/playwright.web-mobile.config.ts` and are run separately. Both configs use the same reporter strategy (JUnit XML + HTML + JSON).

**Page Object Model:**
- `tests/web/pages/BasePage.ts` — abstract base with state-based wait helpers (`clickAndWait`, `fillInput`, `waitForElement`, `waitForAPICall`). All methods use `AntiTimeoutGuard` — zero hardcoded timeouts.
- `tests/web/pages/saucedemo/` — one class per page, extending `BasePage`.
- `tests/web/fixtures/saucedemo-fixtures.ts` — Playwright fixtures that set up pre-authenticated page states (e.g., `inventoryPage` fixture starts already logged in as `standard_user`).

**Path aliases** (defined in `tsconfig.json`):
- `@pages/*` → `tests/web/pages/*`
- `@fixtures/*` → `tests/web/fixtures/*`
- `@utils/*` → `utils/*`
- `@config/*` → `config/*`

**Test data:** Use `utils/helpers/data-generator.ts` (Faker-based) for dynamic test data.

**AI agent framework** lives in `utils/ai/` with sub-agents for analysis, execution, generation, healing, and orchestration. See `utils/ai/ARCHITECTURE.md` for design details.

## Core Constraints

**Zero hardcoded timeouts** — ESLint actively bans `waitForTimeout()`, `setTimeout()`, and `sleep()`. All waits must be state-based. `utils/patterns/anti-timeout-guard.ts` provides approved wait strategies.

**AAA pattern is mandatory** — every test must have visible `// ==================== ARRANGE ====================`, `// ==================== ACT ====================`, `// ==================== ASSERT ====================` section headers. Run `npm run validate:aaa` to check compliance.

**Selector priority:**
1. `data-test` attributes (required for new selectors)
2. Semantic roles (`getByRole`)
3. Visible text (`getByText`)
4. CSS classes (avoid — fragile)

**TypeScript strict mode** is enabled. No `any` types. Explicit return types required on all functions. Max function complexity: 10, max function lines: 50.

## CI/CD

Three GitHub Actions workflows in `.github/workflows/`:
- `web-tests.yml` — matrix across Chromium/Firefox/WebKit, triggers on push/PR/daily 2 AM UTC
- `web-mobile-tests.yml` — matrix across Pixel 5/iPhone 13/Galaxy S24, triggers on push/PR/daily 3 AM UTC
- `smoke-tests.yml` — Chromium only, manual + push/PR, 15-minute timeout

All workflows use concurrency groups to cancel in-progress runs on the same PR/branch. CI mode sets `CI=true` which enables 2 retries and 4 workers.

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://www.saucedemo.com` | Target app URL |
| `HEADLESS` | `true` | Browser visibility |
| `TIMEOUT` | `30000` | Default action timeout (ms) |
| `EXPECT_TIMEOUT` | `10000` | Assertion timeout (ms) |
| `CI` | — | Enables retries + workers |

No `.env` setup needed — this framework targets Swag Labs exclusively and all defaults are pre-configured in `playwright.config.ts`.
