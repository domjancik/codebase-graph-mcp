# Command Queue System Guide

The Codebase Graph MCP Server includes a powerful command queue system that enables agents to wait for and receive commands from external systems like graph visualizers, IDEs, or other automation tools.

## Overview

The command queue system provides:

- **Agent Wait Mechanism**: Agents can wait for specific types of commands
- **Command Filtering**: Agents can specify filters for the commands they want to receive
- **Command Routing**: Commands are automatically routed to the appropriate waiting agents
- **Queue Management**: Commands are queued when no matching agents are waiting
- **History Tracking**: All command queue activities are logged for debugging and analysis

## Core Concepts

### Agents
Agents are any system or process that can wait for and execute commands. Examples:
- AI assistants waiting for user requests
- Automated build systems waiting for deployment commands
- Testing frameworks waiting for test execution requests

### Commands
Commands are structured messages that contain:
- **Type**: The kind of operation (e.g., `EXECUTE_TASK`, `UPDATE_COMPONENT`)
- **Source**: Where the command originated (e.g., `graph-visualizer`, `cli`)
- **Payload**: Command-specific data
- **Priority**: Command priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- **Target Components**: Which components the command relates to
- **Task Type**: The category of task if applicable

### Filters
Agents can specify filters to only receive relevant commands:
- **Task Types**: Only commands with specific task types
- **Component IDs**: Only commands targeting specific components
- **Priority**: Minimum priority level required

## MCP Tools

The command queue system exposes the following MCP tools:

### `wait_for_command`
Blocks until a command is received or timeout occurs.

```json
{
  "agentId": "my-agent-1",
  "timeout": 300000,
  "filters": {
    "taskTypes": ["TESTING", "BUILD"],
    "componentIds": ["comp-123"],
    "priority": "MEDIUM"
  }
}
```

### `send_command`
Sends a command to waiting agents or queues it for later.

```json
{
  "type": "EXECUTE_TASK",
  "source": "graph-visualizer",
  "payload": {
    "taskId": "task-456",
    "action": "run_tests"
  },
  "priority": "HIGH",
  "targetComponentIds": ["comp-123"],
  "taskType": "TESTING"
}
```

### `get_waiting_agents`
Returns information about agents currently waiting for commands.

### `get_pending_commands`
Returns commands that are queued but not yet delivered.

### `cancel_command`
Cancels a pending command by ID.

### `cancel_wait`
Cancels an agent's wait for commands.

### `get_command_history`
Returns the command queue execution history.

## Usage Examples

### Basic Agent Wait Pattern

```javascript
import { globalCommandQueue } from './src/command-queue.js';

async function agentWorkflow() {
  const agentId = 'my-agent-1';
  
  while (true) {
    try {
      console.log('Waiting for commands...');
      
      const command = await globalCommandQueue.waitForCommand(agentId, {
        timeout: 300000, // 5 minutes
        filters: {
          taskTypes: ['EXECUTE_TASK', 'UPDATE_COMPONENT'],
          priority: 'MEDIUM'
        }
      });
      
      console.log('Received command:', command);
      
      // Process the command
      await processCommand(command);
      
    } catch (error) {
      console.log('Wait timeout or error:', error.message);
      break;
    }
  }
}
```

### Graph Visualizer Integration

```javascript
import { globalCommandQueue } from './src/command-queue.js';

class GraphVisualizer {
  constructor() {
    this.commandQueue = globalCommandQueue;
    
    // Listen for queue events
    this.commandQueue.on('agent-waiting', (data) => {
      this.updateUI(`Agent ${data.agentId} is ready for commands`);
    });
  }
  
  // User clicks "Execute Task" button
  onExecuteTaskClick(taskId, componentId) {
    const result = this.commandQueue.sendCommand({
      type: 'EXECUTE_TASK',
      source: 'graph-visualizer-ui',
      payload: { taskId, componentId },
      priority: 'HIGH',
      taskType: 'EXECUTION',
      targetComponentIds: [componentId]
    });
    
    if (result.delivered) {
      this.showNotification(`Task sent to agent ${result.agentId}`);
    } else {
      this.showNotification('Task queued - no agents available');
    }
  }
}
```

### CLI Tool Integration

```javascript
// cli-tool.js
async function executeTask(taskId) {
  const result = globalCommandQueue.sendCommand({
    type: 'EXECUTE_TASK',
    source: 'cli',
    payload: { taskId, executeNow: true },
    priority: 'HIGH',
    taskType: 'CLI_EXECUTION'
  });
  
  if (result.delivered) {
    console.log(`✅ Task sent to agent: ${result.agentId}`);
  } else {
    console.log('⏳ Task queued - will execute when agent is available');
  }
}
```

## Command Types

### Standard Command Types

- **EXECUTE_TASK**: Execute a specific task
- **UPDATE_COMPONENT**: Update component properties
- **CREATE_COMPONENT**: Create a new component
- **DELETE_COMPONENT**: Delete a component
- **ANALYZE_DEPENDENCIES**: Analyze component dependencies
- **RUN_TESTS**: Execute tests
- **BUILD**: Build/compile components
- **DEPLOY**: Deploy components

### Custom Command Types

You can define custom command types for your specific use cases:

```javascript
const customCommand = {
  type: 'CUSTOM_ANALYSIS',
  source: 'my-tool',
  payload: {
    analysisType: 'security-scan',
    targetFiles: ['src/auth.js', 'src/database.js']
  },
  priority: 'HIGH',
  taskType: 'SECURITY'
};
```

## Priority Levels

Commands have four priority levels:

1. **LOW**: Background tasks, maintenance operations
2. **MEDIUM**: Regular operations, automated processes
3. **HIGH**: User-initiated actions, important updates
4. **URGENT**: Critical operations, security fixes

Agents can specify a minimum priority level in their filters.

## Best Practices

### For Agents

1. **Use Specific Filters**: Don't accept all commands unless necessary
2. **Set Reasonable Timeouts**: Balance responsiveness with resource usage
3. **Handle Timeouts Gracefully**: Implement retry logic if needed
4. **Process Commands Quickly**: Don't block the queue unnecessarily

### For Command Senders

1. **Set Appropriate Priority**: Use priority levels meaningfully
2. **Include Relevant Metadata**: Provide enough context in the payload
3. **Target Specific Components**: Use targetComponentIds when applicable
4. **Monitor Queue Status**: Check if agents are available before sending

### For System Integration

1. **Use Events**: Listen to queue events for UI updates
2. **Implement Fallbacks**: Handle cases when no agents are available
3. **Log Activities**: Use the history feature for debugging
4. **Clean Up**: Cancel unnecessary commands and waits

## Monitoring and Debugging

### Queue Status

Monitor the queue status regularly:

```javascript
const waitingAgents = globalCommandQueue.getWaitingAgents();
const pendingCommands = globalCommandQueue.getPendingCommands();

console.log(`Agents waiting: ${waitingAgents.length}`);
console.log(`Commands pending: ${pendingCommands.length}`);
```

### History Analysis

Use the command history for debugging:

```javascript
const history = globalCommandQueue.getHistory(50);
history.forEach(entry => {
  console.log(`${entry.timestamp}: ${entry.action} - Agent: ${entry.agentId}`);
});
```

### Event Listening

Listen to queue events for real-time monitoring:

```javascript
globalCommandQueue.on('agent-waiting', (data) => {
  console.log(`Agent ${data.agentId} started waiting`);
});

globalCommandQueue.on('command-queued', (command) => {
  console.log(`Command queued: ${command.type}`);
});
```

## Error Handling

### Common Errors

- **Timeout**: Agent wait timed out
- **No Matching Agent**: No agent available for the command
- **Invalid Command**: Command structure is invalid
- **Agent Already Waiting**: Agent is already waiting for commands

### Error Recovery

```javascript
async function robustAgentWait(agentId) {
  let retries = 3;
  
  while (retries > 0) {
    try {
      const command = await globalCommandQueue.waitForCommand(agentId, {
        timeout: 60000
      });
      return command;
    } catch (error) {
      if (error.message.includes('timeout')) {
        retries--;
        console.log(`Wait timeout, retries left: ${retries}`);
      } else {
        throw error; // Re-throw non-timeout errors
      }
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

## Integration with Graph Visualizers

The command queue system is designed to work seamlessly with graph visualization tools:

### Visualizer → Agent Flow

1. User interacts with the graph (clicks node, selects task)
2. Visualizer sends command using `send_command`
3. Command is routed to appropriate waiting agent
4. Agent executes the task and may update the graph
5. Visualizer receives updates and refreshes the display

### Agent → Visualizer Flow

1. Agent completes a task or detects changes
2. Agent sends status update command
3. Visualizer receives the command
4. Visualizer updates the graph display

This creates a real-time, interactive experience where users can trigger actions through the visual interface and see results immediately.

## Security Considerations

- Commands may contain sensitive data - ensure proper access controls
- Validate command payloads before processing
- Use timeouts to prevent resource exhaustion
- Monitor queue usage for potential abuse
- Implement rate limiting if necessary

## Performance Tips

- Use filters to reduce unnecessary command processing
- Set appropriate timeouts based on expected response times
- Clear command history periodically to prevent memory buildup
- Monitor queue size and agent availability
- Consider using multiple specialized agents instead of one general-purpose agent

The command queue system provides a flexible foundation for building interactive, responsive codebase management tools. By following these guidelines, you can create robust integrations that enhance the developer experience.
