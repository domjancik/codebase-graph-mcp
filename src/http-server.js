#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { EventEmitter } from 'events';
import { globalCommandQueue } from './command-queue.js';
import { GraphDatabase } from './database.js';

/**
 * HTTP Server with Server-Sent Events (SSE) support for external client integration
 * Provides REST API endpoints and real-time event streaming
 */
export class CodebaseGraphHTTPServer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      port: options.port || process.env.HTTP_PORT || 3000,
      host: options.host || process.env.HTTP_HOST || 'localhost',
      corsOrigin: options.corsOrigin || process.env.CORS_ORIGIN || '*',
      enableAuth: options.enableAuth || process.env.ENABLE_AUTH === 'true',
      ...options
    };
    
    this.app = express();
    this.server = null;
    this.db = options.db || new GraphDatabase();
    this.sseClients = new Map(); // clientId -> response object
    this.clientMetadata = new Map(); // clientId -> metadata
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // CORS configuration
    this.app.use(cors({
      origin: this.options.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-ID', 'Cache-Control']
    }));

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'connected' // TODO: check actual DB status
      });
    });
  }

  setupRoutes() {
    // SSE Event Stream endpoint
    this.app.get('/events', this.handleSSEConnection.bind(this));
    
    // Component API endpoints (with /api prefix)
    this.app.get('/api/components', this.handleGetComponents.bind(this));
    this.app.get('/api/components/:id', this.handleGetComponent.bind(this));
    this.app.post('/api/components', this.handleCreateComponent.bind(this));
    this.app.put('/api/components/:id', this.handleUpdateComponent.bind(this));
    this.app.delete('/api/components/:id', this.handleDeleteComponent.bind(this));
    
    // Component API endpoints (backward compatibility - no /api prefix)
    this.app.get('/components', this.handleGetComponents.bind(this));
    this.app.get('/components/:id', this.handleGetComponent.bind(this));
    this.app.post('/components', this.handleCreateComponent.bind(this));
    this.app.put('/components/:id', this.handleUpdateComponent.bind(this));
    this.app.delete('/components/:id', this.handleDeleteComponent.bind(this));
    
    // Relationships API endpoints
    this.app.get('/api/components/:id/relationships', this.handleGetComponentRelationships.bind(this));
    this.app.post('/api/relationships', this.handleCreateRelationship.bind(this));
    
    // Bulk operations endpoints
    this.app.post('/api/components/bulk', this.handleCreateBulkComponents.bind(this));
    this.app.post('/api/relationships/bulk', this.handleCreateBulkRelationships.bind(this));
    this.app.post('/api/tasks/bulk', this.handleCreateBulkTasks.bind(this));
    
    // Task API endpoints
    this.app.get('/api/tasks', this.handleGetTasks.bind(this));
    this.app.get('/api/tasks/:id', this.handleGetTask.bind(this));
    this.app.post('/api/tasks', this.handleCreateTask.bind(this));
    this.app.put('/api/tasks/:id', this.handleUpdateTask.bind(this));
    
    // Command Queue API endpoints
    this.app.post('/api/commands', this.handleSendCommand.bind(this));
    this.app.get('/api/commands/pending', this.handleGetPendingCommands.bind(this));
    this.app.get('/api/agents', this.handleGetWaitingAgents.bind(this));
    this.app.delete('/api/commands/:id', this.handleCancelCommand.bind(this));
    
    // Analysis endpoints
    this.app.get('/api/codebase/:name/overview', this.handleGetCodebaseOverview.bind(this));
    this.app.get('/api/components/:id/dependencies', this.handleGetDependencyTree.bind(this));
    
    // WebSocket-style command interface for real-time integration
    this.app.post('/api/agents/:agentId/wait', this.handleAgentWait.bind(this));
    this.app.delete('/api/agents/:agentId/wait', this.handleCancelAgentWait.bind(this));
  }

  setupEventHandlers() {
    // Listen to command queue events
    globalCommandQueue.on('command-queued', (command) => {
      this.broadcastSSE('command-queued', command);
    });

    globalCommandQueue.on('agent-waiting', (info) => {
      this.broadcastSSE('agent-waiting', info);
    });

    // Listen to database events (if available)
    this.db.on && this.db.on('component-created', (component) => {
      this.broadcastSSE('component-created', component);
    });
  }

  /**
   * Handle Server-Sent Events connection
   */
  handleSSEConnection(req, res) {
    const timestamp = new Date().toISOString();
    const clientId = req.headers['x-client-id'] || `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[${timestamp}] 🔄 SSE HANDSHAKE START - ClientID: ${clientId}`);
    console.log(`[${timestamp}] 📋 Request Headers:`, {
      'user-agent': req.headers['user-agent'],
      'accept': req.headers['accept'],
      'cache-control': req.headers['cache-control'],
      'connection': req.headers['connection'],
      'origin': req.headers['origin']
    });
    console.log(`[${timestamp}] 📋 Query Parameters:`, req.query);
    
    // Set SSE headers with proper CORS
    const responseHeaders = {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Credentials': 'true',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    };
    
    console.log(`[${timestamp}] 📤 Setting Response Headers:`, responseHeaders);
    
    try {
      res.writeHead(200, responseHeaders);
      console.log(`[${timestamp}] ✅ Response headers sent successfully`);
    } catch (error) {
      console.error(`[${timestamp}] ❌ Error setting response headers:`, error);
      return;
    }

    // Send initial connection confirmation immediately
    try {
      res.write(': Connected to Codebase Graph MCP Server\n');
      res.write(': SSE stream established\n\n');
      console.log(`[${timestamp}] ✅ Initial SSE comments sent`);
    } catch (error) {
      console.error(`[${timestamp}] ❌ Error sending initial comments:`, error);
      return;
    }

    // Store client connection
    this.sseClients.set(clientId, res);
    this.clientMetadata.set(clientId, {
      connectedAt: timestamp,
      userAgent: req.headers['user-agent'],
      filters: req.query.filters ? this.parseFilters(req.query.filters) : {}
    });
    console.log(`[${timestamp}] 💾 Client stored in memory. Total clients: ${this.sseClients.size}`);

    // Send initial connection event after a brief delay
    setTimeout(() => {
      const delayTimestamp = new Date().toISOString();
      console.log(`[${delayTimestamp}] 🎯 Sending 'connected' event to ${clientId}`);
      
      if (this.sseClients.has(clientId)) {
        try {
          const connectData = { 
            clientId, 
            timestamp: delayTimestamp,
            server: 'codebase-graph-mcp',
            version: '1.0.0',
            supportedEvents: [
              'component-created', 'component-updated', 'component-deleted',
              'components-bulk-created',
              'relationship-created', 'relationships-bulk-created',
              'task-created', 'task-updated', 'tasks-bulk-created',
              'command-queued', 'command-delivered',
              'agent-waiting', 'agent-stopped-waiting'
            ]
          };
          this.sendSSE(res, 'connected', connectData);
          console.log(`[${delayTimestamp}] ✅ 'connected' event sent successfully`);
        } catch (error) {
          console.error(`[${delayTimestamp}] ❌ Error sending 'connected' event:`, error);
        }
      } else {
        console.log(`[${delayTimestamp}] ⚠️  Client ${clientId} no longer exists when trying to send 'connected' event`);
      }
    }, 100);

    // Send periodic heartbeat
    const heartbeat = setInterval(() => {
      const heartbeatTimestamp = new Date().toISOString();
      if (this.sseClients.has(clientId)) {
        try {
          this.sendSSE(res, 'heartbeat', { 
            timestamp: heartbeatTimestamp,
            clientId 
          });
          console.log(`[${heartbeatTimestamp}] 💓 Heartbeat sent to ${clientId}`);
        } catch (error) {
          console.error(`[${heartbeatTimestamp}] ❌ Error sending heartbeat to ${clientId}:`, error);
          this.sseClients.delete(clientId);
          this.clientMetadata.delete(clientId);
          clearInterval(heartbeat);
        }
      } else {
        console.log(`[${heartbeatTimestamp}] 🔚 Clearing heartbeat for disconnected client ${clientId}`);
        clearInterval(heartbeat);
      }
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      const disconnectTimestamp = new Date().toISOString();
      this.sseClients.delete(clientId);
      this.clientMetadata.delete(clientId);
      clearInterval(heartbeat);
      console.log(`[${disconnectTimestamp}] 🔌 SSE client ${clientId} disconnected (close event). Remaining clients: ${this.sseClients.size}`);
    });

    req.on('error', (error) => {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] ❌ SSE client ${clientId} error:`, error);
      this.sseClients.delete(clientId);
      this.clientMetadata.delete(clientId);
      clearInterval(heartbeat);
      console.log(`[${errorTimestamp}] 🧹 Cleaned up client ${clientId} after error. Remaining clients: ${this.sseClients.size}`);
    });

    console.log(`[${timestamp}] 🎉 SSE HANDSHAKE COMPLETE - Client ${clientId} connected successfully`);
  }

  /**
   * Send SSE message to specific client
   */
  sendSSE(res, event, data) {
    const timestamp = new Date().toISOString();
    const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    
    console.log(`[${timestamp}] 📤 Sending SSE event '${event}' with data length: ${JSON.stringify(data).length}`);
    
    try {
      res.write(sseData);
      console.log(`[${timestamp}] ✅ SSE event '${event}' sent successfully`);
    } catch (error) {
      console.error(`[${timestamp}] ❌ Error sending SSE event '${event}':`, error);
      throw error; // Re-throw so caller can handle cleanup
    }
  }

  /**
   * Broadcast SSE message to all connected clients
   */
  broadcastSSE(event, data, filter = null) {
    const message = {
      event,
      data,
      timestamp: new Date().toISOString()
    };

    for (const [clientId, res] of this.sseClients) {
      try {
        // Apply filters if specified
        if (filter && !filter(this.clientMetadata.get(clientId))) {
          continue;
        }
        
        this.sendSSE(res, event, message);
      } catch (error) {
        console.error(`Error broadcasting to client ${clientId}:`, error);
        // Remove problematic client
        this.sseClients.delete(clientId);
        this.clientMetadata.delete(clientId);
      }
    }
  }

  // REST API Handlers

  async handleGetComponents(req, res) {
    try {
      const filters = {
        type: req.query.type,
        name: req.query.name,
        codebase: req.query.codebase
      };
      
      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) delete filters[key];
      });

      const components = await this.searchComponents(filters);
      res.json({ success: true, data: components });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async handleGetComponent(req, res) {
    try {
      const component = await this.getComponent({ id: req.params.id });
      if (!component) {
        return res.status(404).json({ success: false, error: 'Component not found' });
      }
      res.json({ success: true, data: component });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async handleCreateComponent(req, res) {
    try {
      const component = await this.createComponent(req.body);
      this.broadcastSSE('component-created', component);
      res.status(201).json({ success: true, data: component });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleUpdateComponent(req, res) {
    try {
      const component = await this.updateComponent({ 
        id: req.params.id, 
        updates: req.body 
      });
      this.broadcastSSE('component-updated', component);
      res.json({ success: true, data: component });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleDeleteComponent(req, res) {
    try {
      await this.deleteComponent({ id: req.params.id });
      this.broadcastSSE('component-deleted', { id: req.params.id });
      res.json({ success: true, message: 'Component deleted' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleSendCommand(req, res) {
    try {
      const result = globalCommandQueue.sendCommand(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleGetPendingCommands(req, res) {
    try {
      const commands = globalCommandQueue.getPendingCommands();
      res.json({ success: true, data: commands });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async handleGetWaitingAgents(req, res) {
    try {
      const agents = globalCommandQueue.getWaitingAgents();
      res.json({ success: true, data: agents });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async handleCancelCommand(req, res) {
    try {
      const success = globalCommandQueue.cancelCommand(req.params.id);
      res.json({ success, message: success ? 'Command cancelled' : 'Command not found' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleAgentWait(req, res) {
    try {
      const { agentId } = req.params;
      const { timeout = 300000, filters = {} } = req.body;
      
      // Start waiting for command (non-blocking for HTTP)
      globalCommandQueue.waitForCommand(agentId, { timeout, filters })
        .then(command => {
          this.broadcastSSE('command-delivered', { agentId, command });
        })
        .catch(error => {
          this.broadcastSSE('agent-wait-failed', { agentId, error: error.message });
        });
        
      res.json({ success: true, message: `Agent ${agentId} started waiting` });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleCancelAgentWait(req, res) {
    try {
      const success = globalCommandQueue.cancelWait(req.params.agentId);
      res.json({ success, message: success ? 'Wait cancelled' : 'Agent not waiting' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Missing handlers that need to be implemented
  async handleGetComponentRelationships(req, res) {
    try {
      const relationships = await this.getComponentRelationships({
        componentId: req.params.id,
        direction: req.query.direction || 'both'
      });
      res.json({ success: true, data: relationships });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async handleCreateRelationship(req, res) {
    try {
      const relationship = await this.createRelationship(req.body);
      this.broadcastSSE('relationship-created', relationship);
      res.status(201).json({ success: true, data: relationship });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleGetTasks(req, res) {
    try {
      const tasks = await this.getTasks({ status: req.query.status });
      res.json({ success: true, data: tasks });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async handleGetTask(req, res) {
    try {
      const task = await this.getTask({ id: req.params.id });
      if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }
      res.json({ success: true, data: task });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async handleCreateTask(req, res) {
    try {
      const task = await this.createTask(req.body);
      this.broadcastSSE('task-created', task);
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Bulk operation handlers
  async handleCreateBulkComponents(req, res) {
    try {
      const { components } = req.body;
      if (!Array.isArray(components) || components.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Request body must contain a non-empty array of components' 
        });
      }

      const createdComponents = await this.createComponents(components);
      
      // Broadcast bulk creation event
      this.broadcastSSE('components-bulk-created', {
        components: createdComponents,
        count: createdComponents.length
      });
      
      res.status(201).json({ 
        success: true, 
        data: createdComponents,
        count: createdComponents.length,
        message: `Successfully created ${createdComponents.length} components` 
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleCreateBulkRelationships(req, res) {
    try {
      const { relationships } = req.body;
      if (!Array.isArray(relationships) || relationships.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Request body must contain a non-empty array of relationships' 
        });
      }

      const createdRelationships = await this.createRelationships(relationships);
      
      // Broadcast bulk creation event
      this.broadcastSSE('relationships-bulk-created', {
        relationships: createdRelationships,
        count: createdRelationships.length
      });
      
      res.status(201).json({ 
        success: true, 
        data: createdRelationships,
        count: createdRelationships.length,
        message: `Successfully created ${createdRelationships.length} relationships` 
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleCreateBulkTasks(req, res) {
    try {
      const { tasks } = req.body;
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Request body must contain a non-empty array of tasks' 
        });
      }

      const createdTasks = await this.createTasks(tasks);
      
      // Broadcast bulk creation event
      this.broadcastSSE('tasks-bulk-created', {
        tasks: createdTasks,
        count: createdTasks.length
      });
      
      res.status(201).json({ 
        success: true, 
        data: createdTasks,
        count: createdTasks.length,
        message: `Successfully created ${createdTasks.length} tasks` 
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleUpdateTask(req, res) {
    try {
      const task = await this.updateTask({ 
        id: req.params.id, 
        updates: req.body 
      });
      this.broadcastSSE('task-updated', task);
      res.json({ success: true, data: task });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleGetCodebaseOverview(req, res) {
    try {
      const overview = await this.getCodebaseOverview({ codebase: req.params.name });
      res.json({ success: true, data: overview });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async handleGetDependencyTree(req, res) {
    try {
      const tree = await this.getDependencyTree({
        componentId: req.params.id,
        maxDepth: parseInt(req.query.maxDepth) || 3
      });
      res.json({ success: true, data: tree });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Delegate to database operations (these would need to be implemented)
  async searchComponents(filters) {
    return await this.db.searchComponents(filters);
  }

  async getComponent(args) {
    return await this.db.getComponent(args.id);
  }

  async createComponent(data) {
    return await this.db.createComponent(data);
  }

  async updateComponent(args) {
    return await this.db.updateComponent(args.id, args.updates);
  }

  async deleteComponent(args) {
    await this.db.deleteComponent(args.id);
    return { id: args.id };
  }

  async getComponentRelationships(args) {
    return await this.db.getComponentRelationships(args.componentId, args.direction || 'both');
  }

  async createRelationship(data) {
    return await this.db.createRelationship(data);
  }

  async getTasks(args) {
    return await this.db.getTasks(args.status);
  }

  async getTask(args) {
    return await this.db.getTask(args.id);
  }

  async createTask(data) {
    return await this.db.createTask(data);
  }

  async updateTask(args) {
    return await this.db.updateTaskStatus(args.id, args.updates.status, args.updates.progress);
  }

  async getCodebaseOverview(args) {
    return await this.db.getCodebaseOverview(args.codebase);
  }

  async getDependencyTree(args) {
    return await this.db.getDependencyTree(args.componentId, args.maxDepth || 3);
  }

  // Bulk operation delegates
  async createComponents(components) {
    return await this.db.createComponents(components);
  }

  async createRelationships(relationships) {
    return await this.db.createRelationships(relationships);
  }

  async createTasks(tasks) {
    return await this.db.createTasks(tasks);
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.options.port, this.options.host, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`HTTP Server with SSE running on http://${this.options.host}:${this.options.port}`);
          console.log(`SSE endpoint: http://${this.options.host}:${this.options.port}/events`);
          console.log(`API docs: http://${this.options.host}:${this.options.port}/health`);
          resolve();
        }
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        // Close all SSE connections
        for (const [clientId, res] of this.sseClients) {
          try {
            res.end();
          } catch (error) {
            console.error(`Error closing SSE client ${clientId}:`, error);
          }
        }
        this.sseClients.clear();
        this.clientMetadata.clear();
        
        this.server.close(() => {
          console.log('HTTP Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getStats() {
    return {
      connectedClients: this.sseClients.size,
      clients: Array.from(this.clientMetadata.entries()).map(([id, metadata]) => ({
        id,
        ...metadata
      }))
    };
  }

  parseFilters(filtersString) {
    try {
      return JSON.parse(filtersString);
    } catch (error) {
      console.warn('Failed to parse SSE filters:', error);
      return {};
    }
  }
}

export default CodebaseGraphHTTPServer;
