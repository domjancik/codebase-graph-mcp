# Command Filtering Integration - Usage Guide

## Overview

The Command Filtering System is now fully integrated into the Codebase Graph MCP Server, providing comprehensive command access control at both the tool discovery and execution levels.

## Integration Points

### 1. Tool Listing Filtering (Context Load Reduction)

**Location**: `src/index.js` - `ListToolsRequestSchema` handler

When agents request available tools, the server now:
- Filters the tool list based on current filtering configuration
- Only exposes tools that are allowed by the current filter settings
- Reduces context load by not sending disallowed tools to agents

**Example**: With `read-only` preset, agents will only see read-only tools like `get_component`, `search_components`, etc.

### 2. Command Execution Filtering (Security Enforcement)

**Location**: `src/index.js` - `CallToolRequestSchema` handler

When agents attempt to execute commands, the server:
- Validates each command against the filtering system before execution
- Returns appropriate error messages for denied commands
- Logs filtering decisions when debug mode is enabled

### 3. HTTP API Filtering

**Location**: `src/http-server.js` - All API endpoint handlers

HTTP API endpoints now include command filtering:
- Each REST endpoint validates the corresponding MCP command
- Returns 403 Forbidden for filtered commands
- Maintains consistent security across both MCP and HTTP interfaces

## Usage Examples

### Example 1: Development Environment (Full Access)

```bash
# Set no filtering for development
export MCP_FILTER_MODE=none

# Start the server
node src/index.js
```

**Result**: All commands available, no filtering applied.

### Example 2: Read-Only Environment

```bash
# Set read-only preset
export MCP_FILTER_MODE=preset
export MCP_COMMAND_PRESET=read-only

# Start the server
node src/index.js
```

**Result**: Only read operations and analysis tools available.

### Example 3: Custom Whitelist

```bash
# Allow only specific command groups
export MCP_FILTER_MODE=whitelist
export MCP_ALLOWED_GROUPS=read,comments,tasks

# Start the server
node src/index.js
```

**Result**: Only read operations, commenting, and task management available.

### Example 4: Production Environment

```bash
# Use production preset with additional restrictions
export MCP_FILTER_MODE=preset
export MCP_COMMAND_PRESET=production
export MCP_BLOCKED_COMMANDS=restore_snapshot,replay_to_timestamp

# Start the server
node src/index.js
```

**Result**: Production-safe operations with extra dangerous commands blocked.

## Testing the Integration

Use the provided test script to verify filtering behavior:

```bash
# Test default configuration
node test-filtering.js

# Test different modes
MCP_FILTER_MODE=none node test-filtering.js
MCP_FILTER_MODE=preset MCP_COMMAND_PRESET=read-only node test-filtering.js
```

## Debugging Filtering Issues

Enable debug mode to see filtering decisions:

```bash
export MCP_DEBUG_FILTERING=true
node src/index.js
```

This will log:
- Which commands are being filtered at tool listing
- Why specific commands are allowed or denied
- Filter configuration details

## Error Handling

### MCP Protocol Errors
- Filtered commands return `InvalidRequest` error with descriptive message
- Tool listing automatically excludes filtered tools

### HTTP API Errors
- Filtered commands return 403 Forbidden status
- Error messages include the filtering reason

## Configuration Priority

1. Environment variables (highest priority)
2. Preset configurations  
3. Default whitelist mode (lowest priority)

## Available Presets

- `read-only`: Only read and analysis operations
- `development`: Full access (same as `none` mode)
- `production`: Safe production operations
- `analysis`: Read and analysis focused
- `tasks`: Task management focused
- `modeling`: Component and relationship modeling
- `minimal`: Very limited access for testing

## Security Best Practices

1. **Use presets** for standardized environments
2. **Enable validation** in production (`MCP_VALIDATE_CONFIG=true`)
3. **Use whitelist mode** for maximum security
4. **Regular audits** of allowed commands in production
5. **Test configurations** before deployment

## Integration with External Tools

The filtering system works seamlessly with:
- **MCP Clients**: Automatically see filtered tool lists
- **HTTP APIs**: Consistent filtering across REST endpoints  
- **SSE Events**: Real-time updates respect filtering
- **Command Queue**: Queue operations respect filtering

## Environment File Integration

Use the provided environment setup script:

```bash
# Load pre-configured environments
./scripts/setup-env.sh safe    # Read-only + comments
./scripts/setup-env.sh dev     # Full access
./scripts/setup-env.sh tasks   # Task management focus
```

## Performance Impact

- **Minimal overhead**: Filtering adds microsecond-level delay
- **Reduced context**: Smaller tool lists improve agent performance
- **Early validation**: Failed commands don't reach database layer

## Troubleshooting

### Command Not Available
1. Check current filter mode: `commandFilter.config.filterMode`
2. Verify command is in allowed groups
3. Enable debug mode to see filtering decisions

### Unexpected Access
1. Verify environment variables are set correctly
2. Check for `MCP_FILTER_MODE=none` override
3. Review preset configuration

### HTTP vs MCP Differences
Both interfaces should behave identically. If not:
1. Ensure both are using the same filter configuration
2. Check for HTTP-specific overrides
3. Verify command name mapping between interfaces

## Advanced Configuration

For complex scenarios, create custom presets in `src/command-presets.js` and reference them via `MCP_COMMAND_PRESET`.

The filtering system supports all documented environment variables and provides comprehensive control over command access at both discovery and execution levels.
