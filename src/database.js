import neo4j from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import { Component, Relationship, Task } from './models.js';
import { ChangeHistory } from './history.js';

export class GraphDatabase {
  constructor(uri = 'bolt://localhost:7687', username = 'neo4j', password = 'password') {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    this.history = new ChangeHistory(this);
  }

  async close() {
    await this.driver.close();
  }

  async verifyConnection() {
    const session = this.driver.session();
    try {
      await session.run('RETURN 1');
      return true;
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error.message);
      return false;
    } finally {
      await session.close();
    }
  }

  async initializeSchema() {
    const session = this.driver.session();
    try {
      // Create constraints and indexes
      await session.run('CREATE CONSTRAINT component_id IF NOT EXISTS FOR (c:Component) REQUIRE c.id IS UNIQUE');
      await session.run('CREATE CONSTRAINT task_id IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE');
      await session.run('CREATE INDEX component_name IF NOT EXISTS FOR (c:Component) ON (c.name)');
      await session.run('CREATE INDEX component_type IF NOT EXISTS FOR (c:Component) ON (c.type)');
      await session.run('CREATE INDEX component_codebase IF NOT EXISTS FOR (c:Component) ON (c.codebase)');
      await session.run('CREATE INDEX task_status IF NOT EXISTS FOR (t:Task) ON (t.status)');
      
      // Initialize change history schema
      await this.history.initializeSchema();
    } finally {
      await session.close();
    }
  }

  // Component Operations
  async createComponent(componentData, metadata = {}) {
    const component = new Component({ ...componentData, id: componentData.id || uuidv4() });
    const session = this.driver.session();
    
    try {
      const result = await session.run(`
        CREATE (c:Component:${component.type})
        SET c = $properties
        RETURN c
      `, { properties: component.toNode().properties });
      
      const createdComponent = result.records[0]?.get('c').properties;
      
      // Record change history
      if (createdComponent) {
        await this.history.recordChange(
          'CREATE_COMPONENT',
          'COMPONENT',
          createdComponent.id,
          null,
          createdComponent,
          metadata
        );
      }
      
      return createdComponent;
    } finally {
      await session.close();
    }
  }

  async getComponent(id) {
    const session = this.driver.session();
    try {
      const result = await session.run('MATCH (c:Component {id: $id}) RETURN c', { id });
      return result.records[0]?.get('c').properties || null;
    } finally {
      await session.close();
    }
  }

  async updateComponent(id, updates) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (c:Component {id: $id})
        SET c += $updates
        RETURN c
      `, { id, updates });
      
      return result.records[0]?.get('c').properties || null;
    } finally {
      await session.close();
    }
  }

  async deleteComponent(id) {
    const session = this.driver.session();
    try {
      await session.run('MATCH (c:Component {id: $id}) DETACH DELETE c', { id });
      return true;
    } finally {
      await session.close();
    }
  }

  async searchComponents(filters = {}) {
    const session = this.driver.session();
    try {
      let query = 'MATCH (c:Component)';
      const params = {};
      const conditions = [];

      if (filters.type) {
        conditions.push('c.type = $type');
        params.type = filters.type;
      }
      if (filters.codebase) {
        conditions.push('c.codebase = $codebase');
        params.codebase = filters.codebase;
      }
      if (filters.name) {
        conditions.push('c.name CONTAINS $name');
        params.name = filters.name;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' RETURN c LIMIT 100';

      const result = await session.run(query, params);
      return result.records.map(record => record.get('c').properties);
    } finally {
      await session.close();
    }
  }

  // Relationship Operations
  async createRelationship(relationshipData) {
    const relationship = new Relationship({ ...relationshipData, id: relationshipData.id || uuidv4() });
    const session = this.driver.session();
    
    try {
      const result = await session.run(`
        MATCH (source:Component {id: $sourceId})
        MATCH (target:Component {id: $targetId})
        CREATE (source)-[r:${relationship.type}]->(target)
        SET r = $properties
        RETURN r, source.name as sourceName, target.name as targetName
      `, { 
        sourceId: relationship.sourceId, 
        targetId: relationship.targetId,
        properties: relationship.toRelation().properties
      });
      
      const record = result.records[0];
      if (record) {
        return {
          ...record.get('r').properties,
          sourceName: record.get('sourceName'),
          targetName: record.get('targetName')
        };
      }
      return null;
    } finally {
      await session.close();
    }
  }

  async getComponentRelationships(componentId, direction = 'both') {
    const session = this.driver.session();
    try {
      let query;
      if (direction === 'outgoing') {
        query = 'MATCH (c:Component {id: $id})-[r]->(target:Component) RETURN r, target';
      } else if (direction === 'incoming') {
        query = 'MATCH (source:Component)-[r]->(c:Component {id: $id}) RETURN r, source as target';
      } else {
        query = `
          MATCH (c:Component {id: $id})-[r]->(target:Component) 
          RETURN r, target, 'outgoing' as direction
          UNION
          MATCH (source:Component)-[r]->(c:Component {id: $id}) 
          RETURN r, source as target, 'incoming' as direction
        `;
      }

      const result = await session.run(query, { id: componentId });
      return result.records.map(record => ({
        relationship: record.get('r').properties,
        target: record.get('target').properties,
        direction: record.get('direction') || direction
      }));
    } finally {
      await session.close();
    }
  }

  // Task Operations
  async createTask(taskData) {
    const task = new Task({ ...taskData, id: taskData.id || uuidv4() });
    const session = this.driver.session();
    
    try {
      const result = await session.run(`
        CREATE (t:Task)
        SET t = $properties
        RETURN t
      `, { properties: task.toNode().properties });
      
      // Link to related components if any
      if (task.relatedComponentIds.length > 0) {
        await session.run(`
          MATCH (t:Task {id: $taskId})
          MATCH (c:Component)
          WHERE c.id IN $componentIds
          CREATE (t)-[:RELATES_TO]->(c)
        `, { taskId: task.id, componentIds: task.relatedComponentIds });
      }
      
      return result.records[0]?.get('t').properties;
    } finally {
      await session.close();
    }
  }

  async updateTaskStatus(id, status, progress = null) {
    const session = this.driver.session();
    try {
      const updates = { status };
      if (progress !== null) {
        updates.progress = progress;
      }

      const result = await session.run(`
        MATCH (t:Task {id: $id})
        SET t += $updates
        RETURN t
      `, { id, updates });
      
      return result.records[0]?.get('t').properties || null;
    } finally {
      await session.close();
    }
  }

  async getTask(id) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (t:Task {id: $id})
        OPTIONAL MATCH (t)-[:RELATES_TO]->(c:Component)
        RETURN t, collect(c) as relatedComponents
      `, { id });

      const record = result.records[0];
      if (record) {
        return {
          ...record.get('t').properties,
          relatedComponents: record.get('relatedComponents').map(c => c.properties)
        };
      }
      return null;
    } finally {
      await session.close();
    }
  }

  async getTasks(status = null) {
    const session = this.driver.session();
    try {
      let query = 'MATCH (t:Task)';
      const params = {};

      if (status) {
        query += ' WHERE t.status = $status';
        params.status = status;
      }

      query += ' OPTIONAL MATCH (t)-[:RELATES_TO]->(c:Component) RETURN t, collect(c) as relatedComponents';

      const result = await session.run(query, params);
      return result.records.map(record => ({
        ...record.get('t').properties,
        relatedComponents: record.get('relatedComponents').map(c => c.properties)
      }));
    } finally {
      await session.close();
    }
  }

  // Analysis Operations
  async getDependencyTree(componentId, maxDepth = 3) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH path = (c:Component {id: $id})-[:DEPENDS_ON*1..${maxDepth}]->(dep:Component)
        RETURN path
      `, { id: componentId });

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

  async getCodebaseOverview(codebase) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (c:Component {codebase: $codebase})
        RETURN c.type as type, count(*) as count
        ORDER BY count DESC
      `, { codebase });

      return result.records.map(record => ({
        type: record.get('type'),
        count: record.get('count').toNumber()
      }));
    } finally {
      await session.close();
    }
  }
}
