import { AgentBase, AgentTask, AgentResult } from './AgentBase';
import { Logger } from 'winston';

/**
 * Registry for managing agents
 * Handles agent registration, querying, and lifecycle
 */
export class AgentRegistry {
  private agents: Map<string, AgentBase>;
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.agents = new Map();
    this.logger = logger;
  }

  /**
   * Register an agent
   */
  registerAgent(agent: AgentBase): void {
    const agentId = agent.getId();

    if (this.agents.has(agentId)) {
      this.logger?.warn(`Agent ${agentId} already registered. Replacing.`);
    }

    this.agents.set(agentId, agent);
    this.logger?.info(`Agent ${agentId} registered successfully`);
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);

    if (!agent) {
      this.logger?.warn(`Agent ${agentId} not found in registry`);
      return;
    }

    await agent.shutdown();
    this.agents.delete(agentId);
    this.logger?.info(`Agent ${agentId} unregistered`);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentBase | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentBase[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent IDs
   */
  getAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Check if agent exists
   */
  hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Get agents by type (using agent ID prefix)
   * e.g., "executor-*" matches "executor-1", "executor-2"
   */
  getAgentsByType(prefix: string): AgentBase[] {
    return Array.from(this.agents.values()).filter((agent) =>
      agent.getId().startsWith(prefix)
    );
  }

  /**
   * Get agent count
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Get health status of all agents
   */
  getHealthStatus(): Record<string, any> {
    const health: Record<string, any> = {
      totalAgents: this.agents.size,
      agents: {},
      timestamp: Date.now(),
    };

    for (const [id, agent] of this.agents.entries()) {
      health.agents[id] = agent.getState();
    }

    return health;
  }

  /**
   * Shutdown all agents
   */
  async shutdown(): Promise<void> {
    this.logger?.info('Shutting down all agents...');

    const shutdownPromises = Array.from(this.agents.values()).map((agent) =>
      agent.shutdown()
    );

    await Promise.all(shutdownPromises);
    this.agents.clear();

    this.logger?.info('All agents shut down');
  }
}
