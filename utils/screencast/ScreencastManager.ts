/**
 * Screencast Configuration and Manager
 * Handles video recording and analysis for debugging
 */
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ScreencastManager {
  private sessions: Map<string, ScreencastSession>;
  private outputDir: string;

  constructor(outputDir: string = 'reports/screencast-debug') {
    this.sessions = new Map();
    this.outputDir = outputDir;

    // Ensure directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Start a new screencast session
   */
  async startSession(options: ScreencastOptions): Promise<ScreencastSession> {
    const sessionId = uuidv4();

    const session = new ScreencastSession({
      id: sessionId,
      testId: options.testId,
      outputPath: path.join(
        this.outputDir,
        options.testId,
        `${sessionId}.webm`
      ),
    });

    // Ensure test-specific directory exists
    const testDir = path.dirname(session.outputPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ScreencastSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session for specific test
   */
  getSessionForTest(testId: string): ScreencastSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.testId === testId) {
        return session;
      }
    }

    return undefined;
  }

  /**
   * Cleanup sessions
   */
  async cleanup(preserveOnFailure: boolean): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (!preserveOnFailure || session.testPassed) {
        await session.delete();
      }

      this.sessions.delete(id);
    }
  }
}

export interface ScreencastOptions {
  testId: string;
}

/**
 * Screencast Session
 */
export class ScreencastSession {
  id: string;
  testId: string;
  outputPath: string;
  startTime: number;
  endTime?: number;
  testPassed: boolean = false;

  constructor(options: {
    id: string;
    testId: string;
    outputPath: string;
  }) {
    this.id = options.id;
    this.testId = options.testId;
    this.outputPath = options.outputPath;
    this.startTime = Date.now();
  }

  /**
   * Stop recording
   */
  async stop(): Promise<void> {
    this.endTime = Date.now();
  }

  /**
   * Delete recording file
   */
  async delete(): Promise<void> {
    if (fs.existsSync(this.outputPath)) {
      fs.unlinkSync(this.outputPath);
    }
  }

  /**
   * Get session duration
   */
  getDuration(): number {
    return (this.endTime || Date.now()) - this.startTime;
  }

  /**
   * Check if file exists
   */
  exists(): boolean {
    return fs.existsSync(this.outputPath);
  }
}
