#!/usr/bin/env node

import { GraphDatabase } from '../src/database.js';
import { ComponentType, RelationshipType, TaskStatus } from '../src/models.js';

/**
 * Example usage of the Codebase Graph MCP Database
 * This demonstrates how to model a simple web application structure
 */
async function demonstrateUsage() {
  const db = new GraphDatabase();
  
  try {
    console.log('🚀 Codebase Graph MCP Usage Example');
    console.log('=====================================\n');

    // Verify connection
    console.log('1. Connecting to database...');
    const connected = await db.verifyConnection();
    if (!connected) {
      throw new Error('Cannot connect to Neo4j. Please ensure it\'s running.');
    }
    console.log('   ✅ Connected to Neo4j\n');

    // Initialize schema
    await db.initializeSchema();

    console.log('2. Creating a sample web application structure...\n');

    // Create system-level component
    const webApp = await db.createComponent({
      type: ComponentType.SYSTEM,
      name: 'E-commerce Web App',
      description: 'Online shopping platform',
      codebase: 'ecommerce-app'
    });
    console.log(`   📦 System: ${webApp.name}`);

    // Create modules
    const userModule = await db.createComponent({
      type: ComponentType.MODULE,
      name: 'User Module',
      description: 'User management and authentication',
      path: '/src/modules/user',
      codebase: 'ecommerce-app'
    });

    const productModule = await db.createComponent({
      type: ComponentType.MODULE,
      name: 'Product Module', 
      description: 'Product catalog and inventory',
      path: '/src/modules/product',
      codebase: 'ecommerce-app'
    });

    const orderModule = await db.createComponent({
      type: ComponentType.MODULE,
      name: 'Order Module',
      description: 'Order processing and fulfillment',
      path: '/src/modules/order',
      codebase: 'ecommerce-app'
    });

    console.log(`   📁 Module: ${userModule.name}`);
    console.log(`   📁 Module: ${productModule.name}`);
    console.log(`   📁 Module: ${orderModule.name}`);

    // Create files
    const userService = await db.createComponent({
      type: ComponentType.FILE,
      name: 'UserService.ts',
      description: 'User service implementation',
      path: '/src/modules/user/UserService.ts',
      codebase: 'ecommerce-app'
    });

    const productService = await db.createComponent({
      type: ComponentType.FILE,
      name: 'ProductService.ts',
      description: 'Product service implementation',
      path: '/src/modules/product/ProductService.ts', 
      codebase: 'ecommerce-app'
    });

    console.log(`   📄 File: ${userService.name}`);
    console.log(`   📄 File: ${productService.name}`);

    // Create classes
    const userClass = await db.createComponent({
      type: ComponentType.CLASS,
      name: 'UserService',
      description: 'Handles user operations',
      path: '/src/modules/user/UserService.ts',
      codebase: 'ecommerce-app'
    });

    const productClass = await db.createComponent({
      type: ComponentType.CLASS,
      name: 'ProductService',
      description: 'Handles product operations',
      path: '/src/modules/product/ProductService.ts',
      codebase: 'ecommerce-app'
    });

    console.log(`   🏗️  Class: ${userClass.name}`);
    console.log(`   🏗️  Class: ${productClass.name}`);

    console.log('\n3. Creating relationships...\n');

    // System contains modules
    await db.createRelationship({
      type: RelationshipType.CONTAINS,
      sourceId: webApp.id,
      targetId: userModule.id
    });

    await db.createRelationship({
      type: RelationshipType.CONTAINS,
      sourceId: webApp.id,
      targetId: productModule.id
    });

    await db.createRelationship({
      type: RelationshipType.CONTAINS,
      sourceId: webApp.id,
      targetId: orderModule.id
    });

    // Modules contain files
    await db.createRelationship({
      type: RelationshipType.CONTAINS,
      sourceId: userModule.id,
      targetId: userService.id
    });

    await db.createRelationship({
      type: RelationshipType.CONTAINS,
      sourceId: productModule.id,
      targetId: productService.id
    });

    // Files contain classes
    await db.createRelationship({
      type: RelationshipType.CONTAINS,
      sourceId: userService.id,
      targetId: userClass.id
    });

    await db.createRelationship({
      type: RelationshipType.CONTAINS,
      sourceId: productService.id,
      targetId: productClass.id
    });

    // Order module depends on user module
    await db.createRelationship({
      type: RelationshipType.DEPENDS_ON,
      sourceId: orderModule.id,
      targetId: userModule.id,
      details: { reason: 'user authentication required' }
    });

    // Order module depends on product module  
    await db.createRelationship({
      type: RelationshipType.DEPENDS_ON,
      sourceId: orderModule.id,
      targetId: productModule.id,
      details: { reason: 'product information needed' }
    });

    console.log('   ✅ Created containment hierarchy');
    console.log('   ✅ Created dependency relationships');

    console.log('\n4. Creating development tasks...\n');

    // Create tasks
    const authTask = await db.createTask({
      name: 'Implement OAuth2 authentication',
      description: 'Add OAuth2 support for Google and GitHub login',
      status: TaskStatus.TODO,
      progress: 0,
      relatedComponentIds: [userModule.id, userClass.id]
    });

    const searchTask = await db.createTask({
      name: 'Add product search functionality',
      description: 'Implement full-text search with filters',
      status: TaskStatus.IN_PROGRESS,
      progress: 0.3,
      relatedComponentIds: [productModule.id, productClass.id]
    });

    const performanceTask = await db.createTask({
      name: 'Optimize database queries',
      description: 'Add caching and query optimization',
      status: TaskStatus.TODO,
      progress: 0,
      relatedComponentIds: [userClass.id, productClass.id]
    });

    console.log(`   📋 Task: ${authTask.name} (${authTask.status})`);
    console.log(`   📋 Task: ${searchTask.name} (${searchTask.status}) - ${Math.round(searchTask.progress * 100)}%`);
    console.log(`   📋 Task: ${performanceTask.name} (${performanceTask.status})`);

    console.log('\n5. Running analysis queries...\n');

    // Get codebase overview
    const overview = await db.getCodebaseOverview('ecommerce-app');
    console.log('   📊 Codebase Overview:');
    overview.forEach(item => {
      console.log(`      ${item.type}: ${item.count} components`);
    });

    // Get relationships for a component
    const userRelationships = await db.getComponentRelationships(userModule.id);
    console.log(`\n   🔗 User Module Relationships: ${userRelationships.length}`);
    userRelationships.forEach(rel => {
      console.log(`      ${rel.relationship.type || rel.relationship.id} -> ${rel.target.name}`);
    });

    // Get dependency tree
    const dependencies = await db.getDependencyTree(orderModule.id);
    console.log(`\n   🌳 Order Module Dependencies: ${dependencies.length} paths`);
    
    // Get all tasks
    const tasks = await db.getTasks();
    console.log(`\n   📝 All Tasks: ${tasks.length}`);
    tasks.forEach(task => {
      const relatedCount = task.relatedComponents.length;
      console.log(`      ${task.name} - ${relatedCount} related components`);
    });

    console.log('\n🎉 Example completed successfully!');
    console.log('\nThis demonstrates:');
    console.log('- Multi-level component hierarchy (System -> Module -> File -> Class)');
    console.log('- Different relationship types (CONTAINS, DEPENDS_ON)');
    console.log('- Task management with component linking');
    console.log('- Analysis queries for understanding codebase structure');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

// Run the example
demonstrateUsage();
