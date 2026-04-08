import { v4 as uuidv4 } from 'uuid';
import { MessageBus, AgentMessage, MessageType } from './MessageBus';
import { Logger } from 'winston';

/**
 * Agent Status and State
 */
export type AgentStatus = 'IDLE' | 'BUSY' | 'PAUSED' | 'ERROR';

export interface AgentState {
  status: AgentStatus;
  currentTask: string | null;
  uptime: number;
  totalTasksProcessed: number;
  successCount: number;
  errorCount: number;
  lastActivity: number;
}

export interface AgentTask {
  taskId: string;
  assignedAgent: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  dependencies: string[];
  metadata: Record<string, any>;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: Error;
}

export interface AgentResult {
  taskId: string;
  agentId: string;
  success: boolean;
  data?: Record<string, any>;
  error?: Error;
  duration: number;
}

/**
 * Base Class for All Agents
 * Provides common functionality: messaging, state management, logging
 */
export abstract class AgentBase {
  protected id: string;
  protected messageBus: MessageBus;
  protected state: AgentState;
  protected logger?: Logger;
  private startTime: number;

  constructor(id: string, messageBus: MessageBus, logger?: Logger) {
    this.id = id;
    this.messageBus = messageBus;
    this.logger = logger;
    this.startTime = Date.now();

    this.state = {
      status: 'IDLE',
      currentTask: null,
      uptime: 0,
      totalTasksProcessed: 0,
      successCount: 0,
      errorCount: 0,
      lastActivity: Date.now(),
    };

    this.setupMessageListener();
  }

  /**
   * Get agent ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get current agent state
   */
  getState(): AgentState {
    return {
      ...this.state,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Set agent status
   */
  setStatus(status: AgentStatus): void {
    this.state.status = status;
    this.state.lastActivity = Date.now();
  }

  /**
   * Abstract execute method - must be implemented by subclasses
   */
  abstract execute(task: AgentTask): Promise<AgentResult>;

  /**
   * Send message to another agent
   */
  protected async sendMessage(
    to: string,
    type: MessageType,
    payload: Record<string, any>
  ): Promise<string> {
    const correlationId = uuidv4();

    const message: Omit<AgentMessage, 'messageId'> = {
      from: this.id,
      to,
      type,
      payload,
      timestamp: Date.now(),
      correlationId,
    };

    this.logger?.debug(`Agent ${this.id} sending message to ${to}:`, {
      type,
      correlationId,
    });

    await this.messageBus.publish(message);

    return correlationId;
  }

  /**
   * Wait for response from another agent
   */
  protected async waitForResponse(
    correlationId: string,
    timeout: number = 30000
  ): Promise<AgentMessage> {
    return this.messageBus.waitForMessage(correlationId, timeout);
  }

  /**
   * Setup message listening
   */
  private setupMessageListener(): void {
    this.messageBus.subscribe(this.id, async (message: AgentMessage) => {
      if (message.type === 'REQUEST') {
        this.logger?.debug(`Agent ${this.id} received request:`, message);
        await this.handleRequest(message);
      }
    });
  }

  /**
   * Handle incoming request - override in subclasses if needed
   */
  protected async handleRequest(message: AgentMessage): Promise<void> {
    const responsePayload = {
      originalMessageId: message.messageId,
      received: true,
      timestamp: Date.now(),
    };

    await this.sendMessage(message.from, 'RESPONSE', responsePayload);
  }

  /**
   * Execute task with proper state management
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    try {
      this.state.currentTask = task.taskId;
      this.state.status = 'BUSY';
      task.startedAt = Date.now();

      this.logger?.info(
        `Agent ${this.id} starting task ${task.taskId} (priority: ${task.priority})`
      );

      const result = await this.execute(task);

      this.state.totalTasksProcessed++;
      if (result.success) {
        this.state.successCount++;
        this.logger?.info(
          `Agent ${this.id} completed task ${task.taskId} successfully`
        );
      } else {
        this.state.errorCount++;
        this.logger?.error(
          `Agent ${this.id} failed task ${task.taskId}:`,
          result.error
        );
      }

      this.state.currentTask = null;
      this.state.status = 'IDLE';

      return result;
    } catch (error) {
      this.state.errorCount++;
      this.state.currentTask = null;
      this.state.status = 'IDLE';

      this.logger?.error(`Agent ${this.id} error executing task:`, error);

      return {
        taskId: task.taskId,
        agentId: this.id,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - (task.startedAt || Date.now()),
      };
    }
  }

  /**
   * Cleanup agent resources
   */
  async shutdown(): Promise<void> {
    this.setStatus('PAUSED');
    this.logger?.info(
      `Agent ${this.id} shutting down. Stats:`,
      this.getState()
    );
  }
}
