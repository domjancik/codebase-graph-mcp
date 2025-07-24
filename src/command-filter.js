/**
 * Command Filter System
 * Handles environment-based command filtering with presets and custom configurations.
 */

import { envConfig } from './env-config.js';
import { 
  getPreset, 
  getCommandsFromGroups, 
  isCommandInGroups, 
  getCommandGroups,
  getAvailableGroups,
  getAvailablePresets 
} from './command-presets.js';

export class CommandFilterSystem {
  constructor(configOverrides = null) {
    if (configOverrides) {
      this.config = configOverrides;
    } else {
      this.config = envConfig.getConfig();
    }
    this.filteredCommands = new Set();
    this.allowedCommands = new Set();
    this.deniedCommands = new Set();
    
    this.initialize();
  }

  /**
   * Initialize the command filter system
   */
  initialize() {
    if (this.config.debugFiltering) {
      console.log('[Command Filter] Initializing with config:', this.config);
    }

    this.buildCommandSets();
    
    if (this.config.debugFiltering) {
      this.printFilterSummary();
    }
  }

  /**
   * Build the allowed and denied command sets based on configuration
   */
  buildCommandSets() {
    this.allowedCommands.clear();
    this.deniedCommands.clear();

    switch (this.config.filterMode) {
      case 'none':
        // No filtering - allow everything
        break;
        
      case 'preset':
        this.applyPresetFiltering();
        break;
        
      case 'whitelist':
        this.applyWhitelistFiltering();
        break;
        
      case 'blacklist':
        this.applyBlacklistFiltering();
        break;
        
      default:
        console.warn(`[Command Filter] Unknown filter mode: ${this.config.filterMode}, using whitelist mode`);
        this.applyWhitelistFiltering();
    }
  }

  /**
   * Apply preset-based filtering
   */
  applyPresetFiltering() {
    const preset = getPreset(this.config.preset);
    
    if (!preset) {
      console.error(`[Command Filter] Preset '${this.config.preset}' not found. Available presets:`, getAvailablePresets());
      return;
    }

    if (this.config.debugFiltering) {
      console.log(`[Command Filter] Applying preset: ${this.config.preset}`, preset);
    }

    // Add commands from allowed groups
    if (preset.allowedGroups) {
      const groupCommands = getCommandsFromGroups(preset.allowedGroups);
      groupCommands.forEach(cmd => this.allowedCommands.add(cmd));
    }

    // Add individual allowed commands
    if (preset.allowedCommands) {
      preset.allowedCommands.forEach(cmd => this.allowedCommands.add(cmd));
    }

    // Remove commands from blocked groups
    if (preset.blockedGroups) {
      const blockedGroupCommands = getCommandsFromGroups(preset.blockedGroups);
      blockedGroupCommands.forEach(cmd => {
        this.allowedCommands.delete(cmd);
        this.deniedCommands.add(cmd);
      });
    }

    // Remove individual blocked commands
    if (preset.blockedCommands) {
      preset.blockedCommands.forEach(cmd => {
        this.allowedCommands.delete(cmd);
        this.deniedCommands.add(cmd);
      });
    }

    // Apply additional environment overrides
    this.applyEnvironmentOverrides();
  }

  /**
   * Apply whitelist filtering (only allow specified commands)
   */
  applyWhitelistFiltering() {
    // Start with empty allowed set
    this.allowedCommands.clear();

    // Add commands from allowed groups
    if (this.config.allowedGroups.length > 0) {
      const groupCommands = getCommandsFromGroups(this.config.allowedGroups);
      groupCommands.forEach(cmd => this.allowedCommands.add(cmd));
    }

    // Add individual allowed commands
    this.config.allowedCommands.forEach(cmd => this.allowedCommands.add(cmd));

    // Remove blocked items
    if (this.config.blockedGroups.length > 0) {
      const blockedGroupCommands = getCommandsFromGroups(this.config.blockedGroups);
      blockedGroupCommands.forEach(cmd => {
        this.allowedCommands.delete(cmd);
        this.deniedCommands.add(cmd);
      });
    }

    this.config.blockedCommands.forEach(cmd => {
      this.allowedCommands.delete(cmd);
      this.deniedCommands.add(cmd);
    });
  }

  /**
   * Apply blacklist filtering (block specified commands, allow everything else)
   */
  applyBlacklistFiltering() {
    // In blacklist mode, we don't pre-populate allowed commands
    // Instead, we only populate denied commands
    this.deniedCommands.clear();

    // Add commands from blocked groups
    if (this.config.blockedGroups.length > 0) {
      const blockedGroupCommands = getCommandsFromGroups(this.config.blockedGroups);
      blockedGroupCommands.forEach(cmd => this.deniedCommands.add(cmd));
    }

    // Add individual blocked commands
    this.config.blockedCommands.forEach(cmd => this.deniedCommands.add(cmd));
  }

  /**
   * Apply environment variable overrides to preset configuration
   */
  applyEnvironmentOverrides() {
    // Add additional allowed commands from environment
    this.config.allowedCommands.forEach(cmd => this.allowedCommands.add(cmd));

    // Add additional allowed groups from environment
    if (this.config.allowedGroups.length > 0) {
      const groupCommands = getCommandsFromGroups(this.config.allowedGroups);
      groupCommands.forEach(cmd => this.allowedCommands.add(cmd));
    }

    // Remove additional blocked commands from environment
    this.config.blockedCommands.forEach(cmd => {
      this.allowedCommands.delete(cmd);
      this.deniedCommands.add(cmd);
    });

    // Remove additional blocked groups from environment
    if (this.config.blockedGroups.length > 0) {
      const blockedGroupCommands = getCommandsFromGroups(this.config.blockedGroups);
      blockedGroupCommands.forEach(cmd => {
        this.allowedCommands.delete(cmd);
        this.deniedCommands.add(cmd);
      });
    }
  }

  /**
   * Check if a command is allowed
   * @param {string} commandName - Name of the command to check
   * @returns {boolean} True if command is allowed
   */
  isCommandAllowed(commandName) {
    switch (this.config.filterMode) {
      case 'none':
        return true;
        
      case 'blacklist':
        return !this.deniedCommands.has(commandName);
        
      case 'whitelist':
      case 'preset':
      default:
        return this.allowedCommands.has(commandName);
    }
  }

  /**
   * Filter a command and return result with details
   * @param {string} commandName - Name of the command to filter
   * @param {Object} args - Command arguments (for unknown field checking)
   * @returns {Object} Filter result with allowed boolean and details
   */
  filterCommand(commandName, args = {}) {
    const allowed = this.isCommandAllowed(commandName);
    const commandGroups = getCommandGroups(commandName);
    
    const result = {
      commandName,
      allowed,
      reason: this.getFilterReason(commandName, allowed),
      commandGroups,
      filterMode: this.config.filterMode
    };

    // Check for unknown fields in arguments if warnings are enabled
    if (this.config.warnUnknownFields && args && typeof args === 'object') {
      const unknownFields = this.checkUnknownFields(commandName, args);
      if (unknownFields.length > 0) {
        result.warnings = result.warnings || [];
        result.warnings.push({
          type: 'unknown_fields',
          message: `Unknown fields detected: ${unknownFields.join(', ')}`,
          fields: unknownFields
        });
      }
    }

    // Log if debug mode is enabled
    if (this.config.debugFiltering) {
      console.log(`[Command Filter] ${commandName}: ${allowed ? 'ALLOWED' : 'DENIED'} - ${result.reason}`);
      if (result.warnings) {
        console.warn(`[Command Filter] ${commandName} warnings:`, result.warnings);
      }
    }

    return result;
  }

  /**
   * Get the reason why a command was allowed or denied
   * @param {string} commandName - Name of the command
   * @param {boolean} allowed - Whether the command was allowed
   * @returns {string} Human-readable reason
   */
  getFilterReason(commandName, allowed) {
    if (this.config.filterMode === 'none') {
      return 'No filtering enabled';
    }

    if (allowed) {
      if (this.allowedCommands.has(commandName)) {
        return 'Command explicitly allowed';
      } else if (this.config.filterMode === 'blacklist') {
        return 'Command not in blacklist';
      } else {
        return 'Command allowed by default';
      }
    } else {
      if (this.deniedCommands.has(commandName)) {
        return 'Command explicitly denied';
      } else if (this.config.filterMode === 'whitelist' || this.config.filterMode === 'preset') {
        return 'Command not in whitelist';
      } else {
        return 'Command denied by default';
      }
    }
  }

  /**
   * Check for unknown fields in command arguments
   * @param {string} commandName - Name of the command
   * @param {Object} args - Command arguments
   * @returns {string[]} Array of unknown field names
   */
  checkUnknownFields(commandName, args) {
    // This would ideally use the command schema to validate
    // For now, we'll just return an empty array as a placeholder
    // In a real implementation, you'd want to maintain schemas for each command
    const unknownFields = [];
    
    // Example basic validation - you'd want to expand this
    const commonFields = ['id', 'name', 'description', 'type', 'metadata'];
    
    for (const field of Object.keys(args)) {
      // This is a simplified check - in reality you'd want proper schema validation
      if (!commonFields.includes(field) && field.length > 50) {
        unknownFields.push(field);
      }
    }
    
    return unknownFields;
  }

  /**
   * Get current filter status and statistics
   * @returns {Object} Filter status information
   */
  getFilterStatus() {
    return {
      filterMode: this.config.filterMode,
      preset: this.config.preset,
      allowedCommandsCount: this.allowedCommands.size,
      deniedCommandsCount: this.deniedCommands.size,
      allowedCommands: Array.from(this.allowedCommands),
      deniedCommands: Array.from(this.deniedCommands),
      config: {
        allowedGroups: this.config.allowedGroups,
        blockedGroups: this.config.blockedGroups,
        allowedCommands: this.config.allowedCommands,
        blockedCommands: this.config.blockedCommands
      }
    };
  }

  /**
   * Print a summary of the current filter configuration
   */
  printFilterSummary() {
    console.log('\n[Command Filter] Current Configuration Summary:');
    console.log(`Filter Mode: ${this.config.filterMode}`);
    
    if (this.config.preset) {
      console.log(`Active Preset: ${this.config.preset}`);
    }
    
    if (this.allowedCommands.size > 0) {
      console.log(`Allowed Commands (${this.allowedCommands.size}):`, Array.from(this.allowedCommands));
    }
    
    if (this.deniedCommands.size > 0) {
      console.log(`Denied Commands (${this.deniedCommands.size}):`, Array.from(this.deniedCommands));
    }
    
    console.log(`Available Groups:`, getAvailableGroups());
    console.log(`Available Presets:`, getAvailablePresets());
    console.log('');
  }

  /**
   * Reload configuration (useful for runtime config changes)
   */
  reloadConfig() {
    this.config = envConfig.getConfig();
    this.initialize();
  }

  /**
   * Validate command against filter and throw error if not allowed
   * @param {string} commandName - Name of the command
   * @param {Object} args - Command arguments
   * @throws {Error} If command is not allowed
   * @returns {Object} Filter result if command is allowed
   */
  validateCommand(commandName, args = {}) {
    const result = this.filterCommand(commandName, args);
    
    if (!result.allowed) {
      const error = new Error(`Command '${commandName}' is not allowed: ${result.reason}`);
      error.code = 'COMMAND_FILTERED';
      error.filterResult = result;
      throw error;
    }

    // Issue warnings for unknown fields but don't block execution
    if (result.warnings) {
      result.warnings.forEach(warning => {
        console.warn(`[Command Filter] Warning for ${commandName}: ${warning.message}`);
      });
    }

    return result;
  }
}

// Export singleton instance
export const commandFilter = new CommandFilterSystem();
