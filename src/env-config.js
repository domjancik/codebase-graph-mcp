/**
 * Environment Configuration Management
 * Handles environment variables and configuration for command filtering system.
 */

export class EnvironmentConfig {
  constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from environment variables
   * @returns {Object} Configuration object
   */
  loadConfiguration() {
    const config = {
      // Command filtering mode
      filterMode: process.env.MCP_FILTER_MODE || 'whitelist', // 'whitelist', 'blacklist', 'preset', 'none'
      
      // Command presets
      preset: process.env.MCP_COMMAND_PRESET || null, // 'read-only', 'development', 'production', 'analysis', etc.
      
      // Custom allowed/blocked commands (comma-separated)
      allowedCommands: this.parseCommaSeparated(process.env.MCP_ALLOWED_COMMANDS),
      blockedCommands: this.parseCommaSeparated(process.env.MCP_BLOCKED_COMMANDS),
      
      // Command groups (comma-separated group names)
      allowedGroups: this.parseCommaSeparated(process.env.MCP_ALLOWED_GROUPS),
      blockedGroups: this.parseCommaSeparated(process.env.MCP_BLOCKED_GROUPS),
      
      // Warning behavior
      warnUnknownFields: process.env.MCP_WARN_UNKNOWN_FIELDS !== 'false', // default true
      strictMode: process.env.MCP_STRICT_MODE === 'true', // default false
      
      // Debug mode
      debugFiltering: process.env.MCP_DEBUG_FILTERING === 'true', // default false
      
      // Configuration validation
      validateConfig: process.env.MCP_VALIDATE_CONFIG !== 'false' // default true
    };

    // Validate configuration
    if (config.validateConfig) {
      this.validateConfiguration(config);
    }

    return config;
  }

  /**
   * Parse comma-separated environment variable values
   * @param {string} value - Comma-separated string
   * @returns {string[]} Array of trimmed values
   */
  parseCommaSeparated(value) {
    if (!value || typeof value !== 'string') {
      return [];
    }
    return value.split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
  }

  /**
   * Validate the configuration
   * @param {Object} config - Configuration to validate
   */
  validateConfiguration(config) {
    const validFilterModes = ['whitelist', 'blacklist', 'preset', 'none'];
    
    if (!validFilterModes.includes(config.filterMode)) {
      console.warn(`[MCP Config] Invalid filter mode: ${config.filterMode}. Using 'whitelist' as default.`);
      config.filterMode = 'whitelist';
    }

    // Validate preset mode requirements
    if (config.filterMode === 'preset' && !config.preset) {
      console.warn('[MCP Config] Preset mode requires MCP_COMMAND_PRESET to be set. Falling back to whitelist mode.');
      config.filterMode = 'whitelist';
    }

    // Warn about conflicting configurations
    if (config.allowedCommands && config.allowedCommands.length > 0 && config.blockedCommands && config.blockedCommands.length > 0) {
      console.warn('[MCP Config] Both allowed and blocked commands specified. This may lead to unexpected behavior.');
    }

    if (config.allowedGroups && config.allowedGroups.length > 0 && config.blockedGroups && config.blockedGroups.length > 0) {
      console.warn('[MCP Config] Both allowed and blocked groups specified. This may lead to unexpected behavior.');
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration (useful for testing or runtime changes)
   * @param {Object} updates - Configuration updates
   */
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    
    if (this.config.validateConfig) {
      this.validateConfiguration(this.config);
    }
  }

  /**
   * Check if debug mode is enabled
   * @returns {boolean} Debug mode status
   */
  isDebugMode() {
    return this.config.debugFiltering;
  }

  /**
   * Check if strict mode is enabled
   * @returns {boolean} Strict mode status
   */
  isStrictMode() {
    return this.config.strictMode;
  }

  /**
   * Check if warnings for unknown fields are enabled
   * @returns {boolean} Warning status
   */
  shouldWarnUnknownFields() {
    return this.config.warnUnknownFields;
  }

  /**
   * Get filter mode
   * @returns {string} Current filter mode
   */
  getFilterMode() {
    return this.config.filterMode;
  }

  /**
   * Get preset name
   * @returns {string|null} Current preset name
   */
  getPreset() {
    return this.config.preset;
  }

  /**
   * Get allowed commands
   * @returns {string[]} Array of allowed command names
   */
  getAllowedCommands() {
    return [...this.config.allowedCommands];
  }

  /**
   * Get blocked commands
   * @returns {string[]} Array of blocked command names
   */
  getBlockedCommands() {
    return [...this.config.blockedCommands];
  }

  /**
   * Get allowed groups
   * @returns {string[]} Array of allowed group names
   */
  getAllowedGroups() {
    return [...this.config.allowedGroups];
  }

  /**
   * Get blocked groups
   * @returns {string[]} Array of blocked group names
   */
  getBlockedGroups() {
    return [...this.config.blockedGroups];
  }

  /**
   * Print current configuration (useful for debugging)
   */
  printConfig() {
    console.log('[MCP Config] Current Configuration:');
    console.log(JSON.stringify(this.config, null, 2));
  }
}

// Export singleton instance
export const envConfig = new EnvironmentConfig();
