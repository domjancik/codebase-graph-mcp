# Quick Start Guide

## Prerequisites Setup (5 minutes)

1. **Install Neo4j Community Edition**
   - Download from: https://neo4j.com/download/
   - Run the installer and start Neo4j
   - Open Neo4j Browser at: http://localhost:7474
   - Set initial password (default username: `neo4j`)

2. **Install Node.js dependencies**
   ```bash
   cd codebase-graph-mcp
   npm install
   ```

## Setup & Test (2 minutes)

3. **Initialize the database**
   ```bash
   npm run setup-db
   ```
   This creates the schema and sample data.

4. **Run the example demo**
   ```bash
   npm run example
   ```
   This demonstrates creating components, relationships, and tasks.

5. **Start the MCP server**
   ```bash
   npm start
   ```
   The server runs on stdio for MCP communication.

## Verify Everything Works

- ✅ Neo4j running on bolt://localhost:7687
- ✅ Database setup completed without errors
- ✅ Example demo shows component creation and analysis
- ✅ MCP server starts and connects to database

## Next Steps

- Read the full [README.md](README.md) for detailed usage
- Explore [examples/usage-example.js](examples/usage-example.js) for code patterns
- Run tests: `npm test`
- Connect your MCP-compatible AI agent to the server

## Common Issues

**Neo4j Connection Failed**: Ensure Neo4j is running and accessible at bolt://localhost:7687

**Permission Errors**: Check Neo4j authentication (username: neo4j, default password: password)

**Port Issues**: Neo4j uses ports 7474 (HTTP) and 7687 (Bolt) - ensure they're available

## MCP Tool Examples

Once running, agents can use tools like:
- `create_component` - Add new codebase components
- `search_components` - Find components by filters
- `create_relationship` - Link components together
- `create_task` - Add development tasks
- `get_codebase_overview` - Analyze codebase structure

Happy coding! 🚀
