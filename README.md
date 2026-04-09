# Playwright Framework

End-to-end test suite for [Swag Labs](https://www.saucedemo.com) built with Playwright and TypeScript.

Covers login, inventory, cart, checkout, product details, and mobile smoke tests across Chrome, Firefox, and Safari.

---

## Features

- Page Object Model with a shared `BasePage`
- Custom fixtures for authenticated page state
- Multi-browser: Chromium, Firefox, WebKit (desktop + mobile emulation)
- Zero hardcoded timeouts — ESLint enforces state-based waits
- AAA pattern (Arrange, Act, Assert) validated across all specs
- Three CI workflows: desktop, mobile, smoke (GitHub Actions)
- JUnit + HTML + Allure reporting

---

## Project Structure

```
.github/workflows/       CI pipelines (desktop, mobile, smoke)
config/                  Playwright configs per platform
fixtures/                Custom Playwright fixtures (authenticated pages)
pages/                   Page Object Model
  BasePage.ts
  saucedemo/
tests/
  web/specs/             Desktop browser specs
  web-mobile/specs/      Mobile emulation specs
utils/
  helpers/               env-manager, data-generator
  patterns/              AAA validator, timeout guard, assertion builder
  reporters/             Failure classifier
  ai/                    Agent orchestration (generator, healer, analyzer)
playwright.config.ts     Default config entry point
.env.example             Environment variable template
```

---

## Installation

```bash
npm install
npm run install:browsers
```

Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

---

## Running Tests

| Command | Description |
|---|---|
| `npm run test:web` | Desktop tests (Chromium, Firefox, WebKit) |
| `npm run test:web-mobile` | Mobile emulation (Pixel 5, iPhone 13, Galaxy S24) |
| `npm run test:all` | Desktop + mobile |
| `npm run test:smoke` | Smoke tests only (`@smoke` tag) |
| `npm run test:web:headed` | Desktop tests in headed mode |
| `npm run test:web:debug` | Desktop tests in debug mode |

---

## Reports

```bash
npm run report:serve      # Open Playwright HTML report
npm run report:allure     # Generate and open Allure report
```

---

## Code Quality

```bash
npm run lint              # ESLint
npm run format            # Prettier
npm run type-check        # TypeScript (no emit)
npm run validate:aaa      # Check AAA structure in all specs
npm run validate:timeouts # Detect hardcoded waits
```

---

## CI

Three GitHub Actions workflows run on push and pull requests to `main`:

- `web-tests.yml` — desktop browsers, matrix across 3 browsers
- `web-mobile-tests.yml` — mobile device emulation
- `smoke-tests.yml` — fast smoke pass, posts results as a PR comment

Artifacts (JUnit XML, HTML report, traces) are uploaded per run.
