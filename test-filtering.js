#!/usr/bin/env node

/**
 * Test script to verify command filtering integration
 * Tests both environment variable configuration and filtering behavior
 */

import { commandFilter } from './src/command-filter.js';
import { envConfig } from './src/env-config.js';

console.log('🧪 Testing Command Filtering Integration\n');

// Test 1: Basic configuration loading
console.log('📋 Test 1: Configuration Loading');
console.log('Current filter mode:', commandFilter.config.filterMode);
console.log('Current preset:', commandFilter.config.preset);

// Test 2: Test filtering with different modes
console.log('\n📋 Test 2: Command Filtering Tests');

// Test read commands (should be allowed in most presets)
const testCommands = [
  { name: 'get_component', args: { id: 'test-123' } },
  { name: 'create_component', args: { type: 'FILE', name: 'test' } },
  { name: 'delete_component', args: { id: 'test-123' } },
  { name: 'restore_snapshot', args: { snapshotId: 'snap-123' } },
];

testCommands.forEach(test => {
  try {
    const result = commandFilter.filterCommand(test.name, test.args);
    console.log(`✅ ${test.name}: ${result.allowed ? 'ALLOWED' : 'DENIED'} - ${result.reason}`);
  } catch (error) {
    console.log(`❌ ${test.name}: ERROR - ${error.message}`);
  }
});

// Test 3: Filter status
console.log('\n📋 Test 3: Filter Status');
const status = commandFilter.getFilterStatus();
console.log(`Filter Mode: ${status.filterMode}`);
console.log(`Allowed Commands: ${status.allowedCommandsCount}`);
console.log(`Denied Commands: ${status.deniedCommandsCount}`);

if (status.allowedCommandsCount > 0) {
  console.log('Some allowed commands:', status.allowedCommands.slice(0, 5));
}

// Test 4: Environment variable configuration
console.log('\n📋 Test 4: Environment Variable Configuration');
const config = envConfig.getConfig();
console.log('Environment config:', {
  filterMode: config.filterMode,
  preset: config.preset,
  allowedGroups: config.allowedGroups,
  blockedGroups: config.blockedGroups,
  debugFiltering: config.debugFiltering
});

console.log('\n🎯 Testing Complete!');
console.log('\nTo test different configurations, try:');
console.log('  MCP_FILTER_MODE=none node test-filtering.js');
console.log('  MCP_FILTER_MODE=preset MCP_COMMAND_PRESET=read-only node test-filtering.js');
console.log('  MCP_FILTER_MODE=whitelist MCP_ALLOWED_GROUPS=read,comments node test-filtering.js');
