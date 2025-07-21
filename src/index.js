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
import { ComponentType, RelationshipType, TaskStatus, ProposedType, Vote } from './models.js';
import { globalCommandQueue } from './command-queue.js';
import { CodebaseGraphHTTPServer } from './http-server.js';

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
    
    // Configuration - voting system is disabled by default
    this.config = {
      enableVoting: process.env.ENABLE_VOTING === 'true' || false,
      enableHTTP: process.env.ENABLE_HTTP !== 'false', // HTTP enabled by default
      httpOnly: process.env.HTTP_ONLY === 'true' || false // HTTP-only mode (no MCP stdio)
    };
    
    // Initialize HTTP server if enabled
    this.httpServer = this.config.enableHTTP ? new CodebaseGraphHTTPServer({
      db: this.db,
      port: process.env.HTTP_PORT || 3000,
      host: process.env.HTTP_HOST || 'localhost'
    }) : null;
    
    this.setupHandlers();
    this.proposedTypes = new Set();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const coreTools = [
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
        },

        // Bulk Operations
        {
          name: 'create_components_bulk',
          description: 'Create multiple components in a single operation (preferred for 2+ components)',
          inputSchema: {
            type: 'object',
            properties: {
              components: {
                type: 'array',
                items: {
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
              }
            },
            required: ['components']
          }
        },
        {
          name: 'create_relationships_bulk',
          description: 'Create multiple relationships in a single operation (preferred for 2+ relationships)',
          inputSchema: {
            type: 'object',
            properties: {
              relationships: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: Object.values(RelationshipType) },
                    sourceId: { type: 'string' },
                    targetId: { type: 'string' },
                    details: { type: 'object' }
                  },
                  required: ['type', 'sourceId', 'targetId']
                }
              }
            },
            required: ['relationships']
          }
        },
        {
          name: 'create_tasks_bulk',
          description: 'Create multiple tasks in a single operation (preferred for 2+ tasks)',
          inputSchema: {
            type: 'object',
            properties: {
              tasks: {
                type: 'array',
                items: {
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
              }
            },
            required: ['tasks']
          }
        },

        // Command Queue Tools
        {
          name: 'wait_for_command',
          description: 'Wait for a command from external systems (like graph visualizers). Agent will block until a command is received or timeout occurs.',
          inputSchema: {
            type: 'object',
            properties: {
              agentId: { type: 'string', description: 'Unique identifier for this agent' },
              timeout: { type: 'number', default: 300000, description: 'Timeout in milliseconds (default 5 minutes)' },
              filters: {
                type: 'object',
                properties: {
                  taskTypes: { type: 'array', items: { type: 'string' }, description: 'Types of tasks to accept' },
                  componentIds: { type: 'array', items: { type: 'string' }, description: 'Component IDs to accept commands for' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], description: 'Minimum priority level' }
                }
              }
            },
            required: ['agentId']
          }
        },
        {
          name: 'send_command',
          description: 'Send a command to waiting agents or queue it for later delivery',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Type of command (e.g., EXECUTE_TASK, UPDATE_COMPONENT)' },
              source: { type: 'string', default: 'mcp-server', description: 'Source of the command' },
              payload: { type: 'object', description: 'Command-specific data' },
              priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
              targetComponentIds: { type: 'array', items: { type: 'string' }, description: 'Component IDs this command relates to' },
              taskType: { type: 'string', description: 'Type of task if applicable' }
            },
            required: ['type', 'payload']
          }
        },
        {
          name: 'get_waiting_agents',
          description: 'Get status of agents currently waiting for commands',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_pending_commands',
          description: 'Get commands that are queued but not yet delivered',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'cancel_command',
          description: 'Cancel a pending command',
          inputSchema: {
            type: 'object',
            properties: {
              commandId: { type: 'string' }
            },
            required: ['commandId']
          }
        },
        {
          name: 'cancel_wait',
          description: 'Cancel an agent\'s wait for commands',
          inputSchema: {
            type: 'object',
            properties: {
              agentId: { type: 'string' }
            },
            required: ['agentId']
          }
        },
        {
          name: 'get_command_history',
          description: 'Get command queue execution history',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', default: 100 }
            }
          }
        }
      ];
      
      // Conditionally add voting tools if enabled
      const votingTools = this.config.enableVoting ? [
        {
          name: 'propose_type',
          description: 'Propose a new node or relationship type for community voting',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the proposed type' },
              description: { type: 'string', description: 'Description of the proposed type' },
              type: { type: 'string', enum: ['NODE', 'RELATIONSHIP'], description: 'Type of proposal' },
              createdBy: { type: 'string', description: 'ID of the proposer' },
              approvalThreshold: { type: 'number', default: 3, description: 'Number of votes needed for approval' },
              rejectionThreshold: { type: 'number', default: 3, description: 'Number of votes needed for rejection' },
              metadata: { type: 'object', description: 'Additional metadata' }
            },
            required: ['name', 'type', 'createdBy']
          }
        },
        {
          name: 'vote_on_type',
          description: 'Vote on a proposed type',
          inputSchema: {
            type: 'object',
            properties: {
              proposedTypeId: { type: 'string', description: 'ID of the proposed type' },
              voterId: { type: 'string', description: 'ID of the voter' },
              voteType: { type: 'string', enum: ['APPROVE', 'REJECT'], description: 'Type of vote' },
              reason: { type: 'string', description: 'Optional reason for the vote' }
            },
            required: ['proposedTypeId', 'voterId', 'voteType']
          }
        },
        {
          name: 'get_proposed_types',
          description: 'Get all proposed types with optional status filter',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], description: 'Filter by status' },
              type: { type: 'string', enum: ['NODE', 'RELATIONSHIP'], description: 'Filter by type' }
            }
          }
        },
        {
          name: 'get_proposed_type',
          description: 'Get details of a specific proposed type including votes',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'ID of the proposed type' }
            },
            required: ['id']
          }
        },
        {
          name: 'apply_approved_type',
          description: 'Apply an approved type to the system by adding it to the available types',
          inputSchema: {
            type: 'object',
            properties: {
              proposedTypeId: { type: 'string', description: 'ID of the approved proposed type' }
            },
            required: ['proposedTypeId']
          }
        },
        {
          name: 'get_voting_stats',
          description: 'Get statistics about the voting system',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ] : [];
      
      return {
        tools: [...coreTools, ...votingTools]
      };
    });

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
          case 'wait_for_command':
            return await this.waitForCommand(args);
          case 'send_command':
            return await this.sendCommand(args);
          case 'get_waiting_agents':
            return await this.getWaitingAgents(args);
          case 'get_pending_commands':
            return await this.getPendingCommands(args);
          case 'cancel_command':
            return await this.cancelCommand(args);
          case 'cancel_wait':
            return await this.cancelWait(args);
          case 'get_command_history':
            return await this.getCommandHistory(args);
          // Bulk operations
          case 'create_components_bulk':
            return await this.createComponentsBulk(args);
          case 'create_relationships_bulk':
            return await this.createRelationshipsBulk(args);
          case 'create_tasks_bulk':
            return await this.createTasksBulk(args);
          // Voting system tools (conditionally handled)
          case 'propose_type':
            if (!this.config.enableVoting) throw new McpError(ErrorCode.MethodNotFound, 'Voting system is disabled');
            return await this.proposeType(args);
          case 'vote_on_type':
            if (!this.config.enableVoting) throw new McpError(ErrorCode.MethodNotFound, 'Voting system is disabled');
            return await this.voteOnType(args);
          case 'get_proposed_types':
            if (!this.config.enableVoting) throw new McpError(ErrorCode.MethodNotFound, 'Voting system is disabled');
            return await this.getProposedTypes(args);
          case 'get_proposed_type':
            if (!this.config.enableVoting) throw new McpError(ErrorCode.MethodNotFound, 'Voting system is disabled');
            return await this.getProposedType(args);
          case 'apply_approved_type':
            if (!this.config.enableVoting) throw new McpError(ErrorCode.MethodNotFound, 'Voting system is disabled');
            return await this.applyApprovedType(args);
          case 'get_voting_stats':
            if (!this.config.enableVoting) throw new McpError(ErrorCode.MethodNotFound, 'Voting system is disabled');
            return await this.getVotingStats(args);
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

  // Bulk operation handlers
  async createComponentsBulk(args) {
    const results = await this.db.createComponents(args.components);
    return {
      content: [
        {
          type: 'text',
          text: `Created ${results.length} components in bulk:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  async createRelationshipsBulk(args) {
    const results = await this.db.createRelationships(args.relationships);
    return {
      content: [
        {
          type: 'text',
          text: `Created ${results.length} relationships in bulk:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  async createTasksBulk(args) {
    const results = await this.db.createTasks(args.tasks);
    return {
      content: [
        {
          type: 'text',
          text: `Created ${results.length} tasks in bulk:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  // Command Queue handlers
  async waitForCommand(args) {
    try {
      const command = await globalCommandQueue.waitForCommand(args.agentId, {
        timeout: args.timeout,
        filters: args.filters
      });
      return {
        content: [
          {
            type: 'text',
            text: `Received command for agent ${args.agentId}:\n${JSON.stringify(command, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Wait failed for agent ${args.agentId}: ${error.message}`
          }
        ]
      };
    }
  }

  async sendCommand(args) {
    const result = globalCommandQueue.sendCommand({
      type: args.type,
      source: args.source || 'mcp-server',
      payload: args.payload,
      priority: args.priority || 'MEDIUM',
      targetComponentIds: args.targetComponentIds || [],
      taskType: args.taskType
    });
    return {
      content: [
        {
          type: 'text',
          text: `Command sent:\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getWaitingAgents(args) {
    const agents = globalCommandQueue.getWaitingAgents();
    return {
      content: [
        {
          type: 'text',
          text: `Waiting agents (${agents.length}):\n${JSON.stringify(agents, null, 2)}`
        }
      ]
    };
  }

  async getPendingCommands(args) {
    const commands = globalCommandQueue.getPendingCommands();
    return {
      content: [
        {
          type: 'text',
          text: `Pending commands (${commands.length}):\n${JSON.stringify(commands, null, 2)}`
        }
      ]
    };
  }

  async cancelCommand(args) {
    const success = globalCommandQueue.cancelCommand(args.commandId);
    return {
      content: [
        {
          type: 'text',
          text: success ? `Cancelled command: ${args.commandId}` : `Command not found: ${args.commandId}`
        }
      ]
    };
  }

  async cancelWait(args) {
    const success = globalCommandQueue.cancelWait(args.agentId);
    return {
      content: [
        {
          type: 'text',
          text: success ? `Cancelled wait for agent: ${args.agentId}` : `Agent not waiting: ${args.agentId}`
        }
      ]
    };
  }

  async getCommandHistory(args) {
    const history = globalCommandQueue.getHistory(args.limit || 100);
    return {
      content: [
        {
          type: 'text',
          text: `Command history (${history.length} entries):\n${JSON.stringify(history, null, 2)}`
        }
      ]
    };
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async proposeType(args) {
    const proposedType = new ProposedType({
      ...args,
      id: this.generateId(),
      votes: 0,
      createdAt: new Date().toISOString(),
    });
    this.proposedTypes.add(proposedType);
    return {
      content: [
        {
          type: 'text',
          text: `Proposed new type: ${proposedType.name} (${proposedType.type})`
        }
      ]
    };
  }

  async voteOnType(args) {
    const proposedType = [...this.proposedTypes].find(t => t.id === args.proposedTypeId);
    if (!proposedType) {
      throw new McpError(ErrorCode.NotFound, 'Proposed type not found');
    }
    const vote = new Vote({
      ...args,
      id: this.generateId(),
      votedAt: new Date().toISOString()
    });
    proposedType.votes++;

    // Update proposal status based on vote count
    const approvalVotes = [...this.proposedTypes].filter(v => v.voteType === 'APPROVE').length;
    const rejectionVotes = [...this.proposedTypes].filter(v => v.voteType === 'REJECT').length;
    proposedType.status = proposedType.checkVoteStatus(approvalVotes, rejectionVotes);

    if (proposedType.status !== 'PENDING') {
      // Remove from proposed if approved or rejected
      this.proposedTypes.delete(proposedType);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Vote counted for proposed type: ${proposedType.name} - ${args.voteType}`
        }
      ]
    };
  }

  async getProposedTypes(args) {
    const filtered = [...this.proposedTypes].filter(t => (
      (!args.status || t.status === args.status) &&
      (!args.type || t.type === args.type)
    ));
    return {
      content: [
        {
          type: 'text',
          text: `Proposed types:\n${JSON.stringify(filtered, null, 2)}`
        }
      ]
    };
  }

  async getProposedType(args) {
    const proposedType = [...this.proposedTypes].find(t => t.id === args.id);
    if (!proposedType) {
      throw new McpError(ErrorCode.NotFound, 'Proposed type not found');
    }
    return {
      content: [
        {
          type: 'text',
          text: `Proposed type details:\n${JSON.stringify(proposedType, null, 2)}`
        }
      ]
    };
  }

  async applyApprovedType(args) {
    const proposedType = [...this.proposedTypes].find(t => t.id === args.proposedTypeId && t.status === 'APPROVED');
    if (!proposedType) {
      throw new McpError(ErrorCode.NotFound, 'Approved proposed type not found');
    }
    // Update the system with the new type, e.g., add to ComponentType or RelationshipType
    this.proposedTypes.delete(proposedType);
    return {
      content: [
        {
          type: 'text',
          text: `Approved type applied: ${proposedType.name} (${proposedType.type})`
        }
      ]
    };
  }

  async getVotingStats(args) {
    const totalProposals = this.proposedTypes.size;
    const approved = [...this.proposedTypes].filter(t => t.status === 'APPROVED').length;
    const rejected = [...this.proposedTypes].filter(t => t.status === 'REJECTED').length;
    return {
      content: [
        {
          type: 'text',
          text: `Voting stats:\nTotal: ${totalProposals}, Approved: ${approved}, Rejected: ${rejected}`
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
      
      // Start the MCP server (skip in HTTP-only mode)
      if (!this.config.httpOnly) {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Codebase Graph MCP Server running on stdio');
      } else {
        console.error('MCP Server initialized (HTTP-only mode - stdio disabled)');
      }
      
      // Start HTTP server if enabled
      if (this.httpServer) {
        try {
          await this.httpServer.start();
          console.error('HTTP Server with SSE started successfully');
        } catch (error) {
          console.error('Failed to start HTTP server:', error.message);
          console.error('Continuing with MCP server only...');
        }
      }
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async close() {
    if (this.httpServer) {
      await this.httpServer.stop();
    }
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
