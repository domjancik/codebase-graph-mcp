# Temporal Relationships Guide

## Overview

The MCP (Model Context Protocol) system now supports temporal properties for relationships between components. This feature allows you to capture time-based dependencies, probabilistic connections, and reasoning behind relationships in your codebase graph.

## Temporal Properties

### 1. Time Order (`timeOrder`)

**Type:** `number`  
**Optional:** Yes  
**Description:** Represents the sequential order or temporal position of a relationship.

**Usage Examples:**
- `1, 2, 3...` for sequential dependencies
- `0` for simultaneous/concurrent relationships
- Negative values for reverse chronological order
- Decimal values for fine-grained ordering (e.g., `1.5` between steps 1 and 2)

**Use Cases:**
- Build pipeline stages
- Data processing workflows
- Event sequencing
- Deployment order

### 2. Probability (`probability`)

**Type:** `number` (0.0 - 1.0)  
**Optional:** Yes  
**Description:** Indicates the confidence level or likelihood of the relationship being accurate/relevant.

**Value Ranges:**
- `1.0` - Certain/confirmed relationship
- `0.8-0.9` - High confidence
- `0.5-0.7` - Moderate confidence
- `0.2-0.4` - Low confidence
- `0.0` - Uncertain/speculative

**Use Cases:**
- Code analysis confidence scores
- Dependency uncertainty
- Refactoring impact assessment
- Architecture decision confidence

### 3. Reasoning (`reasoning`)

**Type:** `string`  
**Optional:** Yes  
**Description:** Human-readable explanation of why the relationship exists or was established.

**Best Practices:**
- Keep explanations concise but informative
- Include source of information (analysis tool, manual review, etc.)
- Reference specific code patterns or architectural decisions
- Update reasoning when relationships change

**Example Values:**
- "Identified through static analysis of import statements"
- "Manual review shows data flow dependency"
- "Inferred from shared configuration files"
- "Temporal dependency based on build order requirements"

## Temporal Relationship Types

The system includes specific relationship types for temporal connections:

### PRECEDES
- Indicates that the source component must execute/exist before the target
- Often used with `timeOrder` to show sequence
- Example: Build step A precedes deployment step B

### FOLLOWS
- Indicates that the source component comes after the target
- Inverse of PRECEDES relationship
- Example: Integration tests follow unit tests

### CONCURRENT
- Indicates components that operate simultaneously
- Often used with `timeOrder: 0` or same time values
- Example: Parallel microservices or concurrent processes

## API Usage

### Creating Temporal Relationships

```javascript
// Create a temporal relationship with all properties
await server.createRelationship({
  type: 'PRECEDES',
  sourceId: 'component-a-id',
  targetId: 'component-b-id',
  timeOrder: 1,
  probability: 0.95,
  reasoning: 'Build dependency identified in package.json'
});

// Create with partial temporal data
await server.createRelationship({
  type: 'DEPENDS_ON',
  sourceId: 'frontend-id',
  targetId: 'api-id',
  probability: 0.8,
  reasoning: 'API calls detected in frontend code'
});
```

### Bulk Creation

```javascript
const relationships = [
  {
    type: 'PRECEDES',
    sourceId: 'step1',
    targetId: 'step2',
    timeOrder: 1,
    probability: 1.0,
    reasoning: 'Sequential build process'
  },
  {
    type: 'PRECEDES',
    sourceId: 'step2',
    targetId: 'step3',
    timeOrder: 2,
    probability: 1.0,
    reasoning: 'Sequential build process'
  }
];

await server.createRelationshipsBulk({ relationships });
```

### Querying Relationships

```javascript
// Get relationships for a component (includes temporal data)
const relationships = await server.getComponentRelationships({
  componentId: 'my-component-id',
  direction: 'both'
});

// Each relationship includes temporal properties if set
relationships.forEach(rel => {
  console.log(`Type: ${rel.type}`);
  console.log(`Time Order: ${rel.timeOrder || 'Not set'}`);
  console.log(`Probability: ${rel.probability || 'Not set'}`);
  console.log(`Reasoning: ${rel.reasoning || 'Not set'}`);
});
```

## Database Schema

Temporal properties are stored as optional fields on relationship edges in Neo4j:

```cypher
// Example relationship with temporal properties
(source:Component)-[r:PRECEDES {
  id: "rel-123",
  created: datetime(),
  timeOrder: 1,
  probability: 0.95,
  reasoning: "Build dependency identified in package.json"
}]->(target:Component)
```

## Frontend Integration

### Visualization Features

- **Time Order Display**: Relationships show sequential numbering when `timeOrder` is present
- **Probability Indicators**: Visual confidence indicators (color coding, opacity)
- **Reasoning Tooltips**: Hover to see relationship explanations
- **Temporal Filtering**: Filter relationships by time order or probability ranges

### Filter Controls

The graph visualizer includes filter controls for temporal properties:

```javascript
// Filter by time order range
filterTimeOrder(minOrder, maxOrder)

// Filter by probability threshold  
filterProbability(minProbability)

// Show only relationships with reasoning
showOnlyDocumentedRelationships()
```

## Best Practices

### 1. Consistent Time Ordering
- Use consistent numbering schemes within related workflows
- Leave gaps between numbers for future insertions (10, 20, 30 vs 1, 2, 3)
- Document your time ordering conventions

### 2. Meaningful Probabilities
- Base probabilities on actual confidence levels, not arbitrary values
- Update probabilities as you gain more information
- Use probability ranges consistently across your project

### 3. Clear Reasoning
- Always provide reasoning for non-obvious relationships
- Reference the source of your information
- Update reasoning when relationship changes

### 4. Temporal Type Usage
- Use PRECEDES/FOLLOWS for clear sequential dependencies
- Use CONCURRENT for parallel or simultaneous relationships
- Combine with standard types (DEPENDS_ON, USES, etc.) as appropriate

## Migration from Legacy Relationships

Existing relationships without temporal properties remain fully functional. Temporal properties are additive and optional:

```javascript
// Legacy relationship (still works)
{ type: 'DEPENDS_ON', sourceId: 'a', targetId: 'b' }

// Enhanced with temporal properties
{ 
  type: 'DEPENDS_ON', 
  sourceId: 'a', 
  targetId: 'b',
  probability: 0.9,
  reasoning: 'Confirmed through code analysis'
}
```

## Troubleshooting

### Common Issues

1. **Time Order Conflicts**: Ensure time orders are unique within logical sequences
2. **Probability Validation**: Values must be between 0.0 and 1.0
3. **Performance**: Large reasoning strings may impact query performance
4. **Consistency**: Maintain consistent temporal property usage across your project

### Debugging

Use the change history to track temporal property updates:

```javascript
const history = await server.getChangeHistory({
  operation: 'CREATE_RELATIONSHIP',
  limit: 100
});
```

## Version History

- **v1.0**: Initial temporal properties implementation
- Added `timeOrder`, `probability`, and `reasoning` fields
- Introduced temporal relationship types (PRECEDES, FOLLOWS, CONCURRENT)
- Frontend visualization and filtering support
- Backward compatibility with existing relationships

---

For technical support or feature requests, refer to the MCP server documentation or submit an issue to the project repository.
