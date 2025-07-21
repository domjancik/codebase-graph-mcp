#!/usr/bin/env node

/**
 * Command Sender Demo - Sends commands to waiting agents
 */

import { globalCommandQueue } from '../codebase-graph-mcp/src/command-queue.js';

async function sendCommand() {
  console.log('📤 Sending command to waiting agents...');
  
  const command = {
    type: 'EXECUTE_TASK',
    source: 'manual-trigger',
    payload: {
      taskId: 'demo-task-' + Date.now(),
      action: 'analyze_code',
      message: 'Hello from external trigger!',
      timestamp: new Date().toISOString()
    },
    priority: 'HIGH',
    taskType: 'ANALYSIS',
    targetComponentIds: ['demo-component']
  };
  
  console.log('📋 Command to send:');
  console.log(JSON.stringify(command, null, 2));
  console.log('');
  
  const result = globalCommandQueue.sendCommand(command);
  
  if (result.delivered) {
    console.log(`✅ Command delivered successfully to agent: ${result.agentId}`);
  } else {
    console.log('⏳ Command queued - no matching agents are currently waiting');
    console.log('   The command will be delivered when an agent becomes available');
  }
  
  console.log('');
  console.log('📊 Queue status:');
  const waitingAgents = globalCommandQueue.getWaitingAgents();
  const pendingCommands = globalCommandQueue.getPendingCommands();
  
  console.log(`   Waiting agents: ${waitingAgents.length}`);
  console.log(`   Pending commands: ${pendingCommands.length}`);
  
  if (waitingAgents.length > 0) {
    console.log('   Agents waiting:', waitingAgents.map(a => a.agentId).join(', '));
  }
}

// Send the command
sendCommand().catch(console.error);
