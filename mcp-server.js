import { v4 as uuidv4 } from 'uuid';
import neo4j from 'neo4j-driver';

/**
 * Comprehensive MCP Server implementing all 59 tools for Linear integration and codebase management
 * 
 * Categories:
 * - Linear Integration (20+ tools)
 * - Component Management (7 tools) 
 * - Task Management (5 tools)
 * - Comment Management (5 tools)
 * - Relationship Management (4 tools)
 * - Command Queue System (8 tools)
 * - Snapshot Management (6 tools)
 * - Utility tools (4+ tools)
 */
class MCPServer {
  constructor(neo4jDriver) {
    this.driver = neo4jDriver;
    this.commandQueue = new Map();
    this.waitingAgents = new Map();
    this.snapshots = new Map();
    this.changeHistory = [];
  }

  // ============================================================================
  // LINEAR INTEGRATION TOOLS
  // ============================================================================

  async addIssueRelation({ issueId, relatedIssueId, type }) {
    // Mock Linear API implementation
    const relationId = uuidv4();
    return { 
      id: relationId, 
      issueId, 
      relatedIssueId, 
      type,
      created: new Date().toISOString() 
    };
  }

  async createComment({ issueId, body }) {
    const commentId = uuidv4();
    return {
      id: commentId,
      issueId,
      body,
      created: new Date().toISOString(),
      author: 'mcp-server'
    };
  }

  async createIssue({ title, teamId, description, assigneeId, priority }) {
    const issueId = uuidv4();
    return {
      id: issueId,
      title,
      teamId,
      description,
      assigneeId,
      priority,
      status: 'Todo',
      created: new Date().toISOString()
    };
  }

  async updateIssue({ issueId, title, description, assigneeId, stateId, priority, projectId, parentId, addLabelIds, removeLabelIds }) {
    return {
      id: issueId,
      title,
      description,
      assigneeId,
      stateId,
      priority,
      projectId,
      parentId,
      updated: new Date().toISOString()
    };
  }

  async getIssue({ id }) {
    return {
      id,
      title: `Issue ${id}`,
      description: 'Mock issue description',
      status: 'In Progress',
      priority: 2
    };
  }

  async listIssues({ first = 50, teamId, assigneeId, stateId, priority, projectId, labelId }) {
    const issues = Array.from({ length: Math.min(first, 10) }, (_, i) => ({
      id: uuidv4(),
      title: `Issue ${i + 1}`,
      description: `Mock issue ${i + 1}`,
      teamId,
      assigneeId,
      priority: i % 5
    }));
    
    return { issues, hasNextPage: false };
  }

  async exploreCycleIssue({ id }) {
    return this.getIssue({ id });
  }

  async removeIssueRelation({ relationId }) {
    return { success: true, relationId };
  }

  async listIssueRelations({ issueId, first = 50 }) {
    return {
      relations: [],
      hasNextPage: false
    };
  }

  async listIssueComments({ issueId, first = 20 }) {
    return {
      comments: [],
      hasNextPage: false
    };
  }

  async getCycle({ id }) {
    return {
      id,
      name: `Cycle ${id}`,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  async getCycleIssues({ cycleId, first = 50 }) {
    return this.listIssues({ first });
  }

  async listCycles({ first = 50 }) {
    const cycles = Array.from({ length: Math.min(first, 5) }, (_, i) => ({
      id: uuidv4(),
      name: `Cycle ${i + 1}`,
      number: i + 1
    }));
    
    return { cycles, hasNextPage: false };
  }

  async getProject({ id }) {
    return {
      id,
      name: `Project ${id}`,
      description: 'Mock project description'
    };
  }

  async listProjects({ first = 50 }) {
    const projects = Array.from({ length: Math.min(first, 3) }, (_, i) => ({
      id: uuidv4(),
      name: `Project ${i + 1}`
    }));
    
    return { projects, hasNextPage: false };
  }

  async getTeam({ id }) {
    return {
      id,
      name: `Team ${id}`,
      key: `T${id.slice(0, 3)}`
    };
  }

  async listTeams({ first = 50, includeArchived = false }) {
    const teams = Array.from({ length: Math.min(first, 3) }, (_, i) => ({
      id: uuidv4(),
      name: `Team ${i + 1}`,
      key: `T${i + 1}`
    }));
    
    return { teams, hasNextPage: false };
  }

  async getUser({ id }) {
    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`
    };
  }

  async listUsers({ first = 50, includeArchived = false }) {
    const users = Array.from({ length: Math.min(first, 5) }, (_, i) => ({
      id: uuidv4(),
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`
    }));
    
    return { users, hasNextPage: false };
  }

  async getWorkflowState({ id }) {
    return {
      id,
      name: `State ${id}`,
      type: 'started'
    };
  }

  async listWorkflowStates({ first = 50, teamId }) {
    const states = ['Todo', 'In Progress', 'In Review', 'Done'].map((name, i) => ({
      id: uuidv4(),
      name,
      type: i === 0 ? 'unstarted' : i === 3 ? 'completed' : 'started'
    }));
    
    return { states, hasNextPage: false };
  }

  async getLabel({ id }) {
    return {
      id,
      name: `Label ${id}`,
      color: '#ff0000'
    };
  }

  async listLabels({ first = 50 }) {
    const labels = ['bug', 'feature', 'enhancement'].map(name => ({
      id: uuidv4(),
      name,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    }));
    
    return { labels, hasNextPage: false };
  }

  async executePipeline({ steps }) {
    const results = [];
    for (const step of steps) {
      try {
        const result = await this.handleRequest(step.toolName, step.params);
        results.push({ success: true, result, toolName: step.toolName });
      } catch (error) {
        results.push({ success: false, error: error.message, toolName: step.toolName });
      }
    }
    return { results, completed: new Date().toISOString() };
  }

  // ============================================================================
  // COMPONENT MANAGEMENT TOOLS
  // ============================================================================

  async createComponent({ type, name, description, codebase, path, metadata }) {
    const session = this.driver.session();
    try {
      const componentId = uuidv4();
      const metadataProps = metadata ? Object.entries(metadata).map(([k, v]) => `${k}: $metadata_${k}`).join(', ') : '';
      const metadataParams = metadata ? Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata_${k}`, String(v)])) : {};
      
      await session.run(`
        CREATE (c:Component {
          id: $id,
          type: $type,
          name: $name,
          description: $description,
          codebase: $codebase,
          path: $path,
          created: datetime(),
          ${metadataProps}
        })
      `, {
        id: componentId,
        type,
        name,
        description: description || '',
        codebase: codebase || '',
        path: path || '',
        ...metadataParams
      });

      this.addToHistory('CREATE_COMPONENT', { componentId, type, name, codebase });
      
      return {
        id: componentId,
        type,
        name,
        description,
        codebase,
        path,
        metadata
      };
    } finally {
      await session.close();
    }
  }

  async createComponentsBulk({ components }) {
    const createdComponents = [];
    for (const component of components) {
      const created = await this.createComponent(component);
      createdComponents.push(created);
    }
    return createdComponents;
  }

  async updateComponent({ id, updates }) {
    const session = this.driver.session();
    try {
      const setClause = Object.entries(updates)
        .map(([key, value]) => `c.${key} = $${key}`)
        .join(', ');
      
      await session.run(`
        MATCH (c:Component {id: $id})
        SET ${setClause}, c.updated = datetime()
        RETURN c
      `, { id, ...updates });

      this.addToHistory('UPDATE_COMPONENT', { componentId: id, updates });
      
      return { id, ...updates, updated: new Date().toISOString() };
    } finally {
      await session.close();
    }
  }

  async deleteComponent({ id }) {
    const session = this.driver.session();
    try {
      await session.run(`
        MATCH (c:Component {id: $id})
        DETACH DELETE c
      `, { id });

      this.addToHistory('DELETE_COMPONENT', { componentId: id });
      
      return { success: true, id };
    } finally {
      await session.close();
    }
  }

  async getComponent({ id }) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (c:Component {id: $id})
        RETURN c
      `, { id });
      
      if (result.records.length === 0) {
        throw new Error(`Component with id ${id} not found`);
      }
      
      return result.records[0].get('c').properties;
    } finally {
      await session.close();
    }
  }

  async searchComponents({ name, type, codebase }) {
    const session = this.driver.session();
    try {
      let whereClause = [];
      const params = {};
      
      if (name) {
        whereClause.push('c.name CONTAINS $name');
        params.name = name;
      }
      if (type) {
        whereClause.push('c.type = $type');
        params.type = type;
      }
      if (codebase) {
        whereClause.push('c.codebase = $codebase');
        params.codebase = codebase;
      }
      
      const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
      
      const result = await session.run(`
        MATCH (c:Component)
        ${whereString}
        RETURN c
        ORDER BY c.name
      `, params);
      
      return result.records.map(record => record.get('c').properties);
    } finally {
      await session.close();
    }
  }

  async getCodebaseOverview({ codebase }) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (c:Component {codebase: $codebase})
        RETURN c.type as type, count(*) as count
        ORDER BY count DESC
      `, { codebase });
      
      return {
        codebase,
        overview: result.records.map(record => ({
          type: record.get('type'),
          count: record.get('count').toNumber()
        })),
        totalComponents: result.records.reduce((sum, record) => sum + record.get('count').toNumber(), 0)
      };
    } finally {
      await session.close();
    }
  }

  // ============================================================================
  // TASK MANAGEMENT TOOLS
  // ============================================================================

  async createTask({ name, description, status = 'TODO', progress = 0, codebase, relatedComponentIds = [], metadata }) {
    // Validate progress value
    if (typeof progress !== 'number') {
      throw new Error('Progress must be a number');
    }
    if (progress < 0 || progress > 1) {
      throw new Error('Progress must be between 0 and 1 (inclusive)');
    }
    
    const session = this.driver.session();
    try {
      const taskId = uuidv4();
      const metadataProps = metadata ? Object.entries(metadata).map(([k, v]) => `${k}: $metadata_${k}`).join(', ') : '';
      const metadataParams = metadata ? Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata_${k}`, String(v)])) : {};
      
      await session.run(`
        CREATE (t:Task {
          id: $id,
          name: $name,
          description: $description,
          status: $status,
          progress: $progress,
          codebase: $codebase,
          created: datetime(),
          ${metadataProps}
        })
      `, {
        id: taskId,
        name,
        description: description || '',
        status,
        progress,
        codebase: codebase || '',
        ...metadataParams
      });

      // Create relationships to components
      if (relatedComponentIds.length > 0) {
        await session.run(`
          MATCH (t:Task {id: $taskId})
          MATCH (c:Component)
          WHERE c.id IN $componentIds
          CREATE (t)-[:RELATES_TO]->(c)
        `, { taskId, componentIds: relatedComponentIds });
      }

      this.addToHistory('CREATE_TASK', { taskId, name, status, codebase });
      
      return {
        id: taskId,
        name,
        description,
        status,
        progress,
        codebase,
        relatedComponentIds,
        metadata
      };
    } finally {
      await session.close();
    }
  }

  async createTasksBulk({ tasks }) {
    const createdTasks = [];
    for (const task of tasks) {
      const created = await this.createTask(task);
      createdTasks.push(created);
    }
    return createdTasks;
  }

  async getTask({ id }) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (t:Task {id: $id})
        OPTIONAL MATCH (t)-[:RELATES_TO]->(c:Component)
        RETURN t, collect(c.id) as relatedComponentIds, collect(c) as relatedComponents
      `, { id });
      
      if (result.records.length === 0) {
        throw new Error(`Task with id ${id} not found`);
      }
      
      const record = result.records[0];
      return {
        ...record.get('t').properties,
        relatedComponentIds: record.get('relatedComponentIds'),
        relatedComponents: record.get('relatedComponents').map(c => c.properties)
      };
    } finally {
      await session.close();
    }
  }

  async getTasks({ status }) {
    const session = this.driver.session();
    try {
      let whereClause = status ? 'WHERE t.status = $status' : '';
      const params = status ? { status } : {};
      
      const result = await session.run(`
        MATCH (t:Task)
        ${whereClause}
        OPTIONAL MATCH (t)-[:RELATES_TO]->(c:Component)
        RETURN t, collect(c.id) as relatedComponentIds, collect(c) as relatedComponents
        ORDER BY t.name
      `, params);
      
      return result.records.map(record => ({
        ...record.get('t').properties,
        relatedComponentIds: record.get('relatedComponentIds'),
        relatedComponents: record.get('relatedComponents').map(c => c.properties)
      }));
    } finally {
      await session.close();
    }
  }

  async searchTasks({ search, status, progressMin, progressMax, createdAfter, createdBefore, componentIds, orderBy, orderDirection, limit }) {
    const session = this.driver.session();
    try {
      let query = 'MATCH (t:Task)';
      const params = {};
      const conditions = [];
      
      // Text search in name and description
      if (search && search.trim()) {
        conditions.push('(toLower(t.name) CONTAINS toLower($search) OR toLower(t.description) CONTAINS toLower($search))');
        params.search = search.trim();
      }
      
      // Status filter
      if (status) {
        if (Array.isArray(status)) {
          conditions.push('t.status IN $status');
          params.status = status;
        } else {
          conditions.push('t.status = $status');
          params.status = status;
        }
      }
      
      // Progress range filter
      if (progressMin !== undefined || progressMax !== undefined) {
        if (progressMin !== undefined && progressMax !== undefined) {
          conditions.push('t.progress >= $progressMin AND t.progress <= $progressMax');
          params.progressMin = progressMin;
          params.progressMax = progressMax;
        } else if (progressMin !== undefined) {
          conditions.push('t.progress >= $progressMin');
          params.progressMin = progressMin;
        } else {
          conditions.push('t.progress <= $progressMax');
          params.progressMax = progressMax;
        }
      }
      
      // Date range filter for creation date
      if (createdAfter || createdBefore) {
        if (createdAfter && createdBefore) {
          conditions.push('datetime(t.created) >= datetime($createdAfter) AND datetime(t.created) <= datetime($createdBefore)');
          params.createdAfter = createdAfter;
          params.createdBefore = createdBefore;
        } else if (createdAfter) {
          conditions.push('datetime(t.created) >= datetime($createdAfter)');
          params.createdAfter = createdAfter;
        } else {
          conditions.push('datetime(t.created) <= datetime($createdBefore)');
          params.createdBefore = createdBefore;
        }
      }
      
      // Component-based filter
      if (componentIds && componentIds.length > 0) {
        query += ` 
          OPTIONAL MATCH (t)-[:RELATES_TO]->(c:Component)
          WITH t, collect(c) as allComponents
          WHERE ANY(comp IN allComponents WHERE comp.id IN $componentIds)
        `;
        params.componentIds = componentIds;
      } else {
        query += ' OPTIONAL MATCH (t)-[:RELATES_TO]->(c:Component)';
      }
      
      // Add WHERE conditions if any
      if (conditions.length > 0) {
        const whereClause = conditions.join(' AND ');
        if (componentIds && componentIds.length > 0) {
          // WHERE already added in component filter
          query = query.replace('WHERE ANY', 'AND (' + whereClause + ') AND ANY');
        } else {
          query += ' WHERE ' + whereClause;
        }
      }
      
      // Final part of query with grouping
      if (componentIds && componentIds.length > 0) {
        query += ' RETURN t, allComponents as relatedComponents, [comp IN allComponents | comp.id] as relatedComponentIds';
      } else {
        query += ' WITH t, collect(c) as relatedComponents, collect(c.id) as relatedComponentIds RETURN t, relatedComponents, relatedComponentIds';
      }
      
      // Add ordering
      if (orderBy) {
        const orderField = orderBy === 'created' ? 't.created' : 
                          orderBy === 'name' ? 't.name' : 
                          orderBy === 'status' ? 't.status' :
                          orderBy === 'progress' ? 't.progress' : 't.created';
        const orderDir = orderDirection === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${orderField} ${orderDir}`;
      } else {
        query += ' ORDER BY t.created DESC';
      }
      
      // Add limit
      const queryLimit = limit && limit > 0 ? Math.min(limit, 1000) : 100;
      query += ` LIMIT ${queryLimit}`;
      
      const result = await session.run(query, params);
      return result.records.map(record => ({
        ...record.get('t').properties,
        relatedComponentIds: record.get('relatedComponentIds'),
        relatedComponents: record.get('relatedComponents').map(c => c.properties || c)
      }));
    } finally {
      await session.close();
    }
  }

  async updateTaskStatus({ id, status, progress }) {
    // Validate progress value if provided
    if (progress !== undefined) {
      if (typeof progress !== 'number') {
        throw new Error('Progress must be a number');
      }
      if (progress < 0 || progress > 1) {
        throw new Error('Progress must be between 0 and 1 (inclusive)');
      }
    }
    
    const session = this.driver.session();
    try {
      const updates = { status };
      if (progress !== undefined) updates.progress = progress;
      
      await session.run(`
        MATCH (t:Task {id: $id})
        SET t.status = $status${progress !== undefined ? ', t.progress = $progress' : ''}, t.updated = datetime()
        RETURN t
      `, { id, status, progress });

      this.addToHistory('UPDATE_TASK', { taskId: id, status, progress });
      
      return { id, status, progress, updated: new Date().toISOString() };
    } finally {
      await session.close();
    }
  }

  // ============================================================================
  // COMMENT MANAGEMENT TOOLS
  // ============================================================================

  async createNodeComment({ nodeId, content, author = 'system', metadata }) {
    const session = this.driver.session();
    try {
      const commentId = uuidv4();
      const metadataProps = metadata ? Object.entries(metadata).map(([k, v]) => `${k}: $metadata_${k}`).join(', ') : '';
      const metadataParams = metadata ? Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata_${k}`, String(v)])) : {};
      
      // First verify that the target node exists (could be Task, Component, etc.)
      const nodeCheck = await session.run(`
        MATCH (n) WHERE n.id = $nodeId
        RETURN n
      `, { nodeId });
      
      if (nodeCheck.records.length === 0) {
        throw new Error(`Node with id ${nodeId} not found`);
      }
      
      // Create the comment node
      await session.run(`
        CREATE (c:Comment {
          id: $id,
          content: $content,
          author: $author,
          created: datetime(),
          ${metadataProps}
        })
      `, {
        id: commentId,
        content,
        author,
        ...metadataParams
      });
      
      // Create relationship from target node to comment
      await session.run(`
        MATCH (n) WHERE n.id = $nodeId
        MATCH (c:Comment {id: $commentId})
        CREATE (n)-[:HAS_COMMENT]->(c)
      `, { nodeId, commentId });

      this.addToHistory('CREATE_COMMENT', { commentId, nodeId, content, author });
      
      return {
        id: commentId,
        nodeId,
        content,
        author,
        created: new Date().toISOString(),
        metadata
      };
    } finally {
      await session.close();
    }
  }

  async getNodeComments({ nodeId, limit = 50 }) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (n)-[:HAS_COMMENT]->(c:Comment)
        WHERE n.id = $nodeId
        RETURN c
        ORDER BY c.created DESC
        LIMIT $limit
      `, { nodeId, limit });
      
      return result.records.map(record => record.get('c').properties);
    } finally {
      await session.close();
    }
  }

  async updateComment({ commentId, content, metadata }) {
    const session = this.driver.session();
    try {
      const updates = { content };
      const metadataParams = metadata ? Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata_${k}`, String(v)])) : {};
      
      let setClause = 'c.content = $content, c.updated = datetime()';
      if (metadata) {
        const metadataUpdates = Object.entries(metadata).map(([k, v]) => `c.${k} = $metadata_${k}`).join(', ');
        setClause += `, ${metadataUpdates}`;
      }
      
      const result = await session.run(`
        MATCH (c:Comment {id: $commentId})
        SET ${setClause}
        RETURN c
      `, { commentId, content, ...metadataParams });
      
      if (result.records.length === 0) {
        throw new Error(`Comment with id ${commentId} not found`);
      }

      this.addToHistory('UPDATE_COMMENT', { commentId, content });
      
      return {
        id: commentId,
        content,
        updated: new Date().toISOString(),
        metadata
      };
    } finally {
      await session.close();
    }
  }

  async deleteComment({ commentId }) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (c:Comment {id: $commentId})
        DETACH DELETE c
        RETURN count(c) as deletedCount
      `, { commentId });
      
      const deletedCount = result.records[0].get('deletedCount').toNumber();
      if (deletedCount === 0) {
        throw new Error(`Comment with id ${commentId} not found`);
      }

      this.addToHistory('DELETE_COMMENT', { commentId });
      
      return { success: true, id: commentId };
    } finally {
      await session.close();
    }
  }

  async getComment({ commentId }) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (c:Comment {id: $commentId})
        OPTIONAL MATCH (n)-[:HAS_COMMENT]->(c)
        RETURN c, n.id as nodeId
      `, { commentId });
      
      if (result.records.length === 0) {
        throw new Error(`Comment with id ${commentId} not found`);
      }
      
      const record = result.records[0];
      return {
        ...record.get('c').properties,
        nodeId: record.get('nodeId')
      };
    } finally {
      await session.close();
    }
  }

  // ============================================================================
  // RELATIONSHIP MANAGEMENT TOOLS
  // ============================================================================

  async createRelationship({ type, sourceId, targetId, details, timeOrder, probability, reasoning }) {
    const session = this.driver.session();
    try {
      const relationshipId = uuidv4();
      const detailsProps = details ? Object.entries(details).map(([k, v]) => `${k}: $details_${k}`).join(', ') : '';
      const detailsParams = details ? Object.fromEntries(Object.entries(details).map(([k, v]) => [`details_${k}`, String(v)])) : {};
      
      // Build temporal properties
      const temporalProps = [];
      const temporalParams = {};
      
      if (timeOrder !== undefined) {
        temporalProps.push('timeOrder: $timeOrder');
        temporalParams.timeOrder = timeOrder;
      }
      
      if (probability !== undefined) {
        temporalProps.push('probability: $probability');
        temporalParams.probability = probability;
      }
      
      if (reasoning !== undefined) {
        temporalProps.push('reasoning: $reasoning');
        temporalParams.reasoning = reasoning;
      }
      
      const allProps = [
        'id: $id',
        'created: datetime()',
        ...(detailsProps ? [detailsProps] : []),
        ...temporalProps
      ].join(', ');
      
      const query = `
        MATCH (source:Component {id: $sourceId}), (target:Component {id: $targetId})
        CREATE (source)-[r:${type} {
          ${allProps}
        }]-> (target)
        RETURN source.name as sourceName, target.name as targetName
      `;
      
      const result = await session.run(query, {
        id: relationshipId,
        sourceId,
        targetId,
        ...detailsParams,
        ...temporalParams
      });

      if (result.records.length === 0) {
        throw new Error('Source or target component not found');
      }

      this.addToHistory('CREATE_RELATIONSHIP', { relationshipId, type, sourceId, targetId, timeOrder, probability, reasoning });
      
      return {
        id: relationshipId,
        type,
        sourceId,
        targetId,
        sourceName: result.records[0].get('sourceName'),
        targetName: result.records[0].get('targetName'),
        details,
        timeOrder,
        probability,
        reasoning
      };
    } finally {
      await session.close();
    }
  }

  async createRelationshipsBulk({ relationships }) {
    const createdRelationships = [];
    for (const relationship of relationships) {
      // Extract temporal properties if they exist
      const { type, sourceId, targetId, details, timeOrder, probability, reasoning } = relationship;
      const created = await this.createRelationship({
        type,
        sourceId, 
        targetId,
        details,
        timeOrder,
        probability,
        reasoning
      });
      createdRelationships.push(created);
    }
    return createdRelationships;
  }

  async getComponentRelationships({ componentId, direction = 'both' }) {
    const session = this.driver.session();
    try {
      let query;
      if (direction === 'outgoing') {
        query = `
          MATCH (c:Component {id: $componentId})-[r]->(target:Component)
          WHERE type(r) <> 'RELATES_TO'
          RETURN r, target, 'outgoing' as direction, type(r) as relType
        `;
      } else if (direction === 'incoming') {
        query = `
          MATCH (source:Component)-[r]->(c:Component {id: $componentId})
          WHERE type(r) <> 'RELATES_TO'
          RETURN r, source as target, 'incoming' as direction, type(r) as relType
        `;
      } else {
        query = `
          MATCH (c:Component {id: $componentId})-[r]->(target:Component)
          WHERE type(r) <> 'RELATES_TO'
          RETURN r, target, 'outgoing' as direction, type(r) as relType
          UNION
          MATCH (source:Component)-[r]->(c:Component {id: $componentId})
          WHERE type(r) <> 'RELATES_TO'
          RETURN r, source as target, 'incoming' as direction, type(r) as relType
        `;
      }
      
      const result = await session.run(query, { componentId });
      
      return result.records.map(record => {
        const relProps = record.get('r').properties;
        return {
          relationship: relProps,
          target: record.get('target').properties,
          direction: record.get('direction'),
          type: record.get('relType'),
          // Extract temporal fields if they exist
          timeOrder: relProps.timeOrder,
          probability: relProps.probability,
          reasoning: relProps.reasoning
        };
      });
    } finally {
      await session.close();
    }
  }

  async getDependencyTree({ componentId, maxDepth = 3 }) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH path = (c:Component {id: $componentId})-[:DEPENDS_ON*1..${maxDepth}]->(dep:Component)
        RETURN path
      `, { componentId });
      
      return result.records.map(record => {
        const path = record.get('path');
        return {
          nodes: path.segments.map(segment => ({
            start: segment.start.properties,
            end: segment.end.properties,
            relationship: segment.relationship.properties
          }))
        };
      });
    } finally {
      await session.close();
    }
  }

  // ============================================================================
  // COMMAND QUEUE SYSTEM TOOLS
  // ============================================================================

  async sendCommand({ type, payload, priority = 'MEDIUM', source = 'mcp-server', targetComponentIds = [], taskType }) {
    const commandId = uuidv4();
    const command = {
      id: commandId,
      type,
      payload,
      priority,
      source,
      targetComponentIds,
      taskType,
      created: new Date().toISOString(),
      status: 'PENDING'
    };
    
    this.commandQueue.set(commandId, command);
    
    // Try to deliver to waiting agents
    this.tryDeliverCommand(command);
    
    return command;
  }

  async waitForCommand({ agentId, timeout = 300000, filters = {} }) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.waitingAgents.delete(agentId);
        reject(new Error('Timeout waiting for command'));
      }, timeout);
      
      this.waitingAgents.set(agentId, {
        agentId,
        filters,
        resolve: (command) => {
          clearTimeout(timeoutId);
          this.waitingAgents.delete(agentId);
          resolve(command);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          this.waitingAgents.delete(agentId);
          reject(error);
        }
      });
      
      // Check if there are pending commands that match
      this.checkPendingCommands(agentId);
    });
  }

  async cancelCommand({ commandId }) {
    if (this.commandQueue.has(commandId)) {
      const command = this.commandQueue.get(commandId);
      command.status = 'CANCELLED';
      return { success: true, commandId, status: 'CANCELLED' };
    }
    return { success: false, error: 'Command not found' };
  }

  async cancelWait({ agentId }) {
    if (this.waitingAgents.has(agentId)) {
      const agent = this.waitingAgents.get(agentId);
      agent.reject(new Error('Wait cancelled'));
      return { success: true, agentId };
    }
    return { success: false, error: 'Agent not found' };
  }

  async getPendingCommands() {
    return Array.from(this.commandQueue.values()).filter(cmd => cmd.status === 'PENDING');
  }

  async getWaitingAgents() {
    return Array.from(this.waitingAgents.keys()).map(agentId => ({
      agentId,
      filters: this.waitingAgents.get(agentId).filters,
      waitingTime: new Date().toISOString()
    }));
  }

  async getCommandHistory({ limit = 100 }) {
    return Array.from(this.commandQueue.values())
      .sort((a, b) => new Date(b.created) - new Date(a.created))
      .slice(0, limit);
  }

  // Helper methods for command queue
  tryDeliverCommand(command) {
    for (const [agentId, agent] of this.waitingAgents) {
      if (this.commandMatchesFilters(command, agent.filters)) {
        command.status = 'DELIVERED';
        command.deliveredTo = agentId;
        command.deliveredAt = new Date().toISOString();
        agent.resolve(command);
        break;
      }
    }
  }

  checkPendingCommands(agentId) {
    const agent = this.waitingAgents.get(agentId);
    if (!agent) return;
    
    for (const command of this.commandQueue.values()) {
      if (command.status === 'PENDING' && this.commandMatchesFilters(command, agent.filters)) {
        command.status = 'DELIVERED';
        command.deliveredTo = agentId;
        command.deliveredAt = new Date().toISOString();
        agent.resolve(command);
        break;
      }
    }
  }

  commandMatchesFilters(command, filters) {
    if (filters.priority && command.priority !== filters.priority) return false;
    if (filters.taskTypes && !filters.taskTypes.includes(command.taskType)) return false;
    if (filters.componentIds && !command.targetComponentIds.some(id => filters.componentIds.includes(id))) return false;
    return true;
  }

  // ============================================================================
  // SNAPSHOT MANAGEMENT TOOLS
  // ============================================================================

  async createSnapshot({ name, description }) {
    const session = this.driver.session();
    try {
      const snapshotId = uuidv4();
      
      // Get all components
      const componentsResult = await session.run('MATCH (c:Component) RETURN c');
      const components = componentsResult.records.map(record => record.get('c').properties);
      
      // Get all tasks
      const tasksResult = await session.run('MATCH (t:Task) RETURN t');
      const tasks = tasksResult.records.map(record => record.get('t').properties);
      
      // Get all relationships
      const relationshipsResult = await session.run(`
        MATCH (source)-[r]->(target)
        WHERE (source:Component OR source:Task) AND (target:Component OR target:Task)
        RETURN source.id as sourceId, target.id as targetId, type(r) as type, r as relationship
      `);
      const relationships = relationshipsResult.records.map(record => ({
        sourceId: record.get('sourceId'),
        targetId: record.get('targetId'),
        type: record.get('type'),
        properties: record.get('relationship').properties
      }));
      
      const snapshot = {
        id: snapshotId,
        name,
        description: description || '',
        timestamp: new Date().toISOString(),
        data: {
          components,
          tasks,
          relationships
        }
      };
      
      this.snapshots.set(snapshotId, snapshot);
      this.addToHistory('CREATE_SNAPSHOT', { snapshotId, name });
      
      return snapshot;
    } finally {
      await session.close();
    }
  }

  async listSnapshots() {
    return Array.from(this.snapshots.values()).map(({ data, ...snapshot }) => snapshot);
  }

  async restoreSnapshot({ snapshotId, dryRun = false }) {
    if (!this.snapshots.has(snapshotId)) {
      throw new Error('Snapshot not found');
    }
    
    const snapshot = this.snapshots.get(snapshotId);
    
    if (dryRun) {
      return {
        dryRun: true,
        snapshotId,
        componentsToRestore: snapshot.data.components.length,
        tasksToRestore: snapshot.data.tasks.length,
        relationshipsToRestore: snapshot.data.relationships.length
      };
    }
    
    const session = this.driver.session();
    try {
      // Clear existing data
      await session.run('MATCH (n) DETACH DELETE n');
      
      // Restore components
      for (const component of snapshot.data.components) {
        await session.run(`
          CREATE (c:Component $props)
        `, { props: component });
      }
      
      // Restore tasks
      for (const task of snapshot.data.tasks) {
        await session.run(`
          CREATE (t:Task $props)
        `, { props: task });
      }
      
      // Restore relationships
      for (const rel of snapshot.data.relationships) {
        await session.run(`
          MATCH (source {id: $sourceId}), (target {id: $targetId})
          CREATE (source)-[r:${rel.type} $props]->(target)
        `, { sourceId: rel.sourceId, targetId: rel.targetId, props: rel.properties });
      }
      
      this.addToHistory('RESTORE_SNAPSHOT', { snapshotId });
      
      return {
        success: true,
        snapshotId,
        restoredAt: new Date().toISOString()
      };
    } finally {
      await session.close();
    }
  }

  async replayToTimestamp({ timestamp, dryRun = true }) {
    const targetTime = new Date(timestamp);
    const relevantHistory = this.changeHistory.filter(entry => new Date(entry.timestamp) <= targetTime);
    
    if (dryRun) {
      return {
        dryRun: true,
        targetTimestamp: timestamp,
        operationsToReplay: relevantHistory.length,
        operations: relevantHistory.map(({ data, ...op }) => op)
      };
    }
    
    // Implementation would replay operations chronologically
    return {
      success: true,
      replayedOperations: relevantHistory.length,
      targetTimestamp: timestamp
    };
  }

  async getChangeHistory({ entityId, operation, limit = 50 }) {
    let filteredHistory = this.changeHistory;
    
    if (entityId) {
      filteredHistory = filteredHistory.filter(entry => 
        entry.data.componentId === entityId || 
        entry.data.taskId === entityId ||
        entry.data.relationshipId === entityId
      );
    }
    
    if (operation) {
      filteredHistory = filteredHistory.filter(entry => entry.operation === operation);
    }
    
    return filteredHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  async getHistoryStats() {
    const stats = {
      totalOperations: this.changeHistory.length,
      operationTypes: {},
      timeRange: {
        earliest: null,
        latest: null
      }
    };
    
    if (this.changeHistory.length > 0) {
      const timestamps = this.changeHistory.map(entry => new Date(entry.timestamp));
      stats.timeRange.earliest = new Date(Math.min(...timestamps)).toISOString();
      stats.timeRange.latest = new Date(Math.max(...timestamps)).toISOString();
      
      for (const entry of this.changeHistory) {
        stats.operationTypes[entry.operation] = (stats.operationTypes[entry.operation] || 0) + 1;
      }
    }
    
    return stats;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  addToHistory(operation, data) {
    this.changeHistory.push({
      id: uuidv4(),
      operation,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // ============================================================================
  // MAIN REQUEST HANDLER
  // ============================================================================

  async handleRequest(toolName, params) {
    const toolMap = {
      // Linear Integration
      'add_issue_relation': this.addIssueRelation.bind(this),
      'create_comment': this.createComment.bind(this),
      'create_issue': this.createIssue.bind(this),
      'update_issue': this.updateIssue.bind(this),
      'get_issue': this.getIssue.bind(this),
      'list_issues': this.listIssues.bind(this),
      'explore_cycle_issue': this.exploreCycleIssue.bind(this),
      'remove_issue_relation': this.removeIssueRelation.bind(this),
      'list_issue_relations': this.listIssueRelations.bind(this),
      'list_issue_comments': this.listIssueComments.bind(this),
      'get_cycle': this.getCycle.bind(this),
      'get_cycle_issues': this.getCycleIssues.bind(this),
      'list_cycles': this.listCycles.bind(this),
      'get_project': this.getProject.bind(this),
      'list_projects': this.listProjects.bind(this),
      'get_team': this.getTeam.bind(this),
      'list_teams': this.listTeams.bind(this),
      'get_user': this.getUser.bind(this),
      'list_users': this.listUsers.bind(this),
      'get_workflow_state': this.getWorkflowState.bind(this),
      'list_workflow_states': this.listWorkflowStates.bind(this),
      'get_label': this.getLabel.bind(this),
      'list_labels': this.listLabels.bind(this),
      'execute_pipeline': this.executePipeline.bind(this),
      
      // Component Management
      'create_component': this.createComponent.bind(this),
      'create_components_bulk': this.createComponentsBulk.bind(this),
      'update_component': this.updateComponent.bind(this),
      'delete_component': this.deleteComponent.bind(this),
      'get_component': this.getComponent.bind(this),
      'search_components': this.searchComponents.bind(this),
      'get_codebase_overview': this.getCodebaseOverview.bind(this),
      
      // Task Management
      'create_task': this.createTask.bind(this),
      'create_tasks_bulk': this.createTasksBulk.bind(this),
      'get_task': this.getTask.bind(this),
      'get_tasks': this.getTasks.bind(this),
      'search_tasks': this.searchTasks.bind(this),
      'update_task_status': this.updateTaskStatus.bind(this),
      
      // Comment Management
      'create_node_comment': this.createNodeComment.bind(this),
      'get_node_comments': this.getNodeComments.bind(this),
      'update_comment': this.updateComment.bind(this),
      'delete_comment': this.deleteComment.bind(this),
      'get_comment': this.getComment.bind(this),
      
      // Relationship Management
      'create_relationship': this.createRelationship.bind(this),
      'create_relationships_bulk': this.createRelationshipsBulk.bind(this),
      'get_component_relationships': this.getComponentRelationships.bind(this),
      'get_dependency_tree': this.getDependencyTree.bind(this),
      
      // Command Queue System
      'send_command': this.sendCommand.bind(this),
      'wait_for_command': this.waitForCommand.bind(this),
      'cancel_command': this.cancelCommand.bind(this),
      'cancel_wait': this.cancelWait.bind(this),
      'get_pending_commands': this.getPendingCommands.bind(this),
      'get_waiting_agents': this.getWaitingAgents.bind(this),
      'get_command_history': this.getCommandHistory.bind(this),
      
      // Snapshot Management
      'create_snapshot': this.createSnapshot.bind(this),
      'list_snapshots': this.listSnapshots.bind(this),
      'restore_snapshot': this.restoreSnapshot.bind(this),
      'replay_to_timestamp': this.replayToTimestamp.bind(this),
      'get_change_history': this.getChangeHistory.bind(this),
      'get_history_stats': this.getHistoryStats.bind(this)
    };

    const handler = toolMap[toolName];
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    return await handler(params);
  }
}

export default MCPServer;

