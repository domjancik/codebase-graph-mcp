# Codebase Graph MCP Toolset Overview

## What is Codebase Graph MCP?

The **Codebase Graph MCP Server** is a powerful Model Context Protocol (MCP) server that provides a graph database for tracking software codebase components, their relationships, and associated tasks/goals. It's built with Neo4j for powerful graph queries and analysis.

## Key Features

### 🏗️ Component Management
- **Track Components**: Files, functions, classes, modules, and systems
- **Component Types**: FILE, FUNCTION, CLASS, MODULE, SYSTEM, INTERFACE, VARIABLE, CONSTANT
- **Metadata**: Store paths, descriptions, and custom metadata

### 🔗 Relationship Mapping
- **Relationship Types**: DEPENDS_ON, IMPLEMENTS, EXTENDS, CONTAINS, CALLS, IMPORTS, EXPORTS, OVERRIDES, USES, CREATES
- **Dependency Trees**: Visualize and analyze component dependencies
- **Multi-level Analysis**: From individual functions to entire systems

### ✅ Task Integration
- **Task Management**: Create, update, and track development tasks
- **Task Status**: TODO, IN_PROGRESS, DONE, BLOCKED, CANCELLED
- **Component Linking**: Link tasks directly to specific components

### 📊 Advanced Features
- **Change History**: Track all changes with full replay capability
- **Snapshots**: Create and restore database snapshots
- **Analytics**: Get codebase overview and statistics
- **Command Queue**: Real-time communication with external tools

## Core Components

### 1. Graph Database (Neo4j)
- Stores components, relationships, and tasks as graph data
- Enables powerful queries and analysis
- Provides ACID transactions and data integrity

### 2. MCP Server
- Exposes tools via Model Context Protocol
- Handles component CRUD operations
- Manages relationships and dependencies
- Provides task management capabilities

### 3. Command Queue System ⭐
- **Real-time Communication**: External tools can send commands to waiting agents
- **Agent Pattern**: Agents wait for specific types of commands
- **Filtering**: Agents can specify what commands they want to receive
- **Queue Management**: Commands are queued when no agents are available
- **History Tracking**: Full audit trail of command execution

## Available MCP Tools

### Component Management
- `create_component` - Create new components
- `get_component` - Retrieve component by ID
- `search_components` - Search with filters
- `update_component` - Update properties
- `delete_component` - Delete components

### Relationship Management
- `create_relationship` - Create relationships between components
- `get_component_relationships` - Get all relationships for a component
- `get_dependency_tree` - Get dependency tree with max depth

### Task Management
- `create_task` - Create new tasks
- `get_task` - Get task by ID
- `get_tasks` - Get all tasks (with optional status filter)
- `update_task_status` - Update status and progress

### Analysis Tools
- `get_codebase_overview` - Get statistics for a codebase

### Change History & Snapshots
- `get_change_history` - Get change history
- `create_snapshot` - Create database snapshot
- `list_snapshots` - List available snapshots
- `restore_snapshot` - Restore from snapshot
- `replay_to_timestamp` - Replay changes to specific time
- `get_history_stats` - Get history statistics

### Command Queue Tools ⭐
- `wait_for_command` - Agent waits for commands (blocks until received)
- `send_command` - Send command to agents or queue it
- `get_waiting_agents` - Get status of waiting agents
- `get_pending_commands` - Get queued commands
- `cancel_command` - Cancel pending commands
- `cancel_wait` - Cancel agent's wait
- `get_command_history` - Get command execution history

## Use Cases

### 🔍 Code Analysis
- Map your codebase structure and dependencies
- Understand component relationships
- Identify circular dependencies
- Analyze impact of changes

### 📈 Project Management
- Track development tasks linked to specific components
- Monitor progress on different parts of the codebase
- Plan refactoring and architecture changes

### 🔧 Tool Integration
- Connect with graph visualizers for interactive codebase exploration
- Integrate with IDEs for real-time code analysis
- Build automated workflows with the command queue system

### 🎯 AI-Powered Development
- Provide context to AI agents about your codebase structure
- Enable AI assistants to understand component relationships
- Support intelligent code suggestions based on graph analysis

## Command Queue System Deep Dive

The command queue system is particularly powerful for building interactive development tools:

### Agent-Based Architecture
```javascript
// Agent waits for specific commands
const command = await waitForCommand('my-agent', {
  timeout: 300000,
  filters: {
    taskTypes: ['EXECUTE_TASK', 'UPDATE_COMPONENT'],
    priority: 'MEDIUM'
  }
});
```

### External Tool Integration
```javascript
// Graph visualizer sends command to agent
const result = sendCommand({
  type: 'EXECUTE_TASK',
  source: 'graph-visualizer',
  payload: { taskId: 'task-123' },
  priority: 'HIGH'
});
```

### Real-Time Workflows
1. User clicks node in graph visualizer
2. Visualizer sends `EXECUTE_TASK` command
3. Waiting agent receives command instantly
4. Agent executes task and updates components
5. Changes reflect back in visualizer

## Getting Started

The MCP server is already configured and running. You can:

1. **Use MCP Tools**: Call any of the available tools through the MCP interface
2. **Run Queue Waiter**: Start an agent to wait for commands
3. **Explore Examples**: Check the examples directory for usage patterns
4. **Build Integrations**: Connect external tools via the command queue

## Example: Basic Workflow

```javascript
// 1. Create a component
const fileComponent = await createComponent({
  type: 'FILE',
  name: 'UserService.ts',
  path: './src/services/UserService.ts',
  codebase: 'my-app'
});

// 2. Create a task
const task = await createTask({
  name: 'Add user validation',
  description: 'Implement input validation',
  relatedComponentIds: [fileComponent.id]
});

// 3. Start agent to wait for commands
const command = await waitForCommand('validator-agent', {
  filters: { taskTypes: ['VALIDATION'] }
});

// 4. External tool sends validation command
sendCommand({
  type: 'VALIDATION',
  payload: { componentId: fileComponent.id },
  taskType: 'VALIDATION'
});
```

This system provides a robust foundation for building sophisticated development tools that can understand and interact with your codebase structure in real-time.
