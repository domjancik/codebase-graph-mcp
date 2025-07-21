# Queue Waiter System Guide

## What You Just Saw

The script you ran demonstrates the **queue waiter pattern** - an agent that blocks and waits for commands from external systems. This is a core feature of the Codebase Graph MCP toolset.

## How It Actually Works

### 1. Real Queue Waiter Implementation

In the actual system, you would use the MCP `wait_for_command` tool:

```javascript
// Agent waits and blocks until a command is received
const command = await wait_for_command({
  agentId: "my-agent",
  filters: {
    priority: "MEDIUM",
    taskTypes: ["EXECUTE_TASK", "ANALYSIS"]
  },
  timeout: 300000  // 5 minutes
});

// Process the received command
console.log("Received:", command);
```

### 2. How External Systems Trigger the Agent

External systems (like graph visualizers, IDEs, or CLI tools) can send commands:

```javascript
// External system sends command
const result = send_command({
  type: "EXECUTE_TASK",
  source: "graph-visualizer",
  payload: { taskId: "task-123", action: "analyze" },
  priority: "HIGH",
  taskType: "ANALYSIS"
});

// Command is instantly delivered to waiting agents
```

## Real-World Usage Scenarios

### Scenario 1: Interactive Graph Visualizer
1. **Agent starts waiting**: `wait_for_command` with filters for UI interactions
2. **User clicks node** in graph visualizer
3. **Visualizer sends command** instantly to the waiting agent
4. **Agent receives command** and processes it (e.g., runs analysis)
5. **Results update** the graph in real-time

### Scenario 2: AI Assistant Integration
1. **AI agent waits**: for code analysis requests
2. **User asks**: "Analyze this component's dependencies"
3. **System sends command** with component ID
4. **Agent processes**: runs dependency analysis
5. **Returns results**: to the user

### Scenario 3: Automated Workflows
1. **Build agent waits**: for deployment triggers
2. **CI/CD system sends**: deployment command
3. **Agent executes**: build and deployment process
4. **Reports status**: back to the system

## Key Benefits

### 🔄 **Real-Time Responsiveness**
- Commands are delivered **instantly** to waiting agents
- No polling or delays - true event-driven architecture

### 🎯 **Smart Filtering**
- Agents only receive **relevant commands**
- Filter by priority, task type, component IDs, etc.

### 🔗 **Loose Coupling**
- External systems don't need direct integration
- Commands are queued if no agents are waiting

### 📊 **Full Observability**
- Track command history and agent status
- Monitor queue health and performance

## Running the Real System

### Step 1: Start the MCP Server
```bash
cd ~/codebase-graph-mcp
npm start
```

### Step 2: Use MCP Tools
The MCP server exposes these queue-related tools:

- `wait_for_command` - Agent waits for commands (blocks)
- `send_command` - Send command to agents
- `get_waiting_agents` - See who's waiting
- `get_pending_commands` - See queued commands
- `cancel_command` - Cancel pending commands
- `cancel_wait` - Cancel an agent's wait

### Step 3: Build Integrations

#### For Agents (Waiting Systems):
```javascript
const command = await mcpClient.call("wait_for_command", {
  agentId: "my-analyzer",
  filters: { taskTypes: ["ANALYZE"] },
  timeout: 300000
});
```

#### For Triggers (External Systems):
```javascript
const result = await mcpClient.call("send_command", {
  type: "ANALYZE",
  payload: { componentId: "comp-123" },
  priority: "HIGH"
});
```

## Demo Files Created

I've created these files in `~/dev` for you:

1. **`codebase-graph-overview.md`** - Complete system overview
2. **`queue-waiter-guide.md`** - This guide
3. **`simple-waiter.js`** - Demo simulation you just ran
4. **`queue-waiter.js`** - Real implementation example
5. **`send-command.js`** - Command sender example

## Next Steps

To fully test the queue waiter system:

1. **Start Neo4j** (if not running)
2. **Run**: `npm start` in the codebase-graph-mcp directory
3. **Connect** via MCP client (like Claude Desktop)
4. **Use** the `wait_for_command` tool to create waiting agents
5. **Send** commands using `send_command` tool
6. **Watch** real-time command delivery and processing

## The Magic ✨

The queue waiter system enables **true reactive programming** for development tools:

- **Graph visualizers** become interactive command centers
- **AI assistants** can trigger real development tasks  
- **External tools** can seamlessly integrate
- **Workflows** become event-driven and responsive

This creates a foundation for building sophisticated, interconnected development environments where different tools can communicate and trigger actions in real-time.
