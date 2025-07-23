# Codebase Graph MCP Server

A comprehensive Model Context Protocol (MCP) server that provides a graph database for tracking software codebase components, their relationships, and associated tasks/goals. Built with Neo4j for powerful graph queries and analysis, featuring both STDIO MCP and HTTP/SSE interfaces.

## Features

- **Dual Interface Support**: Both STDIO MCP and HTTP/SSE interfaces for maximum flexibility
- **Component Management**: Track files, functions, classes, modules, and systems with metadata support
- **Relationship Mapping**: Model dependencies, inheritance, imports, and other relationships between components
- **Task Integration**: Link tasks and goals directly to codebase components with progress tracking
- **Bulk Operations**: Efficient bulk creation of components, relationships, and tasks
- **Multi-level Abstraction**: Support analysis at any level from individual functions to entire systems
- **Real-time Events**: Server-Sent Events (SSE) for live updates and notifications
- **Change History**: Complete audit trail of all modifications with timestamp tracking
- **Snapshot System**: Create and restore database snapshots for backup and rollback capabilities
- **Command Queue**: Inter-agent communication system for coordinating work between multiple AI agents
- **Voting System**: Community-driven type proposals for extending the schema (optional)
- **CLI Tools**: Terminal-based queue waiters for non-MCP agent integration
- **Flexible Configuration**: Support for multiple databases, remote connections, and SSL
- **MCP Compatible**: Works with any MCP-compatible AI agent or tool

## Prerequisites

### Neo4j Database
1. **Download Neo4j Community Edition**: https://neo4j.com/download/
2. **Install and start Neo4j**:
   - Default URL: `bolt://localhost:7687`
   - Default username: `neo4j`
   - Default password: `password` (you may need to change this on first login)

### Node.js
- Node.js 18+ required
- npm or yarn package manager

## Installation

1. **Clone and install dependencies**:
```bash
cd codebase-graph-mcp
npm install
```

2. **Set up the database**:
```bash
npm run setup-db
```

3. **Start the MCP server**:
```bash
npm start
```

## Server Modes

The server supports multiple operation modes:

### 1. Default Mode (STDIO + HTTP)
```bash
npm start
# or
node src/index.js
```
- Runs both STDIO MCP server and HTTP/SSE server
- Default HTTP port: 3000
- Suitable for development and full-featured access

### 2. HTTP-Only Mode
```bash
HTTP_ONLY=true HTTP_PORT=3001 npm run start:http
```
- Runs only the HTTP server with SSE support
- No STDIO MCP interface
- Ideal for web integrations and external tools

### 3. STDIO-Only Mode
```bash
ENABLE_HTTP=false npm start
```
- Runs only the STDIO MCP server
- No HTTP interface
- Minimal resource usage for MCP-only scenarios

## Configuration

### MCP Client Configuration
To connect an MCP client (like Claude Desktop) to this server, use one of these configurations:

#### Basic Configuration
```json
{
  "mcpServers": {
    "codebase-graph": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "C:/Users/magne/codebase-graph-mcp"
    }
  }
}
```

#### Configuration with Custom Neo4j Settings
```json
{
  "mcpServers": {
    "codebase-graph": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "C:/Users/magne/codebase-graph-mcp",
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "your-secure-password"
      }
    }
  }
}
```

#### Configuration with Voting System Enabled
```json
{
  "mcpServers": {
    "codebase-graph": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "C:/Users/magne/codebase-graph-mcp",
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "password",
        "ENABLE_VOTING": "true"
      }
    }
  }
}
```

#### Remote Neo4j Configuration
```json
{
  "mcpServers": {
    "codebase-graph": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "C:/Users/magne/codebase-graph-mcp",
      "env": {
        "NEO4J_URI": "bolt://your-neo4j-host:7687",
        "NEO4J_USERNAME": "your-username",
        "NEO4J_PASSWORD": "your-password"
      }
    }
  }
}
```

#### Production Configuration with SSL
```json
{
  "mcpServers": {
    "codebase-graph": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "/path/to/codebase-graph-mcp",
      "env": {
        "NEO4J_URI": "bolt+s://production-neo4j:7687",
        "NEO4J_USERNAME": "production-user",
        "NEO4J_PASSWORD": "secure-production-password",
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### Multiple Database Instances
```json
{
  "mcpServers": {
    "codebase-graph-main": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "C:/Users/magne/codebase-graph-mcp",
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "password"
      }
    },
    "codebase-graph-staging": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "C:/Users/magne/codebase-graph-mcp",
      "env": {
        "NEO4J_URI": "bolt://localhost:7688",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "staging-password"
      }
    }
  }
}
```

**For Claude Desktop:**
1. Copy one of the configurations above
2. Add it to your Claude Desktop MCP settings
3. Restart Claude Desktop
4. The codebase-graph tools will be available

**Configuration Files:**
- `claude-desktop-config.json` - Basic configuration for Claude Desktop
- `mcp-config.json` - Configuration with environment variables
- `config-examples.json` - Complete examples for different setups

### Environment Variables

#### Database Connection
- `NEO4J_URI` - Neo4j connection URI (default: `bolt://localhost:7687`)
- `NEO4J_USERNAME` - Neo4j username (default: `neo4j`)
- `NEO4J_PASSWORD` - Neo4j password (default: `password`)

#### Server Configuration
- `ENABLE_HTTP` - Enable/disable HTTP server (default: `true`)
- `HTTP_ONLY` - HTTP-only mode, disable STDIO (default: `false`)
- `HTTP_PORT` - HTTP server port (default: `3000`)
- `HTTP_HOST` - HTTP server host (default: `localhost`)
- `CORS_ORIGIN` - CORS origin setting (default: `*`)

#### Feature Flags
- `ENABLE_VOTING` - Enable voting system for community-driven type proposals (default: `false`)
- `ENABLE_AUTH` - Enable authentication (default: `false`)
- `NODE_ENV` - Environment mode (`development`, `production`)
- `DEBUG` - Enable debug logging (default: `false`)

#### Usage Examples
```bash
# Local development with custom credentials
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USERNAME=neo4j
export NEO4J_PASSWORD=your_password
npm start

# Enable voting system
export ENABLE_VOTING=true
npm start

# Production setup with SSL
export NEO4J_URI=bolt+s://production-host:7687
export NEO4J_USERNAME=prod_user
export NEO4J_PASSWORD=secure_password
export NODE_ENV=production
npm start

# HTTP-only mode
export HTTP_ONLY=true
export HTTP_PORT=3001
npm run start:http

# STDIO-only mode (minimal resource usage)
export ENABLE_HTTP=false
npm start
```

## Usage

### Component Types

#### Code Components
- `FILE`: Source code files
- `FUNCTION`: Functions or methods
- `CLASS`: Classes or types
- `MODULE`: Modules or packages
- `SYSTEM`: High-level system components
- `INTERFACE`: Interfaces or contracts
- `VARIABLE`: Variables or constants
- `CONSTANT`: Constants or configuration

#### Requirements & Specifications
- `REQUIREMENT`: System or functional requirements
- `SPECIFICATION`: Technical specifications
- `FEATURE`: Feature definitions
- `USER_STORY`: User stories and scenarios
- `ACCEPTANCE_CRITERIA`: Acceptance criteria for features
- `TEST_CASE`: Test cases and scenarios

### Relationship Types

#### Code Relationships
- `DEPENDS_ON`: Component depends on another
- `IMPLEMENTS`: Implements an interface
- `EXTENDS`: Inherits from another component
- `CONTAINS`: Contains another component
- `CALLS`: Calls a function or method
- `IMPORTS`: Imports another module
- `EXPORTS`: Exports functionality
- `OVERRIDES`: Overrides parent functionality
- `USES`: Uses another component
- `CREATES`: Creates instances of another component

#### Requirements & Traceability
- `SATISFIES`: Satisfies a requirement or specification
- `DERIVES_FROM`: Derived from another requirement
- `REFINES`: Refines or elaborates on another component
- `TRACES_TO`: Traces to another component for compliance
- `VALIDATES`: Validates another component
- `VERIFIES`: Verifies implementation of another component
- `CONFLICTS_WITH`: Conflicts with another component
- `SUPPORTS`: Supports or enables another component
- `ALLOCATES_TO`: Allocates resources to another component
- `REALIZES`: Realizes or implements a specification

### Task Status
- `TODO`: Not started
- `IN_PROGRESS`: Currently being worked on
- `DONE`: Completed
- `BLOCKED`: Blocked by dependencies
- `CANCELLED`: Cancelled

## MCP Tools

### Component Management
- `create_component`: Create a new component with type, name, description, path, codebase, and metadata
- `get_component`: Retrieve component by ID
- `search_components`: Search components with filters (type, name, codebase)
- `update_component`: Update component properties
- `delete_component`: Delete a component and its relationships

### Bulk Operations (⭐ Preferred for 2+ Items)
- `create_components_bulk`: Create multiple components efficiently
- `create_relationships_bulk`: Create multiple relationships efficiently
- `create_tasks_bulk`: Create multiple tasks efficiently

### Relationship Management
- `create_relationship`: Create relationship between components with optional details
- `get_component_relationships`: Get all relationships for a component (incoming, outgoing, or both)
- `get_dependency_tree`: Get dependency tree with configurable maximum depth

### Task Management
- `create_task`: Create a new task with name, description, status, progress, and related components
- `get_task`: Get task by ID with full details
- `get_tasks`: Get all tasks with optional status filtering
- `update_task_status`: Update task status and progress percentage

### Change History & Snapshots
- `get_change_history`: Get change history for entities or recent changes
- `create_snapshot`: Create a snapshot of current database state
- `list_snapshots`: List all available snapshots
- `restore_snapshot`: Restore database from a snapshot
- `replay_to_timestamp`: Replay changes to recreate state at specific time
- `get_history_stats`: Get statistics about change history

### Command Queue System
- `wait_for_command`: Wait for commands from external systems
- `send_command`: Send commands to waiting agents
- `get_waiting_agents`: Get status of agents waiting for commands
- `get_pending_commands`: Get queued but undelivered commands
- `cancel_command`: Cancel a pending command
- `cancel_wait`: Cancel an agent's wait for commands
- `get_command_history`: Get command queue execution history

### Voting System (Optional)
- `propose_type`: Propose new component or relationship types
- `vote_on_type`: Vote on proposed types
- `get_proposed_types`: Get all proposed types with status filter
- `get_proposed_type`: Get details of specific proposed type
- `apply_approved_type`: Apply approved types to the system
- `get_voting_stats`: Get voting system statistics

### Analysis Tools
- `get_codebase_overview`: Get comprehensive statistics for a codebase

## CLI Queue Waiter Tools

For terminal-enabled agents, the system provides CLI-based queue waiters that don't require MCP client integration:

### Start a CLI Queue Waiter
```bash
# Wait indefinitely with auto-generated ID
node examples/cli-queue-waiter.js

# Wait with custom session name
node examples/cli-queue-waiter.js my-analysis-agent
node examples/cli-queue-waiter.js build-agent-1
```

### Monitor Agent Capacity
```bash
# Show current waiting agents and capacity
node examples/list-agents.js

# Continuous monitoring (refreshes every 5 seconds)
node examples/list-agents.js --watch

# JSON output for programmatic use
node examples/list-agents.js --json
```

### CLI Queue Waiter Features
- **Indefinite waiting**: Runs until manually canceled (Ctrl+C)
- **Named sessions**: Custom agent IDs for identification
- **Capacity reporting**: Automatically reports availability to the system
- **Status updates**: Real-time uptime and command processing stats
- **Graceful shutdown**: Clean session termination with statistics
- **Auto-reconnection**: Automatically re-registers after processing commands

## HTTP/SSE API

The server also provides an HTTP REST API with Server-Sent Events for real-time updates:

### HTTP Endpoints
- **Components**: `GET|POST|PUT|DELETE /api/components[/:id]`
- **Relationships**: `GET|POST /api/relationships` 
- **Tasks**: `GET|POST|PUT /api/tasks[/:id]`
- **Bulk Operations**: `POST /api/{components|relationships|tasks}/bulk`
- **Analysis**: `GET /api/codebase/:name/overview`
- **Change History**: `GET /api/history`
- **Command Queue**: `GET|POST|DELETE /api/commands`

### Server-Sent Events
- **Connection**: `GET /events`
- **Events**: `component-created`, `component-updated`, `task-created`, etc.
- **Bulk Events**: `components-bulk-created`, `relationships-bulk-created`, etc.
- **Real-time Updates**: Live notifications of all database changes

### Testing HTTP API
```bash
# Test bulk operations
node test-bulk-operations.js

# Test SSE connection
node test-sse-client.js
```

## Example Usage

### Bulk Operations (Recommended)
```javascript
// Create multiple components efficiently
const components = [
  {
    type: 'FILE',
    name: 'UserService.ts',
    codebase: 'my-app',
    description: 'User management service'
  },
  {
    type: 'CLASS', 
    name: 'UserService',
    codebase: 'my-app',
    description: 'Main user service class'
  }
];

const result = await createComponentsBulk({ components });
console.log(`Created ${result.length} components`);
```

### Creating Components
```javascript
// Create a file component
await createComponent({
  type: 'FILE',
  name: 'UserService.ts',
  description: 'User management service',
  path: '/src/services/UserService.ts',
  codebase: 'my-app'
});

// Create a class component  
await createComponent({
  type: 'CLASS',
  name: 'UserService',
  description: 'Handles user CRUD operations',
  path: '/src/services/UserService.ts',
  codebase: 'my-app'
});
```

### Creating Relationships
```javascript
// File contains class
await createRelationship({
  type: 'CONTAINS',
  sourceId: fileId,
  targetId: classId,
  details: { location: 'line 10' }
});

// Class depends on database
await createRelationship({
  type: 'DEPENDS_ON', 
  sourceId: classId,
  targetId: databaseId,
  details: { reason: 'data persistence' }
});
```

### Creating Tasks
```javascript
// Create a task linked to components
await createTask({
  name: 'Add user validation',
  description: 'Implement input validation for user creation',
  status: 'TODO',
  progress: 0,
  relatedComponentIds: [userServiceId, validatorId]
});
```

### Analysis Queries
```javascript
// Get all components in a codebase
const components = await searchComponents({ 
  codebase: 'my-app' 
});

// Get dependency tree
const dependencies = await getDependencyTree(componentId, 3);

// Get codebase overview
const overview = await getCodebaseOverview('my-app');
```

## Integration with AI Agents

This MCP server is designed to work with AI agents for:

1. **Code Analysis**: Understanding existing codebase structure
2. **Impact Assessment**: Analyzing changes and their effects
3. **Architecture Planning**: Designing new features and components
4. **Task Management**: Tracking development goals and progress
5. **Dependency Management**: Understanding and managing dependencies

### Example Agent Queries
- "What components depend on the User class?"
- "Show me all TODO tasks related to authentication"
- "What would be affected if I change the Database interface?"
- "Create a task to refactor the payment system"

## Development

### Running Tests
```bash
npm test
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Database Reset
To reset the database:
1. Stop the server
2. Clear Neo4j database (in Neo4j Browser: `MATCH (n) DETACH DELETE n`)
3. Run setup again: `npm run setup-db`

## Data Model

### Neo4j Schema
- **Components**: Nodes with labels `[:Component:TYPE]`
- **Tasks**: Nodes with label `[:Task]`
- **Relationships**: Edges between components with type-specific labels
- **Task Relations**: `[:RELATES_TO]` edges between tasks and components

### Constraints and Indexes
- Unique constraints on component and task IDs
- Indexes on component name, type, and codebase
- Index on task status

## Troubleshooting

### Common Issues

1. **Neo4j Connection Failed**
   - Ensure Neo4j is running
   - Check connection details
   - Verify authentication credentials

2. **Schema Initialization Failed**
   - Check Neo4j permissions
   - Ensure database is empty or compatible

3. **MCP Connection Issues**
   - Verify stdio transport setup
   - Check MCP client configuration
   - For port conflicts with HTTP server, use MCP-only mode: `node src/mcp-only.js`

4. **"Child process ended (EOF on stdout)" Error**
   - This usually indicates the server process crashed during startup
   - Check if another process is using port 3000 (`lsof -i :3000`)
   - Use the MCP-only entry point to avoid HTTP server conflicts
   - For Goose: Update config to use `src/mcp-only.js` instead of `src/index.js`

### Logs
Server logs are written to stderr and include:
- Database connection status
- Schema initialization progress
- Error messages with details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details
