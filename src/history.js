import { v4 as uuidv4 } from 'uuid';

/**
 * Change history tracking and replay system
 * Tracks all database operations for audit, debugging, and replay purposes
 */
export class ChangeHistory {
  constructor(database) {
    this.db = database;
  }

  /**
   * Initialize the change history schema in Neo4j
   */
  async initializeSchema() {
    const session = this.db.driver.session();
    try {
      // Create change event nodes and indexes
      await session.run('CREATE CONSTRAINT change_event_id IF NOT EXISTS FOR (c:ChangeEvent) REQUIRE c.id IS UNIQUE');
      await session.run('CREATE INDEX change_event_timestamp IF NOT EXISTS FOR (c:ChangeEvent) ON (c.timestamp)');
      await session.run('CREATE INDEX change_event_operation IF NOT EXISTS FOR (c:ChangeEvent) ON (c.operation)');
      await session.run('CREATE INDEX change_event_session IF NOT EXISTS FOR (c:ChangeEvent) ON (c.sessionId)');
    } finally {
      await session.close();
    }
  }

  /**
   * Record a change event
   */
  async recordChange(operation, entityType, entityId, beforeState, afterState, metadata = {}) {
    const session = this.db.driver.session();
    try {
      const changeEvent = {
        id: uuidv4(),
        operation, // CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP
        entityType, // COMPONENT, TASK, RELATIONSHIP
        entityId,
        beforeState: JSON.stringify(beforeState || {}),
        afterState: JSON.stringify(afterState || {}),
        timestamp: new Date().toISOString(),
        sessionId: metadata.sessionId || 'anonymous',
        userId: metadata.userId || 'system',
        source: metadata.source || 'mcp-server',
        ...metadata
      };

      await session.run(`
        CREATE (c:ChangeEvent)
        SET c = $changeEvent
        RETURN c
      `, { changeEvent });

      return changeEvent;
    } finally {
      await session.close();
    }
  }

  /**
   * Get change history for an entity
   */
  async getEntityHistory(entityId, limit = 50) {
    const session = this.db.driver.session();
    try {
      const result = await session.run(`
        MATCH (c:ChangeEvent {entityId: $entityId})
        RETURN c
        ORDER BY c.timestamp DESC
        LIMIT $limit
      `, { entityId, limit });

      return result.records.map(record => {
        const change = record.get('c').properties;
        return {
          ...change,
          beforeState: change.beforeState ? JSON.parse(change.beforeState) : null,
          afterState: change.afterState ? JSON.parse(change.afterState) : null
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Get recent changes across all entities
   */
  async getRecentChanges(limit = 100, operation = null) {
    const session = this.db.driver.session();
    try {
      let query = 'MATCH (c:ChangeEvent)';
      const params = { limit };

      if (operation) {
        query += ' WHERE c.operation = $operation';
        params.operation = operation;
      }

      query += ' RETURN c ORDER BY c.timestamp DESC LIMIT $limit';

      const result = await session.run(query, params);
      
      return result.records.map(record => {
        const change = record.get('c').properties;
        return {
          ...change,
          beforeState: change.beforeState ? JSON.parse(change.beforeState) : null,
          afterState: change.afterState ? JSON.parse(change.afterState) : null
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Get changes within a time range
   */
  async getChangesByTimeRange(startTime, endTime, limit = 1000) {
    const session = this.db.driver.session();
    try {
      const result = await session.run(`
        MATCH (c:ChangeEvent)
        WHERE c.timestamp >= $startTime AND c.timestamp <= $endTime
        RETURN c
        ORDER BY c.timestamp ASC
        LIMIT $limit
      `, { startTime, endTime, limit });

      return result.records.map(record => {
        const change = record.get('c').properties;
        return {
          ...change,
          beforeState: change.beforeState ? JSON.parse(change.beforeState) : null,
          afterState: change.afterState ? JSON.parse(change.afterState) : null
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Get changes by session ID
   */
  async getSessionChanges(sessionId) {
    const session = this.db.driver.session();
    try {
      const result = await session.run(`
        MATCH (c:ChangeEvent {sessionId: $sessionId})
        RETURN c
        ORDER BY c.timestamp ASC
      `, { sessionId });

      return result.records.map(record => {
        const change = record.get('c').properties;
        return {
          ...change,
          beforeState: change.beforeState ? JSON.parse(change.beforeState) : null,
          afterState: change.afterState ? JSON.parse(change.afterState) : null
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Replay changes from a specific point in time
   * This recreates the database state as it was at that time
   */
  async replayToTimestamp(targetTimestamp, dryRun = false) {
    const session = this.db.driver.session();
    const replayLog = [];

    try {
      // Get all changes up to the target timestamp
      const changes = await this.getChangesByTimeRange(
        '1970-01-01T00:00:00.000Z', 
        targetTimestamp
      );

      if (dryRun) {
        return {
          message: `Would replay ${changes.length} changes to timestamp ${targetTimestamp}`,
          changes: changes.map(c => ({
            timestamp: c.timestamp,
            operation: c.operation,
            entityType: c.entityType,
            entityId: c.entityId
          }))
        };
      }

      // Clear current state (be very careful with this!)
      await session.run('MATCH (n) WHERE NOT n:ChangeEvent DETACH DELETE n');
      replayLog.push('Cleared current state (excluding change history)');

      // Replay changes in chronological order
      for (const change of changes) {
        try {
          await this.replayChange(change);
          replayLog.push(`Replayed: ${change.operation} on ${change.entityType} ${change.entityId}`);
        } catch (error) {
          replayLog.push(`Failed to replay: ${change.operation} on ${change.entityType} ${change.entityId} - ${error.message}`);
        }
      }

      return {
        message: `Successfully replayed to timestamp ${targetTimestamp}`,
        replayedChanges: changes.length,
        log: replayLog
      };

    } finally {
      await session.close();
    }
  }

  /**
   * Replay a single change event
   */
  async replayChange(change) {
    switch (change.operation) {
      case 'CREATE_COMPONENT':
        await this.db.createComponent(change.afterState);
        break;
      case 'UPDATE_COMPONENT':
        await this.db.updateComponent(change.entityId, change.afterState);
        break;
      case 'DELETE_COMPONENT':
        await this.db.deleteComponent(change.entityId);
        break;
      case 'CREATE_TASK':
        await this.db.createTask(change.afterState);
        break;
      case 'UPDATE_TASK':
        await this.db.updateTaskStatus(change.entityId, change.afterState.status, change.afterState.progress);
        break;
      case 'CREATE_RELATIONSHIP':
        await this.db.createRelationship(change.afterState);
        break;
      default:
        console.warn(`Unknown operation type: ${change.operation}`);
    }
  }

  /**
   * Create a snapshot of the current database state
   */
  async createSnapshot(snapshotName, metadata = {}) {
    const session = this.db.driver.session();
    try {
      const snapshot = {
        id: uuidv4(),
        name: snapshotName,
        timestamp: new Date().toISOString(),
        ...metadata
      };

      // Get all current entities
      const components = await session.run('MATCH (c:Component) RETURN c');
      const tasks = await session.run('MATCH (t:Task) RETURN t');
      const relationships = await session.run('MATCH ()-[r]->() WHERE type(r) <> "RELATES_TO" RETURN r, startNode(r).id as sourceId, endNode(r).id as targetId');

      snapshot.data = {
        components: components.records.map(r => r.get('c').properties),
        tasks: tasks.records.map(r => r.get('t').properties),
        relationships: relationships.records.map(r => ({
          ...r.get('r').properties,
          type: r.get('r').type,
          sourceId: r.get('sourceId'),
          targetId: r.get('targetId')
        }))
      };

      // Store snapshot
      await session.run(`
        CREATE (s:Snapshot)
        SET s = $snapshot
        RETURN s
      `, { snapshot: { ...snapshot, data: JSON.stringify(snapshot.data) } });

      return snapshot;
    } finally {
      await session.close();
    }
  }

  /**
   * List all snapshots
   */
  async listSnapshots() {
    const session = this.db.driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Snapshot)
        RETURN s
        ORDER BY s.timestamp DESC
      `);

      return result.records.map(record => {
        const snapshot = record.get('s').properties;
        return {
          ...snapshot,
          data: undefined // Don't return the full data in list view
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Restore from a snapshot
   */
  async restoreFromSnapshot(snapshotId, dryRun = false) {
    const session = this.db.driver.session();
    try {
      const result = await session.run('MATCH (s:Snapshot {id: $snapshotId}) RETURN s', { snapshotId });
      
      if (result.records.length === 0) {
        throw new Error(`Snapshot ${snapshotId} not found`);
      }

      const snapshot = result.records[0].get('s').properties;
      const data = JSON.parse(snapshot.data);

      if (dryRun) {
        return {
          message: `Would restore snapshot: ${snapshot.name}`,
          timestamp: snapshot.timestamp,
          componentCount: data.components.length,
          taskCount: data.tasks.length,
          relationshipCount: data.relationships.length
        };
      }

      // Clear current state (excluding change history and snapshots)
      await session.run('MATCH (n) WHERE NOT (n:ChangeEvent OR n:Snapshot) DETACH DELETE n');

      // Restore components
      for (const component of data.components) {
        await this.db.createComponent(component);
      }

      // Restore tasks
      for (const task of data.tasks) {
        await this.db.createTask(task);
      }

      // Restore relationships
      for (const relationship of data.relationships) {
        await this.db.createRelationship(relationship);
      }

      return {
        message: `Successfully restored from snapshot: ${snapshot.name}`,
        timestamp: snapshot.timestamp,
        restoredComponents: data.components.length,
        restoredTasks: data.tasks.length,
        restoredRelationships: data.relationships.length
      };

    } finally {
      await session.close();
    }
  }

  /**
   * Get statistics about change history
   */
  async getHistoryStats() {
    const session = this.db.driver.session();
    try {
      const totalChanges = await session.run('MATCH (c:ChangeEvent) RETURN count(c) as count');
      const changesByOperation = await session.run(`
        MATCH (c:ChangeEvent)
        RETURN c.operation as operation, count(*) as count
        ORDER BY count DESC
      `);
      const changesByDay = await session.run(`
        MATCH (c:ChangeEvent)
        RETURN substring(c.timestamp, 0, 10) as date, count(*) as count
        ORDER BY date DESC
        LIMIT 30
      `);

      return {
        totalChanges: totalChanges.records[0].get('count').toNumber(),
        changesByOperation: changesByOperation.records.map(r => ({
          operation: r.get('operation'),
          count: r.get('count').toNumber()
        })),
        changesByDay: changesByDay.records.map(r => ({
          date: r.get('date'),
          count: r.get('count').toNumber()
        }))
      };
    } finally {
      await session.close();
    }
  }
}
