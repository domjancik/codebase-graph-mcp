#!/usr/bin/env node

import { CodebaseGraphMCPServer } from './src/index.js';
import neo4j from 'neo4j-driver';

// Create a mock Neo4j driver for testing
const mockDriver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));

async function testCommentTools() {
  console.log('🧪 Testing MCP Comment Tools...\n');

  try {
    const server = new (class extends CodebaseGraphMCPServer {
      constructor() {
        super();
        this.db = {
          verifyConnection: async () => true,
          initializeSchema: async () => {},
          close: async () => {}
        };
      }
    })();

    // Setup the handlers to get the tool list
    server.setupHandlers();
    
    // Mock the tools listing
    const toolsResponse = await server.server.request({
      method: 'tools/list',
      params: {}
    });

    console.log('📋 Available Tools:');
    const commentTools = toolsResponse.result.tools.filter(tool => 
      tool.name.includes('comment') || tool.name.includes('node_comment')
    );

    if (commentTools.length > 0) {
      console.log('\n💬 Comment Management Tools Found:');
      commentTools.forEach(tool => {
        console.log(`  ✅ ${tool.name}: ${tool.description}`);
      });
      
      console.log(`\n🎉 Success! Found ${commentTools.length} comment management tools in MCP server.`);
      console.log(`📊 Total tools available: ${toolsResponse.result.tools.length}`);
    } else {
      console.log('❌ No comment tools found!');
    }

  } catch (error) {
    console.log('❌ Error testing MCP server:', error.message);
  }

  await mockDriver.close();
}

testCommentTools();
