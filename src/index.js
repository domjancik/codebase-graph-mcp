#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { GraphDatabase } from './database.js';
import { ComponentType, RelationshipType, TaskStatus } from './models.js';

class CodebaseGraphMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'codebase-graph-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.db = new GraphDatabase();
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Component Management
        {
          name: 'create_component',
          description: 'Create a new codebase component',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: Object.values(ComponentType) },
              name: { type: 'string' },
              description: { type: 'string' },
              path: { type: 'string' },
              codebase: { type: 'string' },
              metadata: { type: 'object' }
            },
            required: ['type', 'name']
          }
        },
        {
          name: 'get_component',
          description: 'Retrieve a component by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            },
            required: ['id']
          }
        },
        {
          name: 'search_components',
          description: 'Search for components with filters',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: Object.values(ComponentType) },
              name: { type: 'string' },
              codebase: { type: 'string' }
            }
          }
        },
        {
          name: 'update_component',
          description: 'Update an existing component',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              updates: { type: 'object' }
            },
            required: ['id', 'updates']
          }
        },
        {
          name: 'delete_component',
          description: 'Delete a component by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            },
            required: ['id']
          }
        },

        // Relationship Management
        {
          name: 'create_relationship',
          description: 'Create a relationship between components',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: Object.values(RelationshipType) },
              sourceId: { type: 'string' },
              targetId: { type: 'string' },
              details: { type: 'object' }
            },
            required: ['type', 'sourceId', 'targetId']
          }
        },
        {
          name: 'get_component_relationships',
          description: 'Get relationships for a component',
          inputSchema: {
            type: 'object',
            properties: {
              componentId: { type: 'string' },
              direction: { type: 'string', enum: ['incoming', 'outgoing', 'both'] }
            },
            required: ['componentId']
          }
        },
        {
          name: 'get_dependency_tree',
          description: 'Get dependency tree for a component',
          inputSchema: {
            type: 'object',
            properties: {
              componentId: { type: 'string' },
              maxDepth: { type: 'number', default: 3 }
            },
            required: ['componentId']
          }
        },

        // Task Management
        {
          name: 'create_task',
          description: 'Create a new task',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string', enum: Object.values(TaskStatus), default: 'TODO' },
              progress: { type: 'number', minimum: 0, maximum: 1, default: 0 },
              relatedComponentIds: { type: 'array', items: { type: 'string' } },
              metadata: { type: 'object' }
            },
            required: ['name']
          }
        },
        {
          name: 'get_task',
          description: 'Get a task by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            },
            required: ['id']
          }
        },
        {
          name: 'get_tasks',
          description: 'Get tasks, optionally filtered by status',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: Object.values(TaskStatus) }
            }
          }
        },
        {
          name: 'update_task_status',
          description: 'Update task status and progress',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string', enum: Object.values(TaskStatus) },
              progress: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['id', 'status']
          }
        },

        // Analysis Tools
        {
          name: 'get_codebase_overview',
          description: 'Get overview statistics for a codebase',
          inputSchema: {
            type: 'object',
            properties: {
              codebase: { type: 'string' }
            },
            required: ['codebase']
          }
        },

        // Change History and Replay Tools
        {
          name: 'get_change_history',
          description: 'Get change history for an entity or recent changes',
          inputSchema: {
            type: 'object',
            properties: {
              entityId: { type: 'string' },
              limit: { type: 'number', default: 50 },
              operation: { type: 'string' }
            }
          }
        },
        {
          name: 'create_snapshot',
          description: 'Create a snapshot of the current database state',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' }
            },
            required: ['name']
          }
        },
        {
          name: 'list_snapshots',
          description: 'List all available snapshots',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'restore_snapshot',
          description: 'Restore database from a snapshot',
          inputSchema: {
            type: 'object',
            properties: {
              snapshotId: { type: 'string' },
              dryRun: { type: 'boolean', default: false }
            },
            required: ['snapshotId']
          }
        },
        {
          name: 'replay_to_timestamp',
          description: 'Replay changes to recreate database state at a specific time',
          inputSchema: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              dryRun: { type: 'boolean', default: true }
            },
            required: ['timestamp']
          }
        },
        {
          name: 'get_history_stats',
          description: 'Get statistics about change history',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_component':
            return await this.createComponent(args);
          case 'get_component':
            return await this.getComponent(args);
          case 'search_components':
            return await this.searchComponents(args);
          case 'update_component':
            return await this.updateComponent(args);
          case 'delete_component':
            return await this.deleteComponent(args);
          case 'create_relationship':
            return await this.createRelationship(args);
          case 'get_component_relationships':
            return await this.getComponentRelationships(args);
          case 'get_dependency_tree':
            return await this.getDependencyTree(args);
          case 'create_task':
            return await this.createTask(args);
          case 'get_task':
            return await this.getTask(args);
          case 'get_tasks':
            return await this.getTasks(args);
          case 'update_task_status':
            return await this.updateTaskStatus(args);
          case 'get_codebase_overview':
            return await this.getCodebaseOverview(args);
          case 'get_change_history':
            return await this.getChangeHistory(args);
          case 'create_snapshot':
            return await this.createSnapshot(args);
          case 'list_snapshots':
            return await this.listSnapshots(args);
          case 'restore_snapshot':
            return await this.restoreSnapshot(args);
          case 'replay_to_timestamp':
            return await this.replayToTimestamp(args);
          case 'get_history_stats':
            return await this.getHistoryStats(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) throw error;
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  // Component handlers
  async createComponent(args) {
    const result = await this.db.createComponent(args);
    return {
      content: [
        {
          type: 'text',
          text: `Created component: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getComponent(args) {
    const result = await this.db.getComponent(args.id);
    return {
      content: [
        {
          type: 'text',
          text: result ? JSON.stringify(result, null, 2) : 'Component not found'
        }
      ]
    };
  }

  async searchComponents(args) {
    const results = await this.db.searchComponents(args);
    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} components:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  async updateComponent(args) {
    const result = await this.db.updateComponent(args.id, args.updates);
    return {
      content: [
        {
          type: 'text',
          text: result ? `Updated component: ${JSON.stringify(result, null, 2)}` : 'Component not found'
        }
      ]
    };
  }

  async deleteComponent(args) {
    await this.db.deleteComponent(args.id);
    return {
      content: [
        {
          type: 'text',
          text: `Deleted component: ${args.id}`
        }
      ]
    };
  }

  // Relationship handlers
  async createRelationship(args) {
    const result = await this.db.createRelationship(args);
    return {
      content: [
        {
          type: 'text',
          text: `Created relationship: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getComponentRelationships(args) {
    const results = await this.db.getComponentRelationships(args.componentId, args.direction || 'both');
    return {
      content: [
        {
          type: 'text',
          text: `Relationships for component ${args.componentId}:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  async getDependencyTree(args) {
    const results = await this.db.getDependencyTree(args.componentId, args.maxDepth || 3);
    return {
      content: [
        {
          type: 'text',
          text: `Dependency tree for ${args.componentId}:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  // Task handlers
  async createTask(args) {
    const result = await this.db.createTask(args);
    return {
      content: [
        {
          type: 'text',
          text: `Created task: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getTask(args) {
    const result = await this.db.getTask(args.id);
    return {
      content: [
        {
          type: 'text',
          text: result ? JSON.stringify(result, null, 2) : 'Task not found'
        }
      ]
    };
  }

  async getTasks(args) {
    const results = await this.db.getTasks(args.status);
    return {
      content: [
        {
          type: 'text',
          text: `Tasks${args.status ? ` with status ${args.status}` : ''}:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  async updateTaskStatus(args) {
    const result = await this.db.updateTaskStatus(args.id, args.status, args.progress);
    return {
      content: [
        {
          type: 'text',
          text: result ? `Updated task: ${JSON.stringify(result, null, 2)}` : 'Task not found'
        }
      ]
    };
  }

  // Analysis handlers
  async getCodebaseOverview(args) {
    const results = await this.db.getCodebaseOverview(args.codebase);
    return {
      content: [
        {
          type: 'text',
          text: `Codebase overview for ${args.codebase}:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  // Change History handlers
  async getChangeHistory(args) {
    let results;
    if (args.entityId) {
      results = await this.db.history.getEntityHistory(args.entityId, args.limit || 50);
    } else {
      results = await this.db.history.getRecentChanges(args.limit || 100, args.operation);
    }
    return {
      content: [
        {
          type: 'text',
          text: `Change history (${results.length} entries):\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  async createSnapshot(args) {
    const result = await this.db.history.createSnapshot(args.name, { description: args.description });
    return {
      content: [
        {
          type: 'text',
          text: `Created snapshot: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async listSnapshots(args) {
    const results = await this.db.history.listSnapshots();
    return {
      content: [
        {
          type: 'text',
          text: `Available snapshots (${results.length}):\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  async restoreSnapshot(args) {
    const result = await this.db.history.restoreFromSnapshot(args.snapshotId, args.dryRun || false);
    return {
      content: [
        {
          type: 'text',
          text: `Snapshot restore result:\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async replayToTimestamp(args) {
    const result = await this.db.history.replayToTimestamp(args.timestamp, args.dryRun !== false);
    return {
      content: [
        {
          type: 'text',
          text: `Replay result:\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getHistoryStats(args) {
    const results = await this.db.history.getHistoryStats();
    return {
      content: [
        {
          type: 'text',
          text: `History statistics:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  async initialize() {
    try {
      console.error('Initializing Codebase Graph MCP Server...');
      
      // Verify database connection
      const connected = await this.db.verifyConnection();
      if (!connected) {
        throw new Error('Failed to connect to Neo4j database. Please ensure Neo4j is running on bolt://localhost:7687');
      }

      // Initialize database schema
      await this.db.initializeSchema();
      
      console.error('Database connection established and schema initialized');
      
      // Start the server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Codebase Graph MCP Server running on stdio');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async close() {
    await this.db.close();
  }
}

// Start the server
const server = new CodebaseGraphMCPServer();
await server.initialize();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down server...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down server...');
  await server.close();
  process.exit(0);
});
