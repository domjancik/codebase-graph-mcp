#!/usr/bin/env node

/**
 * Example usage of the Command Queue System
 * 
 * This script demonstrates how agents can wait for commands from external systems
 * like graph visualizers, and how external systems can send commands to agents.
 */

import { globalCommandQueue } from '../src/command-queue.js';

// Example: Simulating an agent waiting for commands
async function simulateAgent(agentId, filters = {}) {
  console.log(`\n🤖 Agent ${agentId} starting to wait for commands...`);
  
  try {
    const command = await globalCommandQueue.waitForCommand(agentId, {
      timeout: 30000, // 30 seconds for demo
      filters
    });
    
    console.log(`✅ Agent ${agentId} received command:`, JSON.stringify(command, null, 2));
    
    // Simulate processing the command
    console.log(`🔄 Agent ${agentId} processing command...`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
    
    console.log(`✅ Agent ${agentId} finished processing command`);
    return command;
    
  } catch (error) {
    console.log(`❌ Agent ${agentId} wait failed: ${error.message}`);
    return null;
  }
}

// Example: Simulating external system sending commands
async function simulateExternalSystem() {
  console.log('\n🌐 External system (graph visualizer) sending commands...');
  
  // Wait a moment to let agents start waiting
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send various types of commands
  const commands = [
    {
      type: 'EXECUTE_TASK',
      source: 'graph-visualizer',
      payload: {
        taskId: 'task-123',
        action: 'run_tests',
        componentPath: './src/database.js'
      },
      priority: 'HIGH',
      taskType: 'TESTING',
      targetComponentIds: ['comp-456']
    },
    {
      type: 'UPDATE_COMPONENT',
      source: 'graph-visualizer',
      payload: {
        componentId: 'comp-789',
        updates: {
          description: 'Updated from visualizer',
          metadata: { lastModified: new Date().toISOString() }
        }
      },
      priority: 'MEDIUM',
      taskType: 'UPDATE',
      targetComponentIds: ['comp-789']
    },
    {
      type: 'ANALYZE_DEPENDENCIES',
      source: 'cli-tool',
      payload: {
        rootComponent: 'comp-123',
        maxDepth: 3,
        includeTransitive: true
      },
      priority: 'LOW',
      taskType: 'ANALYSIS',
      targetComponentIds: ['comp-123']
    }
  ];
  
  // Send commands with delays
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`📤 Sending command ${i + 1}:`, command.type);
    
    const result = globalCommandQueue.sendCommand(command);
    console.log(`   Result:`, result.delivered ? `Delivered to ${result.agentId}` : 'Queued');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Example: Monitor the command queue
async function monitorQueue() {
  console.log('\n📊 Command Queue Monitor started...');
  
  const interval = setInterval(() => {
    const waitingAgents = globalCommandQueue.getWaitingAgents();
    const pendingCommands = globalCommandQueue.getPendingCommands();
    
    console.log(`\n📊 Queue Status:`);
    console.log(`   Waiting agents: ${waitingAgents.length}`);
    console.log(`   Pending commands: ${pendingCommands.length}`);
    
    if (waitingAgents.length > 0) {
      console.log('   Agents waiting:', waitingAgents.map(a => a.agentId).join(', '));
    }
    
    if (pendingCommands.length > 0) {
      console.log('   Pending commands:', pendingCommands.map(c => c.type).join(', '));
    }
  }, 5000);
  
  // Stop monitoring after 1 minute
  setTimeout(() => {
    clearInterval(interval);
    console.log('\n📊 Queue monitoring stopped');
  }, 60000);
}

// Main demo function
async function runDemo() {
  console.log('🚀 Starting Command Queue Demo');
  console.log('=====================================');
  
  // Start monitoring
  monitorQueue();
  
  // Start agents with different filters
  const agentPromises = [
    simulateAgent('agent-testing', { 
      taskTypes: ['TESTING'], 
      priority: 'MEDIUM' 
    }),
    simulateAgent('agent-update', { 
      taskTypes: ['UPDATE'], 
      componentIds: ['comp-789'] 
    }),
    simulateAgent('agent-general'), // No filters, accepts everything
  ];
  
  // Start external system after a delay
  setTimeout(() => {
    simulateExternalSystem();
  }, 2000);
  
  // Wait for all agents to complete or timeout
  const results = await Promise.allSettled(agentPromises);
  
  console.log('\n🏁 Demo completed');
  console.log('Agent results:', results.map((r, i) => ({
    agent: `agent-${i}`,
    status: r.status,
    received: r.status === 'fulfilled' && r.value !== null
  })));
  
  // Show final queue status
  const history = globalCommandQueue.getHistory(10);
  console.log('\n📜 Recent command history (last 10):');
  history.forEach(entry => {
    console.log(`   ${entry.timestamp}: ${entry.action} - Agent: ${entry.agentId || 'N/A'}`);
  });
}

// Example of how a graph visualizer might integrate
class GraphVisualizerIntegration {
  constructor() {
    this.commandQueue = globalCommandQueue;
    
    // Listen for queue events
    this.commandQueue.on('agent-waiting', this.onAgentWaiting.bind(this));
    this.commandQueue.on('command-queued', this.onCommandQueued.bind(this));
  }
  
  onAgentWaiting(data) {
    console.log(`🔔 Graph Visualizer: Agent ${data.agentId} is now waiting for commands`);
    console.log('   Filters:', JSON.stringify(data.filters));
  }
  
  onCommandQueued(command) {
    console.log(`🔔 Graph Visualizer: Command queued - ${command.type}`);
  }
  
  // Simulate user clicking "Execute Task" button in the visualizer
  executeTaskFromUI(taskId, componentId) {
    return this.commandQueue.sendCommand({
      type: 'EXECUTE_TASK',
      source: 'graph-visualizer-ui',
      payload: {
        taskId,
        componentId,
        triggeredBy: 'user-click'
      },
      priority: 'HIGH',
      taskType: 'EXECUTION',
      targetComponentIds: [componentId]
    });
  }
  
  // Simulate user updating component from the visualizer
  updateComponentFromUI(componentId, updates) {
    return this.commandQueue.sendCommand({
      type: 'UPDATE_COMPONENT',
      source: 'graph-visualizer-ui',
      payload: {
        componentId,
        updates,
        triggeredBy: 'user-edit'
      },
      priority: 'MEDIUM',
      taskType: 'UPDATE',
      targetComponentIds: [componentId]
    });
  }
}

// Run the demo if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎯 Running Command Queue Demo...\n');
  
  // Create visualizer integration
  const visualizer = new GraphVisualizerIntegration();
  
  // Run the main demo
  runDemo().catch(console.error);
  
  // Simulate some UI interactions after a delay
  setTimeout(() => {
    console.log('\n🖱️  Simulating UI interactions...');
    visualizer.executeTaskFromUI('ui-task-1', 'comp-ui-1');
    visualizer.updateComponentFromUI('comp-ui-2', { description: 'Updated from UI' });
  }, 15000);
}

export { GraphVisualizerIntegration };
