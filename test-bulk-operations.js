#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

/**
 * Test script for bulk operations
 * Demonstrates creating multiple components, relationships, and tasks in single API calls
 */

async function testBulkOperations() {
  console.log('🧪 Testing Bulk Operations\n');

  try {
    // Test 1: Bulk create components
    console.log('1. 📦 Testing bulk component creation...');
    const bulkComponentsPayload = {
      components: [
        {
          name: 'UserService',
          type: 'SERVICE',
          codebase: 'test-app',
          description: 'User management service'
        },
        {
          name: 'AuthService',
          type: 'SERVICE', 
          codebase: 'test-app',
          description: 'Authentication service'
        },
        {
          name: 'DatabaseService',
          type: 'SERVICE',
          codebase: 'test-app',
          description: 'Database connection service'
        }
      ]
    };

    const componentsResponse = await fetch(`${BASE_URL}/api/components/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulkComponentsPayload)
    });

    if (!componentsResponse.ok) {
      throw new Error(`Components request failed: ${componentsResponse.status}`);
    }

    const componentsData = await componentsResponse.json();
    console.log(`   ✅ Created ${componentsData.count} components`);
    console.log(`   📝 Response: ${componentsData.message}`);

    // Extract component IDs for relationships
    const componentIds = componentsData.data.map(comp => comp.id);
    console.log(`   🔑 Component IDs: ${componentIds.slice(0, 3).join(', ')}`);

    // Test 2: Bulk create relationships
    console.log('\n2. 🔗 Testing bulk relationship creation...');
    const bulkRelationshipsPayload = {
      relationships: [
        {
          sourceId: componentIds[0], // UserService
          targetId: componentIds[1], // AuthService
          type: 'DEPENDS_ON',
          description: 'UserService depends on AuthService for authentication'
        },
        {
          sourceId: componentIds[0], // UserService
          targetId: componentIds[2], // DatabaseService
          type: 'DEPENDS_ON',
          description: 'UserService depends on DatabaseService for data persistence'
        },
        {
          sourceId: componentIds[1], // AuthService
          targetId: componentIds[2], // DatabaseService
          type: 'DEPENDS_ON',
          description: 'AuthService depends on DatabaseService for user credentials'
        }
      ]
    };

    const relationshipsResponse = await fetch(`${BASE_URL}/api/relationships/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulkRelationshipsPayload)
    });

    if (!relationshipsResponse.ok) {
      throw new Error(`Relationships request failed: ${relationshipsResponse.status}`);
    }

    const relationshipsData = await relationshipsResponse.json();
    console.log(`   ✅ Created ${relationshipsData.count} relationships`);
    console.log(`   📝 Response: ${relationshipsData.message}`);

    // Test 3: Bulk create tasks
    console.log('\n3. 📋 Testing bulk task creation...');
    const bulkTasksPayload = {
      tasks: [
        {
          title: 'Implement user registration',
          description: 'Add user registration functionality to UserService',
          status: 'TODO',
          priority: 'HIGH',
          relatedComponentIds: [componentIds[0]] // UserService
        },
        {
          title: 'Add JWT authentication',
          description: 'Implement JWT token-based authentication in AuthService',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          relatedComponentIds: [componentIds[1]] // AuthService
        },
        {
          title: 'Optimize database queries',
          description: 'Improve performance of database operations',
          status: 'TODO',
          priority: 'MEDIUM',
          relatedComponentIds: [componentIds[2]] // DatabaseService
        },
        {
          title: 'Integration testing',
          description: 'Create integration tests for all services',
          status: 'TODO',
          priority: 'MEDIUM',
          relatedComponentIds: componentIds // All services
        }
      ]
    };

    const tasksResponse = await fetch(`${BASE_URL}/api/tasks/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulkTasksPayload)
    });

    if (!tasksResponse.ok) {
      throw new Error(`Tasks request failed: ${tasksResponse.status}`);
    }

    const tasksData = await tasksResponse.json();
    console.log(`   ✅ Created ${tasksData.count} tasks`);
    console.log(`   📝 Response: ${tasksData.message}`);

    // Test 4: Verify created data
    console.log('\n4. 🔍 Verifying created data...');
    
    const allComponentsResponse = await fetch(`${BASE_URL}/api/components?codebase=test-app`);
    const allComponentsData = await allComponentsResponse.json();
    console.log(`   📦 Total components in test-app: ${allComponentsData.data.length}`);

    const allTasksResponse = await fetch(`${BASE_URL}/api/tasks`);
    const allTasksData = await allTasksResponse.json();
    console.log(`   📋 Total tasks: ${allTasksData.data.length}`);

    console.log('\n🎉 All bulk operations completed successfully!');
    
    // Performance comparison note
    console.log('\n💡 Performance Benefits:');
    console.log('   • Bulk operations use database transactions for consistency');
    console.log('   • Reduced HTTP overhead (3 requests vs 10+ individual requests)'); 
    console.log('   • Better error handling with rollback on failure');
    console.log('   • Single SSE event broadcast per bulk operation');

    console.log('\n📚 Usage Instructions for Agents:');
    console.log('   • Use POST /api/components/bulk for multiple components');
    console.log('   • Use POST /api/relationships/bulk for multiple relationships');
    console.log('   • Use POST /api/tasks/bulk for multiple tasks');
    console.log('   • Always prefer bulk operations when creating 2+ items');

  } catch (error) {
    console.error('\n❌ Error during bulk operations test:', error.message);
    process.exit(1);
  }
}

// Error handling for connection issues
async function testServerConnection() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    console.log('✅ Server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to server. Please ensure the HTTP server is running on port 3001.');
    console.error('   Start it with: HTTP_ONLY=true HTTP_PORT=3001 npm run start:http');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Bulk Operations Test Script');
  console.log('=====================================\n');

  if (await testServerConnection()) {
    await testBulkOperations();
  }
}

main().catch(console.error);
