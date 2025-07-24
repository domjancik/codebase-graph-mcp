/**
 * Command Presets and Groups
 * Predefined command sets for different use cases and environments.
 */

/**
 * Command groups organized by functionality
 */
export const COMMAND_GROUPS = {
  // Read-only operations
  read: [
    'get_component',
    'search_components',
    'get_component_relationships',
    'get_dependency_tree',
    'get_task',
    'get_tasks',
    'get_node_comments',
    'get_comment',
    'get_codebase_overview',
    'get_change_history',
    'list_snapshots',
    'get_history_stats',
    'get_waiting_agents',
    'get_pending_commands',
    'get_command_history'
  ],

  // Component management operations
  components: [
    'create_component',
    'create_components_bulk',
    'update_component',
    'delete_component',
    'get_component',
    'search_components'
  ],

  // Task management operations
  tasks: [
    'create_task',
    'create_tasks_bulk',
    'get_task',
    'get_tasks',
    'update_task_status'
  ],

  // Comment management operations
  comments: [
    'create_node_comment',
    'get_node_comments',
    'update_comment',
    'delete_comment',
    'get_comment'
  ],

  // Relationship management operations
  relationships: [
    'create_relationship',
    'create_relationships_bulk',
    'get_component_relationships',
    'get_dependency_tree'
  ],

  // Write operations (create, update, delete)
  write: [
    'create_component',
    'create_components_bulk',
    'update_component',
    'delete_component',
    'create_relationship',
    'create_relationships_bulk',
    'create_task',
    'create_tasks_bulk',
    'update_task_status',
    'create_node_comment',
    'update_comment',
    'delete_comment'
  ],

  // Analysis and reporting operations
  analysis: [
    'get_codebase_overview',
    'get_dependency_tree',
    'get_component_relationships',
    'search_components',
    'get_change_history',
    'get_history_stats'
  ],

  // History and snapshot operations
  history: [
    'get_change_history',
    'create_snapshot',
    'list_snapshots',
    'restore_snapshot',
    'replay_to_timestamp',
    'get_history_stats'
  ],

  // Command queue operations
  queue: [
    'wait_for_command',
    'send_command',
    'get_waiting_agents',
    'get_pending_commands',
    'cancel_command',
    'cancel_wait',
    'get_command_history'
  ],

  // Administrative operations (potentially dangerous)
  admin: [
    'delete_component',
    'restore_snapshot',
    'replay_to_timestamp',
    'cancel_command',
    'cancel_wait'
  ],

  // Documentation and metadata operations
  docs: [
    'create_node_comment',
    'get_node_comments',
    'update_comment',
    'get_comment'
  ],

  // Bulk operations
  bulk: [
    'create_components_bulk',
    'create_relationships_bulk',
    'create_tasks_bulk'
  ],

  // Linear integration operations
  linear: [
    'add_issue_relation',
    'create_comment',
    'create_issue',
    'update_issue',
    'get_issue',
    'list_issues',
    'explore_cycle_issue',
    'remove_issue_relation',
    'list_issue_relations',
    'list_issue_comments',
    'get_cycle',
    'get_cycle_issues',
    'list_cycles',
    'get_project',
    'list_projects',
    'get_team',
    'list_teams',
    'get_user',
    'list_users',
    'get_workflow_state',
    'list_workflow_states',
    'get_label',
    'list_labels',
    'execute_pipeline'
  ]
};

/**
 * Predefined presets for different environments and use cases
 */
export const PRESETS = {
  // Read-only access for analysis and reporting
  'read-only': {
    description: 'Read-only access for analysis and reporting',
    allowedGroups: ['read', 'analysis'],
    blockedGroups: ['write', 'admin'],
    allowedCommands: [],
    blockedCommands: []
  },

  // Development environment with full access
  development: {
    description: 'Full access for development environment',
    allowedGroups: ['read', 'write', 'components', 'tasks', 'relationships', 'comments', 'analysis', 'history', 'queue', 'docs', 'bulk'],
    blockedGroups: [],
    allowedCommands: [],
    blockedCommands: []
  },

  // Production environment with restricted access
  production: {
    description: 'Restricted access for production environment',
    allowedGroups: ['read', 'analysis', 'comments', 'docs'],
    blockedGroups: ['admin', 'bulk'],
    allowedCommands: ['create_task', 'update_task_status', 'create_node_comment'],
    blockedCommands: ['delete_component', 'restore_snapshot', 'replay_to_timestamp']
  },

  // Analysis and reporting focused
  analysis: {
    description: 'Analysis and reporting focused access',
    allowedGroups: ['read', 'analysis', 'history'],
    blockedGroups: ['write', 'admin'],
    allowedCommands: [],
    blockedCommands: []
  },

  // Documentation focused
  documentation: {
    description: 'Documentation and commenting focused access',
    allowedGroups: ['read', 'docs', 'comments'],
    blockedGroups: ['admin', 'bulk'],
    allowedCommands: ['create_task'],
    blockedCommands: []
  },

  // Task management focused
  tasks: {
    description: 'Task management focused access',
    allowedGroups: ['read', 'tasks', 'comments'],
    blockedGroups: ['admin', 'components', 'relationships'],
    allowedCommands: [],
    blockedCommands: []
  },

  // Component modeling focused
  modeling: {
    description: 'Component and relationship modeling focused access',
    allowedGroups: ['read', 'components', 'relationships', 'analysis'],
    blockedGroups: ['admin', 'tasks'],
    allowedCommands: [],
    blockedCommands: []
  },

  // Linear integration focused
  linear: {
    description: 'Linear integration focused access',
    allowedGroups: ['read', 'linear', 'comments'],
    blockedGroups: ['admin', 'components', 'relationships', 'tasks'],
    allowedCommands: [],
    blockedCommands: []
  },

  // Queue management focused
  queue: {
    description: 'Command queue management focused access',
    allowedGroups: ['read', 'queue'],
    blockedGroups: ['admin', 'write'],
    allowedCommands: [],
    blockedCommands: []
  },

  // Minimal access for testing
  minimal: {
    description: 'Minimal access for testing purposes',
    allowedGroups: ['read'],
    blockedGroups: ['write', 'admin', 'bulk'],
    allowedCommands: [],
    blockedCommands: []
  }
};

/**
 * Get all available command groups
 * @returns {string[]} Array of group names
 */
export function getAvailableGroups() {
  return Object.keys(COMMAND_GROUPS);
}

/**
 * Get all available presets
 * @returns {string[]} Array of preset names
 */
export function getAvailablePresets() {
  return Object.keys(PRESETS);
}

/**
 * Get commands for a specific group
 * @param {string} groupName - Name of the group
 * @returns {string[]} Array of command names in the group
 */
export function getGroupCommands(groupName) {
  return COMMAND_GROUPS[groupName] || [];
}

/**
 * Get preset configuration
 * @param {string} presetName - Name of the preset
 * @returns {Object|null} Preset configuration or null if not found
 */
export function getPreset(presetName) {
  return PRESETS[presetName] || null;
}

/**
 * Get all commands that belong to specified groups
 * @param {string[]} groupNames - Array of group names
 * @returns {string[]} Array of unique command names
 */
export function getCommandsFromGroups(groupNames) {
  const commands = new Set();
  
  for (const groupName of groupNames) {
    const groupCommands = getGroupCommands(groupName);
    groupCommands.forEach(cmd => commands.add(cmd));
  }
  
  return Array.from(commands);
}

/**
 * Check if a command belongs to any of the specified groups
 * @param {string} commandName - Name of the command
 * @param {string[]} groupNames - Array of group names to check
 * @returns {boolean} True if command belongs to any of the groups
 */
export function isCommandInGroups(commandName, groupNames) {
  for (const groupName of groupNames) {
    if (getGroupCommands(groupName).includes(commandName)) {
      return true;
    }
  }
  return false;
}

/**
 * Get which groups a command belongs to
 * @param {string} commandName - Name of the command
 * @returns {string[]} Array of group names the command belongs to
 */
export function getCommandGroups(commandName) {
  const groups = [];
  
  for (const [groupName, commands] of Object.entries(COMMAND_GROUPS)) {
    if (commands.includes(commandName)) {
      groups.push(groupName);
    }
  }
  
  return groups;
}

/**
 * Validate preset configuration
 * @param {Object} preset - Preset configuration to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validatePreset(preset) {
  const errors = [];
  
  if (!preset || typeof preset !== 'object') {
    return { isValid: false, errors: ['Preset must be an object'] };
  }

  // Check required properties
  if (!preset.description) {
    errors.push('Preset must have a description');
  }

  // Validate group names
  const allGroups = getAvailableGroups();
  
  if (preset.allowedGroups) {
    for (const group of preset.allowedGroups) {
      if (!allGroups.includes(group)) {
        errors.push(`Unknown group in allowedGroups: ${group}`);
      }
    }
  }

  if (preset.blockedGroups) {
    for (const group of preset.blockedGroups) {
      if (!allGroups.includes(group)) {
        errors.push(`Unknown group in blockedGroups: ${group}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a custom preset
 * @param {string} name - Name of the custom preset
 * @param {Object} config - Preset configuration
 * @returns {boolean} True if preset was created successfully
 */
export function createCustomPreset(name, config) {
  const validation = validatePreset(config);
  
  if (!validation.isValid) {
    console.warn(`[Command Presets] Invalid preset configuration for '${name}':`, validation.errors);
    return false;
  }

  PRESETS[name] = config;
  return true;
}

/**
 * Get detailed information about all presets
 * @returns {Object} Object with preset details
 */
export function getPresetDetails() {
  const details = {};
  
  for (const [name, preset] of Object.entries(PRESETS)) {
    const allowedCommands = getCommandsFromGroups(preset.allowedGroups || []);
    const totalAllowed = new Set([...allowedCommands, ...(preset.allowedCommands || [])]);
    
    details[name] = {
      ...preset,
      totalCommandsAllowed: totalAllowed.size,
      resolvedAllowedCommands: Array.from(totalAllowed)
    };
  }
  
  return details;
}
