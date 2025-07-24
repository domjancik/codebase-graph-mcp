# Command Filtering System Documentation

## Overview
The Command Filtering System allows you to control which MCP tools and commands can be executed in various environments. It uses environment variables or direct configuration to define presets, lists, and filtering modes.

## Configuration

### Environment Variables
- **MCP_FILTER_MODE**: Defines the filter mode, options: `whitelist`, `blacklist`, `preset`, `none`.
- **MCP_COMMAND_PRESET**: Name of the preset to apply when `preset` mode is used.
- **MCP_ALLOWED_COMMANDS**: Comma-separated list of specific commands to allow.
- **MCP_BLOCKED_COMMANDS**: Comma-separated list of specific commands to block.
- **MCP_ALLOWED_GROUPS**: Comma-separated list of command groups to allow.
- **MCP_BLOCKED_GROUPS**: Comma-separated list of command groups to block.
- **MCP_WARN_UNKNOWN_FIELDS**: Set to `true` by default to warn about unknown fields in commands.
- **MCP_STRICT_MODE**: Set to `false` by default, enforcing strict filtering if `true`.
- **MCP_DEBUG_FILTERING**: Enable debugging output by setting `true`.
- **MCP_VALIDATE_CONFIG**: Validate configurations, default is `true`.

### Presets
Predefined command scenarios for different environments:
- **read-only**: Allows only read operations.
- **development**: Allows all operations for development.
- **production**: Restricts to safe operations only.
- **analysis**: Focused on analytical functions.
- **tasks**: Task management focused.

### Command Groups
Grouped commands based on their functionalities such as `read`, `write`, `admin`, etc.

## Usage
1. **Initialize via environment:** Set the environment variables as needed before starting the MCP system.
2. **Direct Configuration:** Use `CommandFilterSystem` with custom configurations in code.

### Example Scenarios

#### Development Environment
Allow full access for developing and testing purposes.

```bash
export MCP_FILTER_MODE='none'
```

#### Production Environment
Restrict to safe operations only.

```bash
export MCP_FILTER_MODE='preset'
export MCP_COMMAND_PRESET='production'
```

#### Read-Only Environment
Allow only safe, read-oriented operations.

```bash
export MCP_FILTER_MODE='preset'
export MCP_COMMAND_PRESET='read-only'
```

### API Example
Using the Command Filtering System programmatically:

```javascript
import { CommandFilterSystem } from './src/command-filter.js';

const config = {
  filterMode: 'whitelist',
  allowedGroups: ['read'],
  allowedCommands: ['create_task'],
  blockedGroups: [],
  blockedCommands: []
};

const filter = new CommandFilterSystem(config);

try {
  filter.validateCommand('delete_component');
} catch (error) {
  console.error('Command filtering prevented execution:', error);
}
```

