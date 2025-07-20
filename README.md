# Codebase Graph MCP Server

A Model Context Protocol (MCP) server that provides a graph database for tracking software codebase components, their relationships, and associated tasks/goals. Built with Neo4j for powerful graph queries and analysis.

## Features

- **Component Management**: Track files, functions, classes, modules, and systems
- **Relationship Mapping**: Model dependencies, inheritance, imports, and other relationships
- **Task Integration**: Link tasks and goals directly to codebase components
- **Multi-level Abstraction**: Support analysis at any level from individual functions to entire systems
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

## Configuration

### Database Connection
Edit the database connection in `src/database.js` if needed:
```javascript
const db = new GraphDatabase(
  'bolt://localhost:7687',  // Neo4j URI
  'neo4j',                  // Username
  'password'                // Password
);
```

### Environment Variables
You can also use environment variables:
```bash
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USERNAME=neo4j  
export NEO4J_PASSWORD=your_password
```

## Usage

### Component Types
- `FILE`: Source code files
- `FUNCTION`: Functions or methods
- `CLASS`: Classes or types
- `MODULE`: Modules or packages
- `SYSTEM`: High-level system components
- `INTERFACE`: Interfaces or contracts
- `VARIABLE`: Variables or constants
- `CONSTANT`: Constants or configuration

### Relationship Types
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

### Task Status
- `TODO`: Not started
- `IN_PROGRESS`: Currently being worked on
- `DONE`: Completed
- `BLOCKED`: Blocked by dependencies
- `CANCELLED`: Cancelled

## MCP Tools

### Component Management
- `create_component`: Create a new component
- `get_component`: Retrieve component by ID
- `search_components`: Search with filters
- `update_component`: Update component properties
- `delete_component`: Delete a component

### Relationship Management
- `create_relationship`: Create relationship between components
- `get_component_relationships`: Get all relationships for a component
- `get_dependency_tree`: Get dependency tree (supports max depth)

### Task Management
- `create_task`: Create a new task
- `get_task`: Get task by ID
- `get_tasks`: Get all tasks (optional status filter)
- `update_task_status`: Update task status and progress

### Analysis Tools
- `get_codebase_overview`: Get statistics for a codebase

## Example Usage

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
