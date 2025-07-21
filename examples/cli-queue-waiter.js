#!/usr/bin/env node

/**
 * CLI-Based Queue Waiter System
 * Waits indefinitely for commands and reports available capacity.
 * 
 * Usage:
 *   node cli-queue-waiter.js [queue-session-name]
 *   
 * Example:
 *   node cli-queue-waiter.js analysis-agent-1
 *   node cli-queue-waiter.js build-agent
 *   node cli-queue-waiter.js  # Uses auto-generated ID
 */

import { globalCommandQueue } from '../src/command-queue.js';
import readline from 'readline';

class CLIQueueWaiter {
  constructor(queueId) {
    this.queueId = queueId;
    this.isRunning = false;
    this.startTime = new Date();
    this.commandsReceived = 0;
    this.lastActivity = this.startTime;
  }

  async start() {
    this.isRunning = true;
    console.log('\n' + '='.repeat(60));
    console.log(`🤖 CLI Queue Waiter Started`);
    console.log(`📋 Session ID: ${this.queueId}`);
    console.log(`⏰ Started at: ${this.startTime.toLocaleString()}`);
    console.log(`🔧 Process PID: ${process.pid}`);
    console.log('='.repeat(60));
    console.log('⏳ Waiting indefinitely for commands...');
    console.log('💡 Press Ctrl+C to stop this agent');
    console.log('');

    // Register with the global command queue
    await this.registerWithQueue();

    // Start the waiting loop
    this.startWaitingLoop();

    // Set up graceful shutdown
    this.setupShutdownHandlers();

    // Report status periodically
    this.startStatusReporting();
  }

  async registerWithQueue() {
    try {
      // Use the actual command queue system with indefinite timeout
      const waitPromise = globalCommandQueue.waitForCommand(this.queueId, {
        timeout: Number.MAX_SAFE_INTEGER, // Wait indefinitely
        filters: {} // Accept all commands
      });

      // Handle commands when received
      waitPromise.then(command => {
        this.handleCommand(command);
        // After processing, start waiting again
        setTimeout(() => this.registerWithQueue(), 1000);
      }).catch(error => {
        if (!error.message.includes('cancelled')) {
          console.log(`\n❌ Wait error: ${error.message}`);
          console.log('🔄 Restarting wait cycle...');
          setTimeout(() => this.registerWithQueue(), 2000);
        }
      });

    } catch (error) {
      console.log(`❌ Failed to register with queue: ${error.message}`);
    }
  }

  handleCommand(command) {
    this.commandsReceived++;
    this.lastActivity = new Date();
    
    console.log('\n' + '🎯'.repeat(20));
    console.log(`✅ COMMAND RECEIVED #${this.commandsReceived}`);
    console.log(`📋 Command ID: ${command.id}`);
    console.log(`🔧 Type: ${command.type}`);
    console.log(`📊 Priority: ${command.priority}`);
    console.log(`📅 Timestamp: ${command.timestamp}`);
    console.log(`📦 Payload:`, JSON.stringify(command.payload, null, 2));
    console.log('🎯'.repeat(20));
    
    // Simulate command processing
    console.log('🔄 Processing command...');
    setTimeout(() => {
      console.log(`✅ Command #${this.commandsReceived} processed successfully!`);
      console.log('⏳ Resuming wait for next command...\n');
    }, 1500);
  }

  startWaitingLoop() {
    let dots = 0;
    this.waitingInterval = setInterval(() => {
      if (this.isRunning) {
        const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
        const status = `Waiting${'.'.repeat(dots % 4).padEnd(3)} | ID: ${this.queueId} | Uptime: ${uptime}s | Commands: ${this.commandsReceived}`;
        process.stdout.write(`\r${status}`);
        dots++;
      }
    }, 800);
  }

  startStatusReporting() {
    // Report detailed status every 30 seconds
    this.statusInterval = setInterval(() => {
      if (this.isRunning) {
        const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
        const waitingAgents = globalCommandQueue.getWaitingAgents();
        const pendingCommands = globalCommandQueue.getPendingCommands();
        
        console.log('\n📊 STATUS REPORT:');
        console.log(`   Agent ID: ${this.queueId}`);
        console.log(`   Uptime: ${Math.floor(uptime / 60)}m ${uptime % 60}s`);
        console.log(`   Commands processed: ${this.commandsReceived}`);
        console.log(`   Last activity: ${this.lastActivity.toLocaleTimeString()}`);
        console.log(`   Total waiting agents: ${waitingAgents.length}`);
        console.log(`   Pending commands: ${pendingCommands.length}`);
        console.log('');
      }
    }, 30000);
  }

  setupShutdownHandlers() {
    const shutdown = () => {
      this.isRunning = false;
      
      if (this.waitingInterval) clearInterval(this.waitingInterval);
      if (this.statusInterval) clearInterval(this.statusInterval);
      
      const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
      
      console.log('\n' + '🛑'.repeat(20));
      console.log(`🛑 Queue Waiter Shutdown`);
      console.log(`📋 Session ID: ${this.queueId}`);
      console.log(`⏰ Total uptime: ${Math.floor(uptime / 60)}m ${uptime % 60}s`);
      console.log(`📊 Commands processed: ${this.commandsReceived}`);
      console.log(`📅 Shutdown at: ${new Date().toLocaleString()}`);
      console.log('🛑'.repeat(20));
      
      // Cancel any pending waits
      globalCommandQueue.cancelWait(this.queueId);
      
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

// Main execution
async function main() {
  const queueId = process.argv[2] || `cli-agent-${Date.now()}`;
  
  // Validate queue ID
  if (queueId.length > 50) {
    console.error('❌ Queue ID must be 50 characters or less');
    process.exit(1);
  }
  
  if (!/^[a-zA-Z0-9-_]+$/.test(queueId)) {
    console.error('❌ Queue ID must contain only letters, numbers, hyphens, and underscores');
    process.exit(1);
  }

  const waiter = new CLIQueueWaiter(queueId);
  await waiter.start();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
