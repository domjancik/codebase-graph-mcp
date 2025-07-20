import { test, describe, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import { GraphDatabase } from '../src/database.js';
import { ComponentType, RelationshipType, TaskStatus } from '../src/models.js';

describe('Codebase Graph Database', () => {
  let db;

  before(async () => {
    db = new GraphDatabase();
    const connected = await db.verifyConnection();
    if (!connected) {
      throw new Error('Neo4j not available for testing');
    }
    await db.initializeSchema();
  });

  after(async () => {
    await db.close();
  });

  test('should create and retrieve components', async () => {
    const componentData = {
      type: ComponentType.FILE,
      name: 'test.js',
      description: 'Test file',
      codebase: 'test-project'
    };

    const created = await db.createComponent(componentData);
    assert.ok(created.id);
    assert.equal(created.name, 'test.js');

    const retrieved = await db.getComponent(created.id);
    assert.equal(retrieved.name, 'test.js');
  });

  test('should search components by filters', async () => {
    const results = await db.searchComponents({ 
      codebase: 'test-project' 
    });
    assert.ok(Array.isArray(results));
    assert.ok(results.length > 0);
  });

  test('should create relationships between components', async () => {
    // Create two components
    const source = await db.createComponent({
      type: ComponentType.FILE,
      name: 'source.js',
      codebase: 'test-project'
    });

    const target = await db.createComponent({
      type: ComponentType.CLASS,
      name: 'TestClass',
      codebase: 'test-project'
    });

    // Create relationship
    const relationship = await db.createRelationship({
      type: RelationshipType.CONTAINS,
      sourceId: source.id,
      targetId: target.id
    });

    assert.ok(relationship.id);
    assert.equal(relationship.sourceName, 'source.js');
    assert.equal(relationship.targetName, 'TestClass');
  });

  test('should create and manage tasks', async () => {
    const task = await db.createTask({
      name: 'Test task',
      description: 'A test task',
      status: TaskStatus.TODO
    });

    assert.ok(task.id);
    assert.equal(task.name, 'Test task');
    assert.equal(task.status, 'TODO');

    // Update task status
    const updated = await db.updateTaskStatus(
      task.id, 
      TaskStatus.IN_PROGRESS, 
      0.5
    );

    assert.equal(updated.status, 'IN_PROGRESS');
    assert.equal(updated.progress, 0.5);
  });

  test('should get codebase overview', async () => {
    const overview = await db.getCodebaseOverview('test-project');
    assert.ok(Array.isArray(overview));
    
    // Should have FILE and CLASS components
    const types = overview.map(item => item.type);
    assert.ok(types.includes('FILE'));
  });
});
