#!/usr/bin/env node

/**
 * List Waiting Agents CLI Tool
 * Shows all currently waiting agents and their capacity.
 * 
 * Usage:
 *   node list-agents.js [--watch] [--json]
 *   
 * Options:
 *   --watch    Continuously monitor and refresh every 5 seconds
 *   --json     Output in JSON format
 *   
 * Examples:
 *   node list-agents.js
 *   node list-agents.js --watch
 *   node list-agents.js --json
 */

import { globalCommandQueue } from '../src/command-queue.js';

class AgentCapacityMonitor {
  constructor(options = {}) {
    this.watchMode = options.watch || false;
    this.jsonOutput = options.json || false;
    this.refreshInterval = 5000; // 5 seconds
  }

  formatUptime(startTime) {
    const uptimeMs = Date.now() - new Date(startTime).getTime();
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getAgentCapacity() {
    const waitingAgents = globalCommandQueue.getWaitingAgents();
    const pendingCommands = globalCommandQueue.getPendingCommands();
    const history = globalCommandQueue.getHistory(50);

    // Calculate recent activity for each agent
    const agentActivity = {};
    history.forEach(entry => {
      if (entry.agentId && entry.action === 'COMMAND_RECEIVED') {
        if (!agentActivity[entry.agentId]) {
          agentActivity[entry.agentId] = { commandsProcessed: 0, lastCommand: null };
        }
        agentActivity[entry.agentId].commandsProcessed++;
        agentActivity[entry.agentId].lastCommand = entry.timestamp;
      }
    });

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalWaitingAgents: waitingAgents.length,
        totalPendingCommands: pendingCommands.length,
        systemLoad: pendingCommands.length > waitingAgents.length ? 'HIGH' : 
                   pendingCommands.length > 0 ? 'MEDIUM' : 'LOW'
      },
      waitingAgents: waitingAgents.map(agent => ({
        ...agent,
        uptime: this.formatUptime(agent.startedAt),
        commandsProcessed: agentActivity[agent.agentId]?.commandsProcessed || 0,
        lastCommand: agentActivity[agent.agentId]?.lastCommand || null,
        status: 'WAITING',
        availability: 'AVAILABLE'
      })),
      pendingCommands: pendingCommands.map(cmd => ({
        id: cmd.id,
        type: cmd.type,
        priority: cmd.priority,
        timestamp: cmd.timestamp,
        source: cmd.source,
        taskType: cmd.taskType
      })),
      capacityAnalysis: {
        immediateCapacity: Math.max(0, waitingAgents.length - pendingCommands.length),
        queuedWork: pendingCommands.length,
        utilizationRate: waitingAgents.length > 0 ? 
          Math.min(100, (pendingCommands.length / waitingAgents.length) * 100).toFixed(1) + '%' : 'N/A'
      }
    };
  }

  displayTextOutput(data) {
    console.clear();
    console.log('📊 AGENT CAPACITY MONITOR');
    console.log('=' .repeat(80));
    console.log(`🕐 Last updated: ${new Date(data.timestamp).toLocaleString()}`);
    console.log('');

    // Summary
    console.log('📈 SYSTEM SUMMARY:');
    console.log(`   Waiting agents: ${data.summary.totalWaitingAgents}`);
    console.log(`   Pending commands: ${data.summary.totalPendingCommands}`);
    console.log(`   System load: ${data.summary.systemLoad}`);
    console.log(`   Immediate capacity: ${data.capacityAnalysis.immediateCapacity}`);
    console.log(`   Utilization rate: ${data.capacityAnalysis.utilizationRate}`);
    console.log('');

    // Waiting Agents
    if (data.waitingAgents.length > 0) {
      console.log('🤖 WAITING AGENTS:');
      console.log('-'.repeat(80));
      console.log('Agent ID                 | Uptime    | Commands | Last Activity | Status');
      console.log('-'.repeat(80));
      
      data.waitingAgents.forEach(agent => {
        const id = agent.agentId.padEnd(24);
        const uptime = agent.uptime.padEnd(9);
        const commands = agent.commandsProcessed.toString().padEnd(8);
        const lastActivity = agent.lastCommand ? 
          new Date(agent.lastCommand).toLocaleTimeString().padEnd(13) : 
          'None'.padEnd(13);
        const status = agent.availability;
        
        console.log(`${id} | ${uptime} | ${commands} | ${lastActivity} | ${status}`);
      });
    } else {
      console.log('🤖 WAITING AGENTS: None');
    }
    console.log('');

    // Pending Commands
    if (data.pendingCommands.length > 0) {
      console.log('📋 PENDING COMMANDS:');
      console.log('-'.repeat(80));
      console.log('Command ID               | Type         | Priority | Source');
      console.log('-'.repeat(80));
      
      data.pendingCommands.forEach(cmd => {
        const id = (cmd.id || 'N/A').padEnd(24);
        const type = (cmd.type || 'N/A').padEnd(12);
        const priority = (cmd.priority || 'N/A').padEnd(8);
        const source = (cmd.source || 'N/A');
        
        console.log(`${id} | ${type} | ${priority} | ${source}`);
      });
    } else {
      console.log('📋 PENDING COMMANDS: None');
    }
    console.log('');

    if (this.watchMode) {
      console.log('👀 WATCH MODE: Refreshing every 5 seconds... Press Ctrl+C to exit');
    }
  }

  displayJsonOutput(data) {
    console.log(JSON.stringify(data, null, 2));
  }

  async start() {
    const displayData = () => {
      const data = this.getAgentCapacity();
      
      if (this.jsonOutput) {
        this.displayJsonOutput(data);
      } else {
        this.displayTextOutput(data);
      }
    };

    // Initial display
    displayData();

    if (this.watchMode && !this.jsonOutput) {
      // Set up watch mode
      const interval = setInterval(displayData, this.refreshInterval);
      
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('\n👋 Agent monitor stopped');
        process.exit(0);
      });
      
      // Keep process alive
      return new Promise(() => {});
    }
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const options = {
    watch: args.includes('--watch'),
    json: args.includes('--json')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log('List Waiting Agents CLI Tool');
    console.log('Shows all currently waiting agents and their capacity.');
    console.log('');
    console.log('Usage:');
    console.log('  node list-agents.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --watch    Continuously monitor and refresh every 5 seconds');
    console.log('  --json     Output in JSON format');
    console.log('  --help     Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node list-agents.js');
    console.log('  node list-agents.js --watch');
    console.log('  node list-agents.js --json');
    process.exit(0);
  }

  const monitor = new AgentCapacityMonitor(options);
  monitor.start().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
