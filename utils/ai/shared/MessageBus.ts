import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent Message Type Definitions
 */
export type MessageType = 'REQUEST' | 'RESPONSE' | 'NOTIFICATION' | 'ERROR';

export interface AgentMessage {
  from: string;
  to: string;
  type: MessageType;
  payload: Record<string, any>;
  timestamp: number;
  correlationId: string;
  messageId: string;
}

/**
 * Message Bus for inter-agent communication
 * Enables publish-subscribe pattern for distributed agent coordination
 */
export class MessageBus extends EventEmitter {
  private messageQueue: Map<string, AgentMessage[]>;
  private subscribers: Map<string, Set<(msg: AgentMessage) => void>>;
  private responseWaiters: Map<string, (msg: AgentMessage) => void>;

  constructor() {
    super();
    this.messageQueue = new Map();
    this.subscribers = new Map();
    this.responseWaiters = new Map();
  }

  /**
   * Initialize message bus
   */
  async initialize(): Promise<void> {
    this.emit('initialized');
  }

  /**
   * Publish message to specific agent or broadcast
   */
  async publish(message: Omit<AgentMessage, 'messageId'>): Promise<void> {
    const fullMessage: AgentMessage = {
      ...message,
      messageId: uuidv4(),
    };

    // Add to queue
    const targetQueue = this.messageQueue.get(message.to) || [];
    targetQueue.push(fullMessage);
    this.messageQueue.set(message.to, targetQueue);

    // Notify subscribers
    const subscribers = this.subscribers.get(message.to) || new Set();
    for (const subscriber of subscribers) {
      subscriber(fullMessage);
    }

    // Check if anyone is waiting for this response
    if (message.type === 'RESPONSE') {
      const waiter = this.responseWaiters.get(message.correlationId);
      if (waiter) {
        waiter(fullMessage);
        this.responseWaiters.delete(message.correlationId);
      }
    }

    this.emit('message-published', fullMessage);
  }

  /**
   * Subscribe to messages for an agent
   */
  subscribe(
    agentId: string,
    callback: (msg: AgentMessage) => void
  ): () => void {
    const subscribers = this.subscribers.get(agentId) || new Set();
    subscribers.add(callback);
    this.subscribers.set(agentId, subscribers);

    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
    };
  }

  /**
   * Wait for response message
   */
  waitForMessage(
    correlationId: string,
    timeout: number = 30000
  ): Promise<AgentMessage> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.responseWaiters.delete(correlationId);
        reject(new Error(`Timeout waiting for response: ${correlationId}`));
      }, timeout);

      this.responseWaiters.set(correlationId, (msg: AgentMessage) => {
        clearTimeout(timer);
        resolve(msg);
      });
    });
  }

  /**
   * Get pending messages for agent
   */
  getMessages(agentId: string): AgentMessage[] {
    return this.messageQueue.get(agentId) || [];
  }

  /**
   * Clear messages for agent
   */
  clearMessages(agentId: string): void {
    this.messageQueue.delete(agentId);
  }

  /**
   * Shutdown message bus
   */
  async shutdown(): Promise<void> {
    this.removeAllListeners();
    this.messageQueue.clear();
    this.subscribers.clear();
    this.responseWaiters.clear();
    this.emit('shutdown');
  }
}
