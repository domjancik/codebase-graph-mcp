# Bulk Operations API

The Codebase Graph MCP HTTP server now supports bulk operations for efficiently creating multiple components, relationships, and tasks in single API calls. These operations are optimized for performance and consistency.

## Overview

Bulk operations are designed to:
- **Improve Performance**: Reduce HTTP overhead and database round-trips
- **Ensure Consistency**: Use database transactions with automatic rollback on errors
- **Provide Better Logging**: Track bulk operations in change history
- **Enable Real-time Updates**: Broadcast single SSE events for bulk operations

## Endpoints

### 1. Bulk Create Components

**Endpoint**: `POST /api/components/bulk`

Creates multiple components in a single transaction.

#### Request Format
```json
{
  "components": [
    {
      "name": "ComponentName",
      "type": "COMPONENT_TYPE",
      "codebase": "codebase-name",
      "description": "Optional description",
      "filePath": "/optional/file/path.js",
      "metadata": {
        "key": "value"
      }
    }
  ]
}
```

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "generated-uuid-1",
      "name": "ComponentName",
      "type": "COMPONENT_TYPE",
      "codebase": "codebase-name",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "message": "Successfully created 1 components"
}
```

### 2. Bulk Create Relationships

**Endpoint**: `POST /api/relationships/bulk`

Creates multiple relationships between components in a single transaction.

#### Request Format
```json
{
  "relationships": [
    {
      "sourceId": "source-component-uuid",
      "targetId": "target-component-uuid", 
      "type": "DEPENDS_ON",
      "description": "Optional relationship description",
      "metadata": {
        "strength": "strong"
      }
    }
  ]
}
```

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "generated-uuid-1",
      "sourceId": "source-component-uuid",
      "targetId": "target-component-uuid",
      "type": "DEPENDS_ON",
      "sourceName": "SourceComponent",
      "targetName": "TargetComponent",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "message": "Successfully created 1 relationships"
}
```

### 3. Bulk Create Tasks

**Endpoint**: `POST /api/tasks/bulk`

Creates multiple tasks in a single transaction.

#### Request Format
```json
{
  "tasks": [
    {
      "title": "Task Title",
      "description": "Task description",
      "status": "TODO",
      "priority": "HIGH",
      "relatedComponentIds": ["component-uuid-1", "component-uuid-2"],
      "metadata": {
        "estimatedHours": 8
      }
    }
  ]
}
```

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "generated-uuid-1",
      "title": "Task Title",
      "description": "Task description",
      "status": "TODO",
      "priority": "HIGH",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "message": "Successfully created 1 tasks"
}
```

## Usage Guidelines for Agents

### When to Use Bulk Operations

**Always prefer bulk operations when:**
- Creating 2 or more items of the same type
- Importing data from external sources
- Setting up initial project structures
- Creating test data or fixtures

**Example scenarios:**
- Analyzing a codebase and creating multiple components from discovered files
- Setting up dependency relationships between multiple services
- Creating a backlog of tasks from requirements analysis

### Performance Comparison

| Operation Type | Individual Calls | Bulk Operation | Improvement |
|---------------|------------------|----------------|-------------|
| HTTP Requests | 10 requests | 3 requests | 70% reduction |
| Database Transactions | 10 transactions | 3 transactions | 70% reduction |
| SSE Events | 10 events | 3 events | 70% reduction |
| Error Handling | Per-item failures | All-or-nothing | Better consistency |

### Error Handling

Bulk operations use database transactions with automatic rollback:
- If any item in the bulk fails, the entire operation is rolled back
- No partial states or data inconsistency
- Detailed error messages indicate which items caused failures

### Real-time Events

Bulk operations broadcast specialized SSE events:
- `components-bulk-created`
- `relationships-bulk-created` 
- `tasks-bulk-created`

These events include the full result set and count for efficient client updates.

## Code Examples

### Node.js/JavaScript Example

```javascript
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Bulk create components
async function createComponents(components) {
  const response = await fetch(`${BASE_URL}/api/components/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ components })
  });
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  
  return await response.json();
}

// Usage
const components = [
  { name: 'UserService', type: 'SERVICE', codebase: 'my-app' },
  { name: 'AuthService', type: 'SERVICE', codebase: 'my-app' },
  { name: 'DatabaseService', type: 'SERVICE', codebase: 'my-app' }
];

const result = await createComponents(components);
console.log(`Created ${result.count} components`);
```

### Python Example

```python
import requests
import json

BASE_URL = 'http://localhost:3001'

def create_components_bulk(components):
    response = requests.post(
        f'{BASE_URL}/api/components/bulk',
        headers={'Content-Type': 'application/json'},
        json={'components': components}
    )
    
    if not response.ok:
        raise Exception(f'Request failed: {response.status_code}')
    
    return response.json()

# Usage
components = [
    {'name': 'UserService', 'type': 'SERVICE', 'codebase': 'my-app'},
    {'name': 'AuthService', 'type': 'SERVICE', 'codebase': 'my-app'},
    {'name': 'DatabaseService', 'type': 'SERVICE', 'codebase': 'my-app'}
]

result = create_components_bulk(components)
print(f"Created {result['count']} components")
```

### cURL Example

```bash
# Bulk create components
curl -X POST http://localhost:3001/api/components/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "components": [
      {
        "name": "UserService",
        "type": "SERVICE", 
        "codebase": "my-app",
        "description": "User management service"
      },
      {
        "name": "AuthService",
        "type": "SERVICE",
        "codebase": "my-app", 
        "description": "Authentication service"
      }
    ]
  }'
```

## Testing

Run the included test script to verify bulk operations:

```bash
node test-bulk-operations.js
```

This script will:
1. Create 3 components in bulk
2. Create 3 relationships in bulk  
3. Create 4 tasks in bulk
4. Verify all data was created correctly
5. Show performance benefits and usage guidelines

## Best Practices

1. **Batch Size**: Keep bulk operations under 100 items for optimal performance
2. **Error Recovery**: Implement retry logic with exponential backoff
3. **Validation**: Validate data on the client side before sending bulk requests
4. **Monitoring**: Use SSE events to track bulk operation completion
5. **Documentation**: Always include meaningful descriptions in bulk data

## Migration from Individual Operations

If you're currently using individual API calls, here's how to migrate:

**Before:**
```javascript
for (const component of components) {
  await fetch('/api/components', {
    method: 'POST', 
    body: JSON.stringify(component)
  });
}
```

**After:**
```javascript
await fetch('/api/components/bulk', {
  method: 'POST',
  body: JSON.stringify({ components })
});
```

The bulk approach is significantly more efficient and provides better error handling.
