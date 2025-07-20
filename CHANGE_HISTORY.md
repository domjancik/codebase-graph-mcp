# Change History & Replay System

## Overview

The Codebase Graph MCP server includes a comprehensive change history tracking and replay system that enables:

- **Full Audit Trail**: Every database operation is recorded with before/after states
- **Time Travel**: Replay database state to any point in time
- **Snapshots**: Create and restore point-in-time database backups
- **Change Analysis**: Understand patterns and evolution of your codebase
- **Safe Experimentation**: Test changes with rollback capabilities

## Architecture

### Core Components

1. **ChangeHistory Class** (`src/history.js`)
   - Tracks all database operations
   - Stores change events in Neo4j graph
   - Provides replay and analysis capabilities

2. **Change Events** (Neo4j nodes)
   - `:ChangeEvent` nodes with full operation details
   - Before/after states as JSON
   - Timestamps, user info, and metadata

3. **Snapshots** (Neo4j nodes)  
   - `:Snapshot` nodes with complete database state
   - Named snapshots with descriptions
   - Compressed storage of all entities

## Change Tracking

### What Gets Tracked

Every operation on these entities is automatically tracked:

- **Components**: Create, Update, Delete
- **Relationships**: Create, Delete  
- **Tasks**: Create, Update Status

### Change Event Structure

```javascript
{
  id: "uuid",
  operation: "CREATE_COMPONENT|UPDATE_COMPONENT|DELETE_COMPONENT|...",
  entityType: "COMPONENT|TASK|RELATIONSHIP", 
  entityId: "target-entity-id",
  beforeState: {...}, // State before change (null for create)
  afterState: {...},  // State after change (null for delete)
  timestamp: "2025-07-20T19:00:00.000Z",
  sessionId: "session-identifier",
  userId: "user-identifier", 
  source: "mcp-server",
  // ... additional metadata
}
```

## MCP Tools

### 1. `get_change_history`

Get change history for a specific entity or recent changes across all entities.

```javascript
// Get history for a specific component
{
  "entityId": "component-uuid",
  "limit": 50
}

// Get recent changes across all entities  
{
  "limit": 100,
  "operation": "CREATE_COMPONENT" // optional filter
}
```

### 2. `create_snapshot` 

Create a named snapshot of the current database state.

```javascript
{
  "name": "Before refactoring authentication",
  "description": "Snapshot before major auth system changes"
}
```

### 3. `list_snapshots`

List all available snapshots with metadata.

```javascript
{} // No parameters needed
```

### 4. `restore_snapshot`

Restore database from a snapshot (destructive operation).

```javascript
{
  "snapshotId": "snapshot-uuid",
  "dryRun": false // Set to true to see what would happen
}
```

### 5. `replay_to_timestamp`

Replay all changes up to a specific timestamp (destructive operation).

```javascript
{
  "timestamp": "2025-07-20T18:00:00.000Z",
  "dryRun": true // Highly recommended for first attempt
}
```

### 6. `get_history_stats`

Get statistics about change history and usage patterns.

```javascript
{} // No parameters needed
```

## Usage Examples

### Track Component Evolution

```javascript
// 1. Create a component
await createComponent({
  type: 'CLASS',
  name: 'UserService', 
  codebase: 'my-app'
});

// 2. Update it several times
await updateComponent(componentId, { description: 'Handles user auth' });
await updateComponent(componentId, { version: '2.0' });

// 3. View its complete history
await getChangeHistory({ entityId: componentId });
```

### Safe Experimentation Workflow

```javascript
// 1. Create a snapshot before experimenting
await createSnapshot({ 
  name: 'Before experimental changes',
  description: 'Safe point to return to'
});

// 2. Make experimental changes
await createComponent({ type: 'FILE', name: 'experimental.js' });
await createRelationship({ type: 'DEPENDS_ON', ... });

// 3. If things go wrong, restore the snapshot
await restoreSnapshot({ 
  snapshotId: snapshotId,
  dryRun: false 
});
```

### Time Travel Debugging

```javascript
// 1. Find when an issue was introduced
await getChangeHistory({ limit: 1000 });

// 2. Replay to state just before the issue  
await replayToTimestamp({ 
  timestamp: '2025-07-20T15:30:00.000Z',
  dryRun: true // Check what would happen first
});

// 3. If looks good, actually do the replay
await replayToTimestamp({ 
  timestamp: '2025-07-20T15:30:00.000Z', 
  dryRun: false
});
```

### Change Analysis

```javascript
// Get overall statistics
await getHistoryStats();
// Returns: total changes, changes by operation type, changes by day

// Find all changes in a time range
await getChangeHistory({ 
  // Get all changes from last hour
  limit: 1000
});

// Track specific operation types
await getChangeHistory({ 
  operation: 'DELETE_COMPONENT',
  limit: 50
});
```

## Advanced Features

### Session Tracking

Changes can be grouped by session for related operations:

```javascript
const sessionId = 'refactor-auth-2025-07-20';
await createComponent(componentData, { sessionId });
await createRelationship(relData, { sessionId });

// Later, view all changes from that session
await getSessionChanges(sessionId);
```

### Metadata Enrichment

Add custom metadata to change events:

```javascript
await createComponent(componentData, {
  sessionId: 'migration-v2',
  userId: 'alice',
  reason: 'Performance optimization',
  ticketId: 'JIRA-123'
});
```

### Dry Run Operations

Always test destructive operations first:

```javascript
// Safe: see what would happen
const result = await replayToTimestamp({ 
  timestamp: targetTime,
  dryRun: true 
});
console.log(result.changes); // Shows what would be replayed

// Only if satisfied with dry run results:
await replayToTimestamp({ 
  timestamp: targetTime, 
  dryRun: false 
});
```

## Best Practices

### 1. Snapshot Strategy
- Create snapshots before major changes
- Use descriptive names and descriptions
- Regular snapshots for important milestones
- Clean up old snapshots periodically

### 2. Time Travel Safety
- Always use `dryRun: true` first
- Understand replay will DELETE current state
- Coordinate with team before major replays
- Have backups of important data

### 3. Change Analysis
- Review history before making related changes
- Use change stats to understand system evolution
- Track patterns in component modifications
- Monitor for unexpected changes

### 4. Performance Considerations
- Change history grows over time
- Large replays can be slow
- Consider archiving old change events
- Limit history queries with reasonable limits

## Troubleshooting

### Common Issues

**Change events not appearing**
- Verify history schema is initialized
- Check that operations go through tracked methods
- Look for error messages in server logs

**Replay failures**
- Ensure target timestamp is valid
- Check that all referenced entities exist in history  
- Verify no circular dependencies in replay order

**Snapshot restore issues**
- Confirm snapshot exists and is valid
- Check for schema conflicts
- Ensure sufficient database permissions

**Performance problems**
- Reduce history query limits
- Archive old change events
- Consider indexed queries for large datasets

### Monitoring

Monitor change history with these queries:

```cypher
// Recent activity
MATCH (c:ChangeEvent) 
WHERE c.timestamp > datetime() - duration('PT1H')
RETURN count(*)

// Top operations
MATCH (c:ChangeEvent)
RETURN c.operation, count(*) as count
ORDER BY count DESC

// Active sessions  
MATCH (c:ChangeEvent)
WHERE c.timestamp > datetime() - duration('P1D')
RETURN c.sessionId, count(*) as changes
ORDER BY changes DESC
```

## Integration with Development Workflow

### Git-like Operations
- Snapshots = Git commits
- Replay = Git reset --hard
- Change history = Git log
- Dry run = Git diff/status

### CI/CD Integration
- Create snapshots before deployments
- Replay for rollbacks
- Change analysis for impact assessment
- Automated testing with known states

### Team Collaboration
- Shared snapshots for team checkpoints
- Change history for code review context
- Session tracking for feature work
- Analytics for team productivity

This change history system provides a powerful foundation for understanding, debugging, and safely evolving your codebase graph over time.
