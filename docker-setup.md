# Docker Setup Guide

## Quick Start (3 commands)

1. **Start Neo4j database:**
   ```bash
   docker compose up -d neo4j
   ```

2. **Initialize the database:**
   ```bash
   docker compose run --rm mcp-server node scripts/setup-db.js
   ```

3. **Your MCP server is ready!** Use the local Node.js version:
   ```bash
   npm start
   ```

## Commands

### Start Neo4j Only
```bash
docker compose up -d neo4j
```

### Check Neo4j Health
```bash
docker compose ps
docker compose logs neo4j
```

### Initialize Database
```bash
docker compose run --rm mcp-server node scripts/setup-db.js
```

### Run Example Demo
```bash
docker compose run --rm mcp-server node examples/usage-example.js
```

### Run Tests
```bash
docker compose run --rm mcp-server npm test
```

### Start MCP Server in Docker (Optional)
```bash
docker compose --profile server up -d
```

### Access Neo4j Browser
Open: http://localhost:7474
- Username: `neo4j`
- Password: `password`

### Stop Everything
```bash
docker compose down
```

### Reset Database (Delete All Data)
```bash
docker compose down -v
docker compose up -d neo4j
```

## Configuration

### For MCP Clients
Use this configuration when Neo4j is running in Docker:

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
        "NEO4J_PASSWORD": "password"
      }
    }
  }
}
```

### Environment Variables
The Docker setup uses these defaults:
- `NEO4J_URI=bolt://localhost:7687`
- `NEO4J_USERNAME=neo4j`
- `NEO4J_PASSWORD=password`

## Ports
- **7474**: Neo4j HTTP (Browser UI)
- **7687**: Neo4j Bolt (Database connection)

## Volumes
- `neo4j_data`: Database files (persistent)
- `neo4j_logs`: Log files
- `neo4j_import`: Import directory
- `neo4j_plugins`: Plugin files

## Troubleshooting

### Neo4j Won't Start
```bash
docker compose logs neo4j
```

### Connection Issues
```bash
# Test Neo4j connectivity
docker compose exec neo4j cypher-shell -u neo4j -p password "RETURN 1"
```

### Reset Everything
```bash
docker compose down -v
docker system prune -f
```
