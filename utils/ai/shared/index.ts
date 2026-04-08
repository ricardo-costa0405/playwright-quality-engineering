/**
 * Barrel export for shared agent infrastructure
 */
export { MessageBus } from './MessageBus';
export type { AgentMessage, MessageType } from './MessageBus';

export { AgentBase } from './AgentBase';
export type { AgentStatus, AgentState, AgentTask, AgentResult } from './AgentBase';

export { AgentRegistry } from './AgentRegistry';
