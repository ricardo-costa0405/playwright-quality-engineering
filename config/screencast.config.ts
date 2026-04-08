/**
 * Screencast Configuration for Playwright 1.59.0
 * Enables recording, analysis, and agent learning from visual data
 */
export const screencastConfig = {
  // Enable screencast for debugging and agent analysis
  enabled: process.env.SCREENCAST_ENABLED === 'true' || process.env.CI === 'true',

  // Screencast options for browser context
  contextOptions: {
    recordVideo: {
      dir: 'reports/screencast-debug/',
      size: { width: 1920, height: 1080 },
    },
  },

  // Automatic cleanup after successful tests
  preserveOnSuccess: process.env.PRESERVE_SCREENCAST === 'true',
  preserveOnFailure: true,

  // Agent analysis configuration
  agentAnalysis: {
    enabled: true,
    // Run healing agent on failures
    autoHeal: process.env.AUTO_HEAL_ON_FAILURE !== 'false',
    // Save screenshots at assertion points
    captureAssertions: true,
  },

  // Frame extraction for analysis
  analysis: {
    extractFramesAtInterval: 100, // 100ms
    minFrameScore: 0.3,
    enableOCR: false,
  },
};

/**
 * Export screencast context options
 * Ready to merge into Playwright context creation
 */
export function getScreencastContextOptions(): Record<string, any> {
  if (!screencastConfig.enabled) {
    return {};
  }

  return {
    recordVideo: screencastConfig.contextOptions.recordVideo,
  };
}
