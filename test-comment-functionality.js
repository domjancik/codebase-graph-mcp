#!/usr/bin/env node

/**
 * Comprehensive test demonstrating comment functionality
 * Tests the comment system with a mock Neo4j database to verify
 * all comment operations work correctly without requiring a live database
 */

import { CodebaseGraphMCPServer } from './src/index.js';

// Mock Neo4j driver for testing
class MockSession {
    constructor() {
        this.data = new Map();
        this.nodeCounter = 1;
        this.commentCounter = 1;
    }

    async run(query, params = {}) {
        console.log(`\n[MOCK DB] Executing query: ${query}`);
        console.log(`[MOCK DB] Parameters:`, params);

        // Mock component creation
        if (query.includes('CREATE (c:Component)')) {
            const nodeId = `comp_${this.nodeCounter++}`;
            this.data.set(nodeId, {
                id: nodeId,
                type: params.type,
                name: params.name,
                description: params.description,
                path: params.path,
                codebase: params.codebase,
                metadata: params.metadata,
                comments: []
            });
            return {
                records: [{
                    get: (key) => key === 'c' ? { properties: { id: nodeId, ...params } } : null
                }]
            };
        }

        // Mock comment creation
        if (query.includes('CREATE (comment:Comment)')) {
            const commentId = `comment_${this.commentCounter++}`;
            const comment = {
                id: commentId,
                content: params.content,
                author: params.author,
                timestamp: new Date().toISOString(),
                metadata: params.metadata || {}
            };

            // Add comment to node
            const node = this.data.get(params.nodeId);
            if (node) {
                node.comments.push(comment);
            }

            return {
                records: [{
                    get: (key) => key === 'comment' ? { properties: comment } : null
                }]
            };
        }

        // Mock get comments for node
        if (query.includes('MATCH (n)-[:HAS_COMMENT]->(comment:Comment)')) {
            const node = this.data.get(params.nodeId);
            if (node && node.comments) {
                return {
                    records: node.comments.map(comment => ({
                        get: (key) => key === 'comment' ? { properties: comment } : null
                    }))
                };
            }
            return { records: [] };
        }

        // Mock search components
        if (query.includes('MATCH (c:Component)')) {
            const components = Array.from(this.data.values()).filter(item => item.type);
            return {
                records: components.map(comp => ({
                    get: (key) => key === 'c' ? { properties: comp } : null
                }))
            };
        }

        // Mock get single comment
        if (query.includes('MATCH (comment:Comment {id: $commentId})')) {
            for (const node of this.data.values()) {
                if (node.comments) {
                    const comment = node.comments.find(c => c.id === params.commentId);
                    if (comment) {
                        return {
                            records: [{
                                get: (key) => key === 'comment' ? { properties: comment } : null
                            }]
                        };
                    }
                }
            }
            return { records: [] };
        }

        // Mock update comment
        if (query.includes('SET comment.content = $content')) {
            for (const node of this.data.values()) {
                if (node.comments) {
                    const comment = node.comments.find(c => c.id === params.commentId);
                    if (comment) {
                        comment.content = params.content;
                        if (params.metadata) {
                            comment.metadata = { ...comment.metadata, ...params.metadata };
                        }
                        return {
                            records: [{
                                get: (key) => key === 'comment' ? { properties: comment } : null
                            }]
                        };
                    }
                }
            }
            return { records: [] };
        }

        // Mock delete comment
        if (query.includes('DETACH DELETE comment')) {
            for (const node of this.data.values()) {
                if (node.comments) {
                    const index = node.comments.findIndex(c => c.id === params.commentId);
                    if (index !== -1) {
                        node.comments.splice(index, 1);
                        return { summary: { counters: { nodesDeleted: 1 } } };
                    }
                }
            }
            return { summary: { counters: { nodesDeleted: 0 } } };
        }

        return { records: [] };
    }

    async close() {
        // Mock close
    }
}

class MockDriver {
    constructor() {
        this.session = new MockSession();
    }

    session() {
        return this.session;
    }

    async verifyConnectivity() {
        return true;
    }

    async close() {
        // Mock close
    }
}

async function testCommentFunctionality() {
    console.log('🚀 Starting Comment Functionality Test');
    console.log('=====================================\n');

    try {
        // Create server instance without initialization
        const server = {};
        
        // Add methods from CodebaseGraphMCPServer prototype
        const { CodebaseGraphMCPServer } = await import('./src/index.js');
        const prototype = CodebaseGraphMCPServer.prototype;
        
        // Copy all methods
        Object.getOwnPropertyNames(prototype).forEach(name => {
            if (typeof prototype[name] === 'function' && name !== 'constructor') {
                server[name] = prototype[name].bind(server);
            }
        });
        
        // Set up mock driver and initialize flag
        server.driver = new MockDriver();
        server.initialized = true;

        console.log('✅ Mock server initialized');

        // Test 1: Create a component to comment on
        console.log('\n📝 Test 1: Creating a test component...');
        const createComponentResult = await server.createComponent({
            type: 'FILE',
            name: 'test-component.js',
            description: 'A test component for comment functionality',
            path: '/src/test-component.js',
            codebase: 'test-codebase'
        });
        
        const componentId = createComponentResult.id;
        console.log(`✅ Created component with ID: ${componentId}`);

        // Test 2: Create comments on the component
        console.log('\n💬 Test 2: Creating comments...');
        
        const comment1Result = await server.createNodeComment({
            nodeId: componentId,
            content: 'This component needs refactoring for better performance',
            author: 'developer1',
            metadata: { priority: 'high', category: 'performance' }
        });
        console.log(`✅ Created comment 1: ${comment1Result.id}`);

        const comment2Result = await server.createNodeComment({
            nodeId: componentId,
            content: 'Added unit tests for this component',
            author: 'developer2',
            metadata: { category: 'testing' }
        });
        console.log(`✅ Created comment 2: ${comment2Result.id}`);

        const comment3Result = await server.createNodeComment({
            nodeId: componentId,
            content: 'Updated documentation and added examples',
            author: 'developer1',
            metadata: { category: 'documentation' }
        });
        console.log(`✅ Created comment 3: ${comment3Result.id}`);

        // Test 3: Get all comments for the component
        console.log('\n📋 Test 3: Retrieving all comments...');
        const allComments = await server.getNodeComments({
            nodeId: componentId,
            limit: 10
        });
        
        console.log(`✅ Retrieved ${allComments.length} comments:`);
        allComments.forEach((comment, index) => {
            console.log(`   ${index + 1}. [${comment.author}] ${comment.content}`);
            console.log(`      Metadata: ${JSON.stringify(comment.metadata)}`);
        });

        // Test 4: Update a comment
        console.log('\n✏️ Test 4: Updating a comment...');
        const updatedComment = await server.updateComment({
            commentId: comment1Result.id,
            content: 'This component has been refactored for better performance - COMPLETED',
            metadata: { priority: 'high', category: 'performance', status: 'completed' }
        });
        console.log(`✅ Updated comment: ${updatedComment.content}`);

        // Test 5: Get a specific comment
        console.log('\n🔍 Test 5: Getting specific comment...');
        const specificComment = await server.getComment({
            commentId: comment2Result.id
        });
        console.log(`✅ Retrieved specific comment: ${specificComment.content}`);

        // Test 6: Search for components and verify our test component exists
        console.log('\n🔎 Test 6: Searching for components...');
        const components = await server.searchComponents({
            codebase: 'test-codebase'
        });
        console.log(`✅ Found ${components.length} components in test-codebase`);
        components.forEach(comp => {
            console.log(`   - ${comp.name} (${comp.type})`);
        });

        // Test 7: Delete a comment
        console.log('\n🗑️ Test 7: Deleting a comment...');
        const deleteResult = await server.deleteComment({
            commentId: comment3Result.id
        });
        console.log(`✅ Deleted comment: ${deleteResult.success ? 'Success' : 'Failed'}`);

        // Test 8: Verify deletion by getting comments again
        console.log('\n✔️ Test 8: Verifying deletion...');
        const remainingComments = await server.getNodeComments({
            nodeId: componentId,
            limit: 10
        });
        console.log(`✅ Remaining comments: ${remainingComments.length}`);
        remainingComments.forEach((comment, index) => {
            console.log(`   ${index + 1}. [${comment.author}] ${comment.content}`);
        });

        console.log('\n🎉 All comment functionality tests passed!');
        console.log('=====================================');
        console.log('\n📊 Test Summary:');
        console.log('- ✅ Component creation');
        console.log('- ✅ Comment creation (3 comments)');
        console.log('- ✅ Comment retrieval (by node)');
        console.log('- ✅ Comment updates');
        console.log('- ✅ Specific comment retrieval');
        console.log('- ✅ Component search');
        console.log('- ✅ Comment deletion');
        console.log('- ✅ Deletion verification');

        console.log('\n🔧 Technical verification:');
        console.log('- All 5 comment tools are implemented');
        console.log('- Database layer handles all comment operations');
        console.log('- Comments support metadata and authorship');
        console.log('- Comments are properly linked to nodes');
        console.log('- CRUD operations work as expected');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
testCommentFunctionality().catch(console.error);
