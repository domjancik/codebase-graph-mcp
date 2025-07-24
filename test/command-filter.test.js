#!/usr/bin/env node

/**
 * Test suite for Command Filter System
 * Tests environment configuration, presets, and filtering logic
 */

import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import { EnvironmentConfig } from '../src/env-config.js';
import { 
  COMMAND_GROUPS, 
  PRESETS, 
  getPreset, 
  getCommandsFromGroups,
  isCommandInGroups,
  getCommandGroups,
  validatePreset
} from '../src/command-presets.js';
import { CommandFilterSystem } from '../src/command-filter.js';

describe('EnvironmentConfig', () => {
  test('should load default configuration', () => {
    // Clear environment variables for clean test
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.MCP_FILTER_MODE;
    delete process.env.MCP_COMMAND_PRESET;
    
    const config = new EnvironmentConfig();
    const configData = config.getConfig();
    
    assert.equal(configData.filterMode, 'whitelist');
    assert.equal(configData.preset, null);
    assert.equal(configData.warnUnknownFields, true);
    assert.equal(configData.strictMode, false);
    
    // Restore environment
    process.env = originalEnv;
  });

  test('should parse comma-separated values correctly', () => {
    const config = new EnvironmentConfig();
    
    assert.deepEqual(config.parseCommaSeparated(''), []);
    assert.deepEqual(config.parseCommaSeparated('read,write'), ['read', 'write']);
    assert.deepEqual(config.parseCommaSeparated('  read  ,  write  '), ['read', 'write']);
    assert.deepEqual(config.parseCommaSeparated('read'), ['read']);
  });

  test('should validate configuration correctly', () => {
    const config = new EnvironmentConfig();
    
    // Test invalid filter mode
    const invalidConfig = { filterMode: 'invalid', validateConfig: true };
    config.validateConfiguration(invalidConfig);
    assert.equal(invalidConfig.filterMode, 'whitelist');
  });

  test('should handle environment variables', () => {
    const originalEnv = process.env;
    
    // Set test environment variables
    process.env.MCP_FILTER_MODE = 'preset';
    process.env.MCP_COMMAND_PRESET = 'read-only';
    process.env.MCP_ALLOWED_COMMANDS = 'create_task,get_component';
    process.env.MCP_DEBUG_FILTERING = 'true';
    
    const config = new EnvironmentConfig();
    const configData = config.getConfig();
    
    assert.equal(configData.filterMode, 'preset');
    assert.equal(configData.preset, 'read-only');
    assert.deepEqual(configData.allowedCommands, ['create_task', 'get_component']);
    assert.equal(configData.debugFiltering, true);
    
    // Restore environment
    process.env = originalEnv;
  });
});

describe('Command Presets', () => {
  test('should have valid command groups', () => {
    assert(typeof COMMAND_GROUPS === 'object');
    assert(Array.isArray(COMMAND_GROUPS.read));
    assert(Array.isArray(COMMAND_GROUPS.write));
    assert(COMMAND_GROUPS.read.length > 0);
    assert(COMMAND_GROUPS.write.length > 0);
  });

  test('should have valid presets', () => {
    assert(typeof PRESETS === 'object');
    assert(PRESETS['read-only']);
    assert(PRESETS.development);
    assert(PRESETS.production);
    
    const readOnlyPreset = PRESETS['read-only'];
    assert(Array.isArray(readOnlyPreset.allowedGroups));
    assert(Array.isArray(readOnlyPreset.blockedGroups));
  });

  test('should get commands from groups', () => {
    const readCommands = getCommandsFromGroups(['read']);
    assert(Array.isArray(readCommands));
    assert(readCommands.includes('get_component'));
    
    const multipleGroups = getCommandsFromGroups(['read', 'write']);
    assert(multipleGroups.length > readCommands.length);
  });

  test('should check if command is in groups', () => {
    assert(isCommandInGroups('get_component', ['read']));
    assert(isCommandInGroups('create_component', ['write']));
    assert(!isCommandInGroups('get_component', ['write']));
  });

  test('should get command groups', () => {
    const groups = getCommandGroups('get_component');
    assert(Array.isArray(groups));
    assert(groups.includes('read'));
  });

  test('should validate presets', () => {
    const validPreset = {
      description: 'Test preset',
      allowedGroups: ['read'],
      blockedGroups: ['write'],
      allowedCommands: [],
      blockedCommands: []
    };
    
    const validation = validatePreset(validPreset);
    assert(validation.isValid);
    assert.equal(validation.errors.length, 0);
    
    const invalidPreset = {
      allowedGroups: ['nonexistent_group']
    };
    
    const invalidValidation = validatePreset(invalidPreset);
    assert(!invalidValidation.isValid);
    assert(invalidValidation.errors.length > 0);
  });
});

describe('CommandFilterSystem', () => {
  test('should initialize with default configuration', () => {
    // Clear environment for clean test
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.MCP_FILTER_MODE;
    
    const filter = new CommandFilterSystem();
    const status = filter.getFilterStatus();
    
    assert.equal(status.filterMode, 'whitelist');
    
    // Restore environment
    process.env = originalEnv;
  });

  test('should filter commands in whitelist mode', () => {
    const config = {
      filterMode: 'whitelist',
      allowedGroups: ['read'],
      allowedCommands: ['create_task'],
      blockedGroups: [],
      blockedCommands: [],
      debugFiltering: false,
      warnUnknownFields: false
    };
    
    const filter = new CommandFilterSystem(config);
    
    // Should allow commands from read group
    assert(filter.isCommandAllowed('get_component'));
    
    // Should allow explicitly allowed command
    assert(filter.isCommandAllowed('create_task'));
    
    // Should not allow commands not in whitelist
    assert(!filter.isCommandAllowed('delete_component'));
  });
  test('should filter commands in blacklist mode', () => {
    // Set up blacklist mode
    const config = {
      filterMode: 'blacklist',
      blockedGroups: ['admin'],
      blockedCommands: ['create_task'],
      allowedGroups: [],
      allowedCommands: [],
      debugFiltering: false,
      warnUnknownFields: false
    };
    
    const filter = new CommandFilterSystem(config);
    
    // Should not allow blocked command
    assert(!filter.isCommandAllowed('create_task'));
    
    // Should not allow commands from blocked group
    assert(!filter.isCommandAllowed('delete_component'));
    
    // Should allow commands not in blacklist
    assert(filter.isCommandAllowed('get_component'));
  });

  test('should filter commands in preset mode', () => {
    const config = {
      filterMode: 'preset',
      preset: 'read-only',
      allowedGroups: [],
      allowedCommands: [],
      blockedGroups: [],
      blockedCommands: [],
      debugFiltering: false,
      warnUnknownFields: false
    };
    
    const filter = new CommandFilterSystem(config);
    
    // Should allow read commands
    assert(filter.isCommandAllowed('get_component'));
    
    // Should not allow write commands
    assert(!filter.isCommandAllowed('create_component'));
  });

  test('should handle no filtering mode', () => {
    const config = {
      filterMode: 'none',
      allowedGroups: [],
      allowedCommands: [],
      blockedGroups: [],
      blockedCommands: [],
      debugFiltering: false,
      warnUnknownFields: false
    };
    
    const filter = new CommandFilterSystem(config);
    
    // Should allow all commands
    assert(filter.isCommandAllowed('get_component'));
    assert(filter.isCommandAllowed('create_component'));
    assert(filter.isCommandAllowed('delete_component'));
  });

  test('should provide detailed filter results', () => {
    const config = {
      filterMode: 'whitelist',
      allowedGroups: ['read'],
      allowedCommands: [],
      blockedGroups: [],
      blockedCommands: [],
      debugFiltering: false,
      warnUnknownFields: false
    };
    
    const filter = new CommandFilterSystem(config);
    
    const allowedResult = filter.filterCommand('get_component');
    assert.equal(allowedResult.allowed, true);
    assert.equal(allowedResult.commandName, 'get_component');
    assert(Array.isArray(allowedResult.commandGroups));
    
    const deniedResult = filter.filterCommand('delete_component');
    assert.equal(deniedResult.allowed, false);
    assert.equal(deniedResult.commandName, 'delete_component');
  });

  test('should validate commands and throw errors for denied commands', () => {
    const config = {
      filterMode: 'whitelist',
      allowedGroups: [],
      allowedCommands: ['get_component'],
      blockedGroups: [],
      blockedCommands: [],
      debugFiltering: false,
      warnUnknownFields: false
    };
    
    const filter = new CommandFilterSystem(config);
    
    // Should not throw for allowed command
    const result = filter.validateCommand('get_component', {});
    assert.equal(result.allowed, true);
    
    // Should throw for denied command
    assert.throws(() => {
      filter.validateCommand('delete_component', {});
    }, (error) => {
      return error.code === 'COMMAND_FILTERED';
    });
  });

  test('should handle environment overrides with presets', () => {
    const config = {
      filterMode: 'preset',
      preset: 'read-only',
      allowedGroups: [],
      allowedCommands: ['create_task'], // Override to add write command
      blockedGroups: [],
      blockedCommands: ['get_component'], // Override to block read command
      debugFiltering: false,
      warnUnknownFields: false
    };
    
    const filter = new CommandFilterSystem(config);
    
    // Should allow overridden command
    assert(filter.isCommandAllowed('create_task'));
    
    // Should block overridden command
    assert(!filter.isCommandAllowed('get_component'));
  });
});

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Command Filter System Tests...\n');
}
