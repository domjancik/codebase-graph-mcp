#!/usr/bin/env node

/**
 * Queue Waiter Demo - Waits for commands from external systems
 */

import { globalCommandQueue } from '../codebase-graph-mcp/src/command-queue.js';

async function runQueueWaiter() {
  const agentId = 'interactive-agent';
  
  console.log(`🤖 Starting queue waiter agent: ${agentId}`);
  console.log('⏳ Waiting for commands from external systems...');
  console.log('   - Priority: MEDIUM or higher');
  console.log('   - Task types: Any');
  console.log('   - Timeout: 5 minutes');
  console.log('');
  console.log('💡 To send a command to this agent, run in another terminal:');
  console.log('   node send-command.js');
  console.log('');
  
  try {
    const command = await globalCommandQueue.waitForCommand(agentId, {
      timeout: 300000, // 5 minutes
      filters: {
        priority: 'MEDIUM'
      }
    });
    
    console.log('✅ Received command!');
    console.log('📋 Command details:');
    console.log(JSON.stringify(command, null, 2));
    
    // Simulate processing the command
    console.log('🔄 Processing command...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Command processed successfully!');
    console.log(`🏁 Agent ${agentId} completed task`);
    
  } catch (error) {
    console.log('❌ Wait failed or timed out:', error.message);
    console.log('   This is normal if no commands were sent within 5 minutes');
  }
}

// Run the waiter
runQueueWaiter().catch(console.error);
