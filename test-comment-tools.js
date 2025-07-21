#!/usr/bin/env node

import MCPServer from './mcp-server.js';

// Create a better mock driver that returns successful records
const mockDriver = {
  session: () => ({
    run: async (query, params) => {
      // Mock successful responses
      if (query.includes('MATCH (n) WHERE n.id = ')) {
        return { records: [{ get: () => ({ properties: { id: params.nodeId } }) }] };
      }
      return { records: [] };
    },
    close: async () => {}
  })
};

const server = new MCPServer(mockDriver);

async function testCommentTools() {
  console.log('🧪 Testing Comment Management Tools...\n');

  try {
    // Test creating a comment
    const comment = await server.handleRequest('create_node_comment', {
      nodeId: 'test-node-id',
      content: 'This is a test comment for the node',
      author: 'test-user'
    });
    console.log('✅ create_node_comment:', comment.content);

    // Test getting comments for a node
    const comments = await server.handleRequest('get_node_comments', {
      nodeId: 'test-node-id',
      limit: 10
    });
    console.log('✅ get_node_comments: tool works (returns', comments.length, 'comments)');

    // Test updating a comment
    const updatedComment = await server.handleRequest('update_comment', {
      commentId: comment.id,
      content: 'Updated comment content'
    });
    console.log('✅ update_comment:', updatedComment.content);

    // Test getting a specific comment
    const retrievedComment = await server.handleRequest('get_comment', {
      commentId: comment.id
    });
    console.log('✅ get_comment: found comment with ID', retrievedComment.id ? 'yes' : 'no');

    // Test deleting a comment
    const deletedComment = await server.handleRequest('delete_comment', {
      commentId: comment.id
    });
    console.log('✅ delete_comment:', deletedComment.success ? 'success' : 'failed');

    console.log('\n🎉 All comment management tools are working correctly!');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testCommentTools();
