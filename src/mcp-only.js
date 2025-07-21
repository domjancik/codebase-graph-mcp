#!/usr/bin/env node

// Set environment variable to disable HTTP server for MCP-only mode
process.env.ENABLE_HTTP = 'false';

// Import and run the main server
import('./index.js');
