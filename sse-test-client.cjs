const { EventSource } = require('eventsource');
const fetch = require('node-fetch');

const SSE_URL = 'http://localhost:3001/events';
const API_BASE = 'http://localhost:3001';

console.log('=== SSE MCP Test Client ===');
console.log('Connecting to SSE server at:', SSE_URL);

// Test 1: Basic SSE Connection
const eventSource = new EventSource(SSE_URL);
let messageCount = 0;
let heartbeatCount = 0;

eventSource.onopen = () => {
  console.log('✅ SSE Connection opened successfully');
};

eventSource.onmessage = (event) => {
  messageCount++;
  console.log(`📨 Message #${messageCount}:`, event.data);
  
  try {
    const data = JSON.parse(event.data);
    if (data.timestamp) {
      console.log('   📅 Timestamp:', new Date(data.timestamp).toISOString());
    }
    if (data.clientId) {
      console.log('   🆔 Client ID:', data.clientId);
    }
  } catch (e) {
    console.log('   📝 Raw data:', event.data);
  }
};

eventSource.addEventListener('connected', (event) => {
  console.log('🔗 Connected event received:', event.data);
});

eventSource.addEventListener('heartbeat', (event) => {
  heartbeatCount++;
  console.log(`💓 Heartbeat #${heartbeatCount}:`, event.data);
});

eventSource.onerror = (err) => {
  console.error('❌ SSE Error occurred:', err);
};

// Test 2: API Health Check
setTimeout(async () => {
  console.log('\n=== Testing API Endpoints ===');
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}, 2000);

// Test 3: Get Components
setTimeout(async () => {
  try {
    const componentsResponse = await fetch(`${API_BASE}/components`);
    const response = await componentsResponse.json();
    if (response.success) {
      console.log('✅ Components fetched:', response.data.length, 'items');
      console.log('   📦 Sample component:', response.data[0]?.name || 'No components found');
    } else {
      console.log('❌ Components fetch returned error:', response.error);
    }
  } catch (error) {
    console.error('❌ Components fetch failed:', error.message);
  }
}, 3000);

// Test 4: Get Tasks
setTimeout(async () => {
  try {
    const tasksResponse = await fetch(`${API_BASE}/api/tasks`);
    const response = await tasksResponse.json();
    if (response.success) {
      console.log('✅ Tasks fetched:', response.data.length, 'items');
    } else {
      console.log('❌ Tasks fetch returned error:', response.error);
    }
  } catch (error) {
    console.error('❌ Tasks fetch failed:', error.message);
  }
}, 4000);

// Test 5: Test both /components and /api/components paths
setTimeout(async () => {
  try {
    console.log('\n=== Testing Path Consistency ===');
    const [directPath, apiPath] = await Promise.all([
      fetch(`${API_BASE}/components`).then(r => r.json()),
      fetch(`${API_BASE}/api/components`).then(r => r.json())
    ]);
    
    console.log('✅ Direct /components:', directPath.success ? `${directPath.data.length} items` : 'Failed');
    console.log('✅ API /api/components:', apiPath.success ? `${apiPath.data.length} items` : 'Failed');
    
    if (directPath.success && apiPath.success) {
      console.log('   🔗 Both paths return same data:', directPath.data.length === apiPath.data.length ? 'Yes' : 'No');
    }
  } catch (error) {
    console.error('❌ Path consistency test failed:', error.message);
  }
}, 5000);

// Cleanup after 35 seconds (enough to see heartbeats)
setTimeout(() => {
  console.log('\n=== Test Summary ===');
  console.log(`📊 Total messages received: ${messageCount}`);
  console.log(`💓 Heartbeats received: ${heartbeatCount}`);
  console.log('🔚 Closing connection...');
  eventSource.close();
  process.exit(0);
}, 35000);

process.on('SIGINT', () => {
  console.log('\n🛑 Interrupted by user');
  console.log(`📊 Total messages received: ${messageCount}`);
  console.log(`💓 Heartbeats received: ${heartbeatCount}`);
  eventSource.close();
  process.exit(0);
});
