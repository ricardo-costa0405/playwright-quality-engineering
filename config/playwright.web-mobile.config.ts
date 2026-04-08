import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || 'https://www.saucedemo.com';
const TIMEOUT = parseInt(process.env.TIMEOUT || '30000');
const EXPECT_TIMEOUT = parseInt(process.env.EXPECT_TIMEOUT || '10000');
const HEADLESS = process.env.HEADLESS !== 'false';
const CI = process.env.CI === 'true';
const isLocalhost = BASE_URL.includes('localhost');

/**
 * Web Mobile Platform Configuration
 * Mobile device emulation: iPhone, Pixel, Galaxy
 * Touch support and mobile-specific viewports
 */
export default defineConfig({
  testDir: './tests/web-mobile/specs',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 4 : undefined,
  reporter: [
    ['junit', { outputFile: '../reports/junit/web-mobile-results.xml' }],
    ['html',  { outputFolder: '../reports/html/web-mobile', open: 'never' }],
    ['json',  { outputFile: '../reports/failures.json' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 0,
    navigationTimeout: 0,
  },

  timeout: TIMEOUT,
  expect: {
    timeout: EXPECT_TIMEOUT,
  },

  webServer: isLocalhost
    ? {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !CI,
      }
    : undefined,

  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        recordVideo: {
          dir: 'reports/screencast-debug/mobile-chrome/',
          size: { width: 393, height: 851 },
        },
      },
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 13 Pro'],
        recordVideo: {
          dir: 'reports/screencast-debug/mobile-safari/',
          size: { width: 390, height: 844 },
        },
      },
    },

    {
      name: 'Galaxy S21',
      use: {
        ...devices['Galaxy S21'],
        recordVideo: {
          dir: 'reports/screencast-debug/galaxy-s21/',
          size: { width: 360, height: 800 },
        },
      },
    },
  ],
});
