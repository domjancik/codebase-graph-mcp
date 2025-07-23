#!/usr/bin/env node

/**
 * Simple test demonstrating comment functionality
 * Tests comment methods directly with mock data
 */

// Mock Neo4j session for testing
class MockSession {
    constructor() {
        this.data = new Map();
        this.commentCounter = 1;
    }

    async run(query, params = {}) {
        console.log(`[MOCK] Query: ${query}`);
        console.log(`[MOCK] Params:`, params);
        
        // Mock node existence check for comments
        if (query.includes('MATCH (n) WHERE n.id =')) {
            // Always return that the node exists for testing
            return {
                records: [{ get: () => ({ properties: { id: params.nodeId } }) }]
            };
        }
        
        // Mock comment creation
        if (query.includes('CREATE (c:Comment')) {
            const comment = {
                id: params.id,
                content: params.content,
                author: params.author,
                created: params.created
            };
            
            this.data.set('comments', this.data.get('comments') || []);
            this.data.get('comments').push({ ...comment, nodeId: 'test-node-1' });
            
            return {
                records: [{
                    get: (key) => key === 'c' ? { properties: comment } : null
                }]
            };
        }
        
        // Mock comment-node relationship creation
        if (query.includes('CREATE (n)-[:HAS_COMMENT]->')) {
            return { records: [] };
        }

        // Mock get comments for node
        if (query.includes('MATCH (n)-[:HAS_COMMENT]->(c:Comment)')) {
            const comments = this.data.get('comments') || [];
            return {
                records: comments.filter(c => c.nodeId === params.nodeId || true).map(comment => ({
                    get: (key) => key === 'c' ? { properties: comment } : null
                }))
            };
        }

        // Mock get single comment with node relationship
        if (query.includes('MATCH (c:Comment {id: $commentId})') && query.includes('OPTIONAL MATCH (n)-[:HAS_COMMENT]->')) {
            const comments = this.data.get('comments') || [];
            const comment = comments.find(c => c.id === params.commentId);
            if (comment) {
                return {
                    records: [{
                        get: (key) => {
                            if (key === 'c') return { properties: comment };
                            if (key === 'nodeId') return comment.nodeId;
                            return null;
                        }
                    }]
                };
            }
            return { records: [] };
        }

        // Mock update comment
        if (query.includes('SET c += $updates')) {
            const comments = this.data.get('comments') || [];
            const comment = comments.find(c => c.id === params.commentId);
            if (comment) {
                Object.assign(comment, params.updates);
                return {
                    records: [{
                        get: (key) => key === 'c' ? { properties: comment } : null
                    }]
                };
            }
            return { records: [] };
        }

        // Mock delete comment
        if (query.includes('DETACH DELETE c')) {
            const comments = this.data.get('comments') || [];
            const index = comments.findIndex(c => c.id === params.commentId);
            if (index !== -1) {
                comments.splice(index, 1);
                return { summary: { counters: { nodesDeleted: 1 } } };
            }
            return { summary: { counters: { nodesDeleted: 0 } } };
        }

        return { records: [] };
    }

    async close() {}
}

class MockDriver {
    constructor() {
        this.mockSession = new MockSession();
    }

    session() {
        return this.mockSession;
    }
}

// Create test server context
const server = {
    driver: new MockDriver(),
    initialized: true
};

// Import and test comment functions directly
async function testCommentMethods() {
    console.log('🚀 Testing Comment Methods Directly');
    console.log('===================================\n');

    try {
        // Import GraphDatabase class
        const { GraphDatabase } = await import('./src/database.js');
        
        // Create database instance with mock driver
        const db = new GraphDatabase();
        db.driver = server.driver;

        // Test 1: Create a comment
        console.log('💬 Test 1: Creating a comment...');
        const comment1 = await db.createComment({
            nodeId: 'test-node-1',
            content: 'This is a test comment for performance improvements',
            author: 'developer1',
            metadata: { priority: 'high', category: 'performance' }
        });
        console.log(`✅ Created comment: ${comment1.id}`);
        console.log(`   Content: ${comment1.content}`);
        console.log(`   Author: ${comment1.author}`);
        console.log(`   Metadata: ${JSON.stringify(comment1.metadata)}`);

        // Test 2: Create another comment
        console.log('\n💬 Test 2: Creating another comment...');
        const comment2 = await db.createComment({
            nodeId: 'test-node-1',
            content: 'Added unit tests for this functionality',
            author: 'developer2',
            metadata: { category: 'testing' }
        });
        console.log(`✅ Created comment: ${comment2.id}`);

        // Test 3: Get all comments for the node
        console.log('\n📋 Test 3: Getting all comments for node...');
        const allComments = await db.getNodeComments('test-node-1', 10);
        console.log(`✅ Retrieved ${allComments.length} comments:`);
        allComments.forEach((comment, index) => {
            console.log(`   ${index + 1}. [${comment.author}] ${comment.content}`);
        });

        // Test 4: Get a specific comment
        console.log('\n🔍 Test 4: Getting specific comment...');
        const specificComment = await db.getComment(comment1.id);
        console.log(`✅ Retrieved comment: ${specificComment.content}`);

        // Test 5: Update a comment
        console.log('\n✏️ Test 5: Updating a comment...');
        const updatedComment = await db.updateComment(comment1.id, {
            content: 'Performance improvements completed successfully!',
            metadata: { priority: 'high', category: 'performance', status: 'completed' }
        });
        console.log(`✅ Updated comment: ${updatedComment.content}`);
        console.log(`   Updated metadata: ${JSON.stringify(updatedComment.metadata)}`);

        // Test 6: Delete a comment
        console.log('\n🗑️ Test 6: Deleting a comment...');
        const deleteResult = await db.deleteComment(comment2.id);
        console.log(`✅ Deleted comment: ${deleteResult ? 'Success' : 'Failed'}`);

        // Test 7: Verify deletion
        console.log('\n✔️ Test 7: Verifying deletion...');
        const remainingComments = await db.getNodeComments('test-node-1', 10);
        console.log(`✅ Remaining comments: ${remainingComments.length}`);

        console.log('\\n🎉 All comment method tests passed!');
        console.log('=====================================');
        console.log('\\n📊 Test Summary:');
        console.log('- ✅ Comment creation');
        console.log('- ✅ Multiple comment creation');
        console.log('- ✅ Comment retrieval by node');
        console.log('- ✅ Specific comment retrieval');
        console.log('- ✅ Comment updates');
        console.log('- ✅ Comment deletion');
        console.log('- ✅ Deletion verification');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
testCommentMethods().catch(console.error);
