import 'dotenv/config';

/**
 * Environment Manager
 * Centralized handling of environment configuration
 */
export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: Record<string, string | number | boolean>;

  private constructor() {
    this.config = {
      BASE_URL: process.env.BASE_URL || 'https://example.com',
      API_URL: process.env.API_URL || 'https://api.example.com',
      TIMEOUT: parseInt(process.env.TIMEOUT || '30000'),
      EXPECT_TIMEOUT: parseInt(process.env.EXPECT_TIMEOUT || '10000'),
      HEADLESS: process.env.HEADLESS !== 'false',
      CI: process.env.CI === 'true',
      DEBUG: process.env.DEBUG === 'true',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      SCREENCAST_ENABLED: process.env.SCREENCAST_ENABLED === 'true',
      AUTO_HEAL_ON_FAILURE:
        process.env.AUTO_HEAL_ON_FAILURE !== 'false',
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }

    return EnvironmentManager.instance;
  }

  /**
   * Get configuration value
   */
  get<T extends string | number | boolean>(
    key: string,
    defaultValue?: T
  ): T {
    const value = this.config[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new Error(`Configuration key not found: ${key}`);
    }

    return value as T;
  }

  /**
   * Get all configuration
   */
  getAll(): Record<string, string | number | boolean> {
    return { ...this.config };
  }

  /**
   * Check if running in CI environment
   */
  isCIEnvironment(): boolean {
    return this.get<boolean>('CI');
  }

  /**
   * Get base URL for tests
   */
  getBaseUrl(): string {
    return this.get<string>('BASE_URL');
  }

  /**
   * Get API URL
   */
  getApiUrl(): string {
    return this.get<string>('API_URL');
  }

  /**
   * Get timeout in milliseconds
   */
  getTimeout(): number {
    return this.get<number>('TIMEOUT');
  }

  /**
   * Print configuration (safe - no secrets)
   */
  printConfig(): void {
    console.log('Environment Configuration:');
    for (const [key, value] of Object.entries(this.config)) {
      console.log(`  ${key}: ${value}`);
    }
  }
}

export default EnvironmentManager;
