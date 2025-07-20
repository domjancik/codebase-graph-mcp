import { EventEmitter } from 'events';

/**
 * Command Queue System
 * Allows agents to wait for commands from external systems (like graph visualizers)
 * and enables external systems to send commands to waiting agents.
 */
export class CommandQueue extends EventEmitter {
  constructor() {
    super();
    this.pendingCommands = new Map(); // commandId -> command data
    this.waitingAgents = new Map(); // agentId -> { resolve, reject, timeout, filters }
    this.commandHistory = []; // Track command execution history
    this.maxHistorySize = 1000;
  }

  /**
   * Agent waits for a command with optional filters
   * @param {string} agentId - Unique identifier for the agent
   * @param {Object} options - Wait options
   * @param {number} options.timeout - Timeout in milliseconds (default: 300000 = 5 minutes)
   * @param {Object} options.filters - Filters to match commands
   * @param {string[]} options.filters.taskTypes - Types of tasks to accept
   * @param {string[]} options.filters.componentIds - Component IDs to accept commands for
   * @param {string} options.filters.priority - Minimum priority level
   * @returns {Promise<Object>} The command object when received
   */
  async waitForCommand(agentId, options = {}) {
    const { timeout = 300000, filters = {} } = options;

    // Check if there's already a pending command that matches
    const matchingCommand = this.findMatchingPendingCommand(filters);
    if (matchingCommand) {
      this.pendingCommands.delete(matchingCommand.id);
      this.addToHistory('COMMAND_RECEIVED', agentId, matchingCommand);
      return matchingCommand;
    }

    // If agent is already waiting, reject the previous wait
    if (this.waitingAgents.has(agentId)) {
      const existing = this.waitingAgents.get(agentId);
      existing.reject(new Error('Agent started waiting for new command, canceling previous wait'));
    }

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.waitingAgents.delete(agentId);
        reject(new Error(`Wait for command timed out after ${timeout}ms`));
      }, timeout);

      // Store the waiting agent
      this.waitingAgents.set(agentId, {
        resolve: (command) => {
          clearTimeout(timeoutHandle);
          this.waitingAgents.delete(agentId);
          this.addToHistory('COMMAND_RECEIVED', agentId, command);
          resolve(command);
        },
        reject: (error) => {
          clearTimeout(timeoutHandle);
          this.waitingAgents.delete(agentId);
          this.addToHistory('WAIT_FAILED', agentId, { error: error.message });
          reject(error);
        },
        timeout: timeoutHandle,
        filters,
        startedAt: new Date().toISOString()
      });

      this.addToHistory('WAIT_STARTED', agentId, { filters, timeout });
      this.emit('agent-waiting', { agentId, filters });
    });
  }

  /**
   * Send a command to waiting agents or queue it for later
   * @param {Object} command - The command object
   * @param {string} command.id - Unique command ID
   * @param {string} command.type - Type of command (e.g., 'EXECUTE_TASK', 'UPDATE_COMPONENT')
   * @param {string} command.source - Source of the command (e.g., 'graph-visualizer', 'cli')
   * @param {Object} command.payload - Command-specific data
   * @param {string} command.priority - Priority level ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
   * @param {string[]} command.targetComponentIds - Component IDs this command relates to
   * @param {string} command.taskType - Type of task if applicable
   * @returns {Object} Result indicating if command was delivered or queued
   */
  sendCommand(command) {
    const fullCommand = {
      ...command,
      id: command.id || this.generateCommandId(),
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };

    // Try to find a waiting agent that matches this command
    const matchingAgentId = this.findMatchingWaitingAgent(fullCommand);
    
    if (matchingAgentId) {
      const agent = this.waitingAgents.get(matchingAgentId);
      fullCommand.status = 'DELIVERED';
      agent.resolve(fullCommand);
      this.addToHistory('COMMAND_SENT', null, { command: fullCommand, deliveredTo: matchingAgentId });
      return { delivered: true, agentId: matchingAgentId, command: fullCommand };
    } else {
      // Queue the command for later
      this.pendingCommands.set(fullCommand.id, fullCommand);
      this.addToHistory('COMMAND_QUEUED', null, fullCommand);
      this.emit('command-queued', fullCommand);
      return { delivered: false, queued: true, command: fullCommand };
    }
  }

  /**
   * Get status of waiting agents
   */
  getWaitingAgents() {
    const agents = [];
    for (const [agentId, info] of this.waitingAgents) {
      agents.push({
        agentId,
        filters: info.filters,
        startedAt: info.startedAt,
        waitingFor: Math.round((Date.now() - new Date(info.startedAt).getTime()) / 1000) + 's'
      });
    }
    return agents;
  }

  /**
   * Get pending commands
   */
  getPendingCommands() {
    return Array.from(this.pendingCommands.values());
  }

  /**
   * Cancel a pending command
   */
  cancelCommand(commandId) {
    const command = this.pendingCommands.get(commandId);
    if (command) {
      this.pendingCommands.delete(commandId);
      this.addToHistory('COMMAND_CANCELLED', null, command);
      return true;
    }
    return false;
  }

  /**
   * Cancel an agent's wait
   */
  cancelWait(agentId) {
    const agent = this.waitingAgents.get(agentId);
    if (agent) {
      agent.reject(new Error('Wait cancelled by external request'));
      return true;
    }
    return false;
  }

  /**
   * Get command execution history
   */
  getHistory(limit = 100) {
    return this.commandHistory.slice(-limit);
  }

  /**
   * Clear old history entries
   */
  clearHistory() {
    this.commandHistory = [];
  }

  // Private methods

  generateCommandId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  findMatchingPendingCommand(filters) {
    for (const command of this.pendingCommands.values()) {
      if (this.commandMatchesFilters(command, filters)) {
        return command;
      }
    }
    return null;
  }

  findMatchingWaitingAgent(command) {
    for (const [agentId, agent] of this.waitingAgents) {
      if (this.commandMatchesFilters(command, agent.filters)) {
        return agentId;
      }
    }
    return null;
  }

  commandMatchesFilters(command, filters) {
    // If no filters, match everything
    if (!filters || Object.keys(filters).length === 0) {
      return true;
    }

    // Check task types
    if (filters.taskTypes && filters.taskTypes.length > 0) {
      if (!command.taskType || !filters.taskTypes.includes(command.taskType)) {
        return false;
      }
    }

    // Check component IDs
    if (filters.componentIds && filters.componentIds.length > 0) {
      if (!command.targetComponentIds || 
          !command.targetComponentIds.some(id => filters.componentIds.includes(id))) {
        return false;
      }
    }

    // Check priority
    if (filters.priority) {
      const priorityLevels = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'URGENT': 4 };
      const commandPriority = priorityLevels[command.priority] || 1;
      const minPriority = priorityLevels[filters.priority] || 1;
      if (commandPriority < minPriority) {
        return false;
      }
    }

    return true;
  }

  addToHistory(action, agentId, data) {
    this.commandHistory.push({
      timestamp: new Date().toISOString(),
      action,
      agentId,
      data: JSON.parse(JSON.stringify(data)) // Deep clone to avoid references
    });

    // Trim history if it gets too large
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.splice(0, this.commandHistory.length - this.maxHistorySize);
    }
  }
}

// Export a singleton instance for use across the application
export const globalCommandQueue = new CommandQueue();
