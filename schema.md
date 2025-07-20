# Codebase Graph MCP: Core Data Models

## Component Model
```
Component {
  id: UUID
  type: ComponentType
  name: String
  description: String
  metadata: Map<String, String>
}
```

## Relationship Model
```
Relationship {
  id: UUID
  type: RelationshipType
  source: Component
  target: Component
  details: Map<String, String>
}
```

## Task/Goal Model
```
Task {
  id: UUID
  name: String
  description: String
  status: TaskStatus
  relatedComponents: List<Component>
  progress: Float
}
```

### Enumerations

#### ComponentType
- FILE
- FUNCTION
- CLASS
- MODULE
- SYSTEM

#### RelationshipType
- DEPENDS_ON
- IMPLEMENTS
- EXTENDS
- CONTAINS

#### TaskStatus
- TODO
- IN_PROGRESS
- DONE

## Schema Considerations
- Abstraction levels are organized under ComponentType
- Relationships express dependencies and hierarchies
- Tasks link to components, reflecting goals and progress
