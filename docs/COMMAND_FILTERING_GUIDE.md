# Command Filtering System - Complete Guide

## Overview

The Command Filtering System provides environment-based access control for MCP (Model Context Protocol) commands. It allows you to restrict which commands can be executed based on different scenarios like development, production, analysis, or custom requirements.

## Quick Start

### 1. Choose Your Environment

Use the setup script to quickly configure your environment:

```bash
# List available environments
./scripts/setup-env.sh list

# Load development environment (no restrictions)
./scripts/setup-env.sh dev

# Load safe environment (read-only + comments)
./scripts/setup-env.sh safe

# Show current configuration
./scripts/setup-env.sh current
```

### 2. Available Environments

| Environment | Description | Use Case |
|-------------|-------------|----------|
| `dev` | No filtering, full access | Local development and debugging |
| `safe` | Read-only + documentation | Analysis and documentation work |
| `tasks` | Task management focused | Project management workflows |
| `modeling` | Component/relationship focused | Architecture and design work |
| `custom` | Customizable whitelist template | Specific security requirements |

## Environment Variables Reference

### Core Configuration
- **`MCP_FILTER_MODE`** - Filter mode: `none`, `whitelist`, `blacklist`, `preset`
- **`MCP_COMMAND_PRESET`** - Predefined preset name when using `preset` mode

### Command Control
- **`MCP_ALLOWED_COMMANDS`** - Comma-separated list of allowed commands
- **`MCP_BLOCKED_COMMANDS`** - Comma-separated list of blocked commands
- **`MCP_ALLOWED_GROUPS`** - Comma-separated list of allowed command groups
- **`MCP_BLOCKED_GROUPS`** - Comma-separated list of blocked command groups

### Behavior Control
- **`MCP_WARN_UNKNOWN_FIELDS`** - Warn about unknown fields (default: `true`)
- **`MCP_STRICT_MODE`** - Strict enforcement mode (default: `false`)
- **`MCP_DEBUG_FILTERING`** - Enable debug output (default: `false`)
- **`MCP_VALIDATE_CONFIG`** - Validate configuration (default: `true`)

## Filter Modes

### 1. None Mode (`none`)
**Description**: No filtering - all commands allowed  
**Use Case**: Development environments where full access is needed

```bash
export MCP_FILTER_MODE=none
```

### 2. Whitelist Mode (`whitelist`)
**Description**: Only explicitly allowed commands/groups are permitted  
**Use Case**: High-security environments with specific requirements

```bash
export MCP_FILTER_MODE=whitelist
export MCP_ALLOWED_GROUPS=read,comments
export MCP_ALLOWED_COMMANDS=create_task,update_task_status
```

### 3. Blacklist Mode (`blacklist`)
**Description**: All commands allowed except explicitly blocked ones  
**Use Case**: Generally permissive with specific restrictions

```bash
export MCP_FILTER_MODE=blacklist
export MCP_BLOCKED_GROUPS=admin
export MCP_BLOCKED_COMMANDS=delete_component,restore_snapshot
```

### 4. Preset Mode (`preset`)
**Description**: Use predefined configurations with optional overrides  
**Use Case**: Standardized environments with flexibility

```bash
export MCP_FILTER_MODE=preset
export MCP_COMMAND_PRESET=production
export MCP_ALLOWED_COMMANDS=create_task  # Additional override
```

## Available Presets

### Read-Only (`read-only`)
- **Groups**: `read`, `analysis`
- **Blocked**: `write`, `admin`
- **Use Case**: Analysis, reporting, documentation review

### Development (`development`)
- **Groups**: All groups allowed
- **Blocked**: None
- **Use Case**: Full development access

### Production (`production`)
- **Groups**: `read`, `analysis`, `comments`, `docs`
- **Blocked**: `admin`, `bulk`
- **Additional**: Limited task operations
- **Use Case**: Production environments

### Analysis (`analysis`)
- **Groups**: `read`, `analysis`, `history`
- **Blocked**: `write`, `admin`
- **Use Case**: Data analysis and reporting

### Tasks (`tasks`)
- **Groups**: `read`, `tasks`, `comments`
- **Blocked**: `admin`, `components`, `relationships`
- **Use Case**: Project management focus

### Modeling (`modeling`)
- **Groups**: `read`, `components`, `relationships`, `analysis`
- **Blocked**: `admin`, `tasks`
- **Use Case**: Architecture and system design

## Command Groups

### Core Groups
- **`read`** - Read-only operations (get, search, list)
- **`write`** - Write operations (create, update, delete)
- **`admin`** - Administrative operations (delete, restore, etc.)

### Functional Groups
- **`components`** - Component management
- **`tasks`** - Task management
- **`comments`** - Comment operations
- **`relationships`** - Relationship management
- **`history`** - History and snapshots
- **`analysis`** - Analysis and reporting
- **`queue`** - Command queue operations
- **`bulk`** - Bulk operations
- **`docs`** - Documentation operations

## Common Use Cases

### Local Development Agent
```bash
# Full access for development
./scripts/setup-env.sh dev
```

### Documentation Agent
```bash
# Safe environment for docs
./scripts/setup-env.sh safe
```

### Project Manager Agent
```bash
# Task-focused environment
./scripts/setup-env.sh tasks
```

### System Architect Agent
```bash
# Component modeling focused
./scripts/setup-env.sh modeling
```

### Custom Security Requirements
```bash
# Start with custom template
./scripts/setup-env.sh custom
# Then modify environments/local-custom.env as needed
```

## Integration with MCP Server

### Method 1: Environment Variables
Set environment variables before starting the MCP server:

```bash
source environments/local-safe.env
node src/index.js
```

### Method 2: Direct Integration
Integrate with the MCP server code:

```javascript
import { commandFilter } from './src/command-filter.js';

// In your MCP request handler
export const handler = async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Validate command before execution
    commandFilter.validateCommand(name, args);
    
    // Execute the actual command
    return await executeCommand(name, args);
  } catch (error) {
    if (error.code === 'COMMAND_FILTERED') {
      return {
        error: {
          code: 'FORBIDDEN',
          message: `Command '${name}' is not allowed: ${error.filterResult.reason}`
        }
      };
    }
    throw error;
  }
};
```

## Troubleshooting

### Debug Mode
Enable debug output to see filtering decisions:

```bash
export MCP_DEBUG_FILTERING=true
```

### Check Current Configuration
```bash
./scripts/setup-env.sh current
```

### Validation Errors
If you see configuration warnings, check:
1. Environment variable names are correct
2. Command/group names exist
3. Preset names are valid

### Unknown Commands
If a command is being blocked unexpectedly:
1. Check which groups the command belongs to
2. Verify your filter mode and configuration
3. Use debug mode to see filtering decisions

## Best Practices

### Security
1. Use `preset` mode for standardized environments
2. Always validate configurations in production
3. Use `whitelist` mode for high-security requirements
4. Regular audit of allowed commands

### Development
1. Use `none` mode for local development
2. Enable debug mode during setup
3. Test filtering before deploying
4. Document custom configurations

### Operations
1. Use environment-specific configurations
2. Version control your environment files
3. Monitor filtering decisions in logs
4. Have rollback procedures ready

## Advanced Configuration

### Custom Presets
Create custom presets by adding to `src/command-presets.js`:

```javascript
export const PRESETS = {
  // ... existing presets
  'my-custom-preset': {
    description: 'My custom configuration',
    allowedGroups: ['read', 'custom-group'],
    blockedGroups: ['admin'],
    allowedCommands: ['special-command'],
    blockedCommands: []
  }
};
```

### Runtime Configuration Changes
```javascript
import { commandFilter } from './src/command-filter.js';

// Reload configuration from environment
commandFilter.reloadConfig();

// Get current status
const status = commandFilter.getFilterStatus();
console.log('Current filter status:', status);
```

## Testing

Run the test suite to verify functionality:

```bash
node test/command-filter.test.js
```

The tests cover:
- Environment configuration loading
- Command group functionality  
- All filter modes
- Preset functionality
- Error handling
- Edge cases

This comprehensive guide should help you effectively use the command filtering system for securing and controlling MCP command execution in various environments.
