#!/usr/bin/env node

import { GraphDatabase } from '../src/database.js';

async function setupDatabase() {
  const db = new GraphDatabase();
  
  try {
    console.log('Connecting to Neo4j database...');
    
    // Check connection
    const connected = await db.verifyConnection();
    if (!connected) {
      console.error('❌ Failed to connect to Neo4j database.');
      console.error('Please ensure Neo4j is running on bolt://localhost:7687');
      console.error('Default credentials: username="neo4j", password="password"');
      process.exit(1);
    }
    
    console.log('✅ Connected to Neo4j database');
    
    // Initialize schema
    console.log('Setting up database schema...');
    await db.initializeSchema();
    console.log('✅ Database schema initialized');
    
    // Create some sample data for testing
    console.log('Creating sample data...');
    
    // Sample components
    const fileComponent = await db.createComponent({
      type: 'FILE',
      name: 'main.js',
      description: 'Main application entry point',
      path: '/src/main.js',
      codebase: 'sample-project'
    });
    
    const classComponent = await db.createComponent({
      type: 'CLASS',
      name: 'DatabaseManager',
      description: 'Handles database connections and queries',
      path: '/src/database/manager.js',
      codebase: 'sample-project'
    });
    
    const functionComponent = await db.createComponent({
      type: 'FUNCTION',
      name: 'connectToDatabase',
      description: 'Establishes database connection',
      path: '/src/database/manager.js',
      codebase: 'sample-project'
    });
    
    // Sample relationships
    await db.createRelationship({
      type: 'CONTAINS',
      sourceId: fileComponent.id,
      targetId: classComponent.id,
      details: { location: 'line 15' }
    });
    
    await db.createRelationship({
      type: 'CONTAINS',
      sourceId: classComponent.id,
      targetId: functionComponent.id,
      details: { method: 'true' }
    });
    
    await db.createRelationship({
      type: 'DEPENDS_ON',
      sourceId: fileComponent.id,
      targetId: classComponent.id,
      details: { import: 'true' }
    });
    
    // Sample task
    await db.createTask({
      name: 'Implement database connection pooling',
      description: 'Add connection pooling to improve database performance',
      status: 'TODO',
      progress: 0.2,
      relatedComponentIds: [classComponent.id, functionComponent.id]
    });
    
    console.log('✅ Sample data created');
    console.log('\nSample components created:');
    console.log(`- File: ${fileComponent.name} (${fileComponent.id})`);
    console.log(`- Class: ${classComponent.name} (${classComponent.id})`);
    console.log(`- Function: ${functionComponent.name} (${functionComponent.id})`);
    
    // Test queries
    console.log('\nTesting queries...');
    
    const components = await db.searchComponents({ codebase: 'sample-project' });
    console.log(`Found ${components.length} components in sample-project`);
    
    const relationships = await db.getComponentRelationships(fileComponent.id);
    console.log(`Found ${relationships.length} relationships for ${fileComponent.name}`);
    
    const tasks = await db.getTasks();
    console.log(`Found ${tasks.length} tasks`);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nYou can now start the MCP server with: npm start');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

setupDatabase();
