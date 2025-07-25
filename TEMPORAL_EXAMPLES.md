# Temporal Relationships - Practical Examples

## Build Pipeline Example

### Scenario: CI/CD Pipeline with Sequential Steps

```javascript
// Define build pipeline components
const components = [
  { id: 'lint', name: 'Code Linting', type: 'BUILD_STEP' },
  { id: 'test', name: 'Unit Tests', type: 'BUILD_STEP' },
  { id: 'build', name: 'Compile/Build', type: 'BUILD_STEP' },
  { id: 'integration', name: 'Integration Tests', type: 'BUILD_STEP' },
  { id: 'deploy-staging', name: 'Deploy to Staging', type: 'DEPLOYMENT' },
  { id: 'e2e-tests', name: 'E2E Tests', type: 'TEST' },
  { id: 'deploy-prod', name: 'Deploy to Production', type: 'DEPLOYMENT' }
];

// Create temporal relationships showing build order
const buildSequence = [
  {
    type: 'PRECEDES',
    sourceId: 'lint',
    targetId: 'test',
    timeOrder: 1,
    probability: 1.0,
    reasoning: 'Linting must pass before running tests'
  },
  {
    type: 'PRECEDES', 
    sourceId: 'test',
    targetId: 'build',
    timeOrder: 2,
    probability: 1.0,
    reasoning: 'Tests must pass before building artifacts'
  },
  {
    type: 'PRECEDES',
    sourceId: 'build',
    targetId: 'integration',
    timeOrder: 3,
    probability: 1.0,
    reasoning: 'Build artifacts needed for integration tests'
  },
  {
    type: 'PRECEDES',
    sourceId: 'integration',
    targetId: 'deploy-staging',
    timeOrder: 4,
    probability: 1.0,
    reasoning: 'Integration tests must pass before staging deployment'
  },
  {
    type: 'PRECEDES',
    sourceId: 'deploy-staging',
    targetId: 'e2e-tests',
    timeOrder: 5,
    probability: 1.0,
    reasoning: 'E2E tests run against staging environment'
  },
  {
    type: 'PRECEDES',
    sourceId: 'e2e-tests',
    targetId: 'deploy-prod',
    timeOrder: 6,
    probability: 1.0,
    reasoning: 'Production deployment only after successful E2E tests'
  }
];

// Create parallel processes (concurrent execution)
const parallelSteps = [
  {
    type: 'CONCURRENT',
    sourceId: 'lint',
    targetId: 'security-scan',
    timeOrder: 1,
    probability: 1.0,
    reasoning: 'Linting and security scanning can run in parallel'
  }
];
```

## Microservices Architecture Example

### Scenario: Service Dependencies with Confidence Levels

```javascript
const microservices = [
  { id: 'user-service', name: 'User Management Service', type: 'SERVICE' },
  { id: 'auth-service', name: 'Authentication Service', type: 'SERVICE' },
  { id: 'api-gateway', name: 'API Gateway', type: 'SERVICE' },
  { id: 'notification-service', name: 'Notification Service', type: 'SERVICE' },
  { id: 'payment-service', name: 'Payment Service', type: 'SERVICE' },
  { id: 'order-service', name: 'Order Service', type: 'SERVICE' }
];

const serviceDependencies = [
  {
    type: 'DEPENDS_ON',
    sourceId: 'api-gateway',
    targetId: 'auth-service',
    probability: 1.0,
    reasoning: 'API Gateway requires auth service for token validation'
  },
  {
    type: 'DEPENDS_ON',
    sourceId: 'user-service',
    targetId: 'auth-service',
    probability: 0.9,
    reasoning: 'User service likely calls auth for some operations (inferred from logs)'
  },
  {
    type: 'DEPENDS_ON',
    sourceId: 'order-service',
    targetId: 'payment-service',
    probability: 0.95,
    reasoning: 'Order processing requires payment verification (confirmed in code)'
  },
  {
    type: 'DEPENDS_ON',
    sourceId: 'order-service',
    targetId: 'notification-service',
    probability: 0.7,
    reasoning: 'Orders may trigger notifications (observed in traces, not in code)'
  }
];
```

## Database Migration Example

### Scenario: Schema Evolution with Migration Order

```javascript
const migrations = [
  { id: 'create-users', name: 'Create Users Table', type: 'MIGRATION' },
  { id: 'create-roles', name: 'Create Roles Table', type: 'MIGRATION' },
  { id: 'add-user-roles', name: 'Add User-Role Relations', type: 'MIGRATION' },
  { id: 'add-indexes', name: 'Add Performance Indexes', type: 'MIGRATION' },
  { id: 'migrate-legacy', name: 'Migrate Legacy Data', type: 'MIGRATION' },
  { id: 'cleanup', name: 'Remove Legacy Columns', type: 'MIGRATION' }
];

const migrationOrder = [
  {
    type: 'PRECEDES',
    sourceId: 'create-users',
    targetId: 'create-roles',
    timeOrder: 1,
    probability: 1.0,
    reasoning: 'Base tables must exist before relationship tables'
  },
  {
    type: 'PRECEDES',
    sourceId: 'create-roles',
    targetId: 'add-user-roles',
    timeOrder: 2,
    probability: 1.0,
    reasoning: 'Both parent tables required for junction table'
  },
  {
    type: 'PRECEDES',
    sourceId: 'add-user-roles',
    targetId: 'migrate-legacy',
    timeOrder: 3,
    probability: 1.0,
    reasoning: 'Schema must be complete before data migration'
  },
  {
    type: 'PRECEDES',
    sourceId: 'migrate-legacy',
    targetId: 'add-indexes',
    timeOrder: 4,
    probability: 0.8,
    reasoning: 'Add indexes after data migration for better performance'
  },
  {
    type: 'PRECEDES',
    sourceId: 'migrate-legacy',
    targetId: 'cleanup',
    timeOrder: 5,
    probability: 1.0,
    reasoning: 'Cannot remove legacy columns until data is migrated'
  }
];
```

## Frontend Component Dependency Example

### Scenario: React Component Loading Order

```javascript
const frontendComponents = [
  { id: 'auth-provider', name: 'Authentication Provider', type: 'COMPONENT' },
  { id: 'theme-provider', name: 'Theme Provider', type: 'COMPONENT' },
  { id: 'router', name: 'Application Router', type: 'COMPONENT' },
  { id: 'navbar', name: 'Navigation Bar', type: 'COMPONENT' },
  { id: 'dashboard', name: 'Dashboard Page', type: 'COMPONENT' },
  { id: 'user-profile', name: 'User Profile Page', type: 'COMPONENT' }
];

const componentDependencies = [
  {
    type: 'PRECEDES',
    sourceId: 'theme-provider',
    targetId: 'navbar',
    timeOrder: 1,
    probability: 1.0,
    reasoning: 'Theme context must be available before components render'
  },
  {
    type: 'PRECEDES',
    sourceId: 'auth-provider',
    targetId: 'router',
    timeOrder: 1,
    probability: 1.0,
    reasoning: 'Auth context needed for protected route evaluation'
  },
  {
    type: 'CONCURRENT',
    sourceId: 'theme-provider',
    targetId: 'auth-provider',
    timeOrder: 1,
    probability: 1.0,
    reasoning: 'Providers can initialize simultaneously'
  },
  {
    type: 'DEPENDS_ON',
    sourceId: 'dashboard',
    targetId: 'auth-provider',
    probability: 1.0,
    reasoning: 'Dashboard requires authentication state'
  },
  {
    type: 'DEPENDS_ON',
    sourceId: 'user-profile',
    targetId: 'auth-provider',
    probability: 1.0,
    reasoning: 'User profile needs authenticated user data'
  }
];
```

## API Version Evolution Example

### Scenario: API Deprecation and Migration

```javascript
const apiVersions = [
  { id: 'api-v1', name: 'API Version 1.0', type: 'API_VERSION' },
  { id: 'api-v2', name: 'API Version 2.0', type: 'API_VERSION' },
  { id: 'api-v3', name: 'API Version 3.0', type: 'API_VERSION' },
  { id: 'client-mobile', name: 'Mobile Client', type: 'CLIENT' },
  { id: 'client-web', name: 'Web Client', type: 'CLIENT' },
  { id: 'client-partner', name: 'Partner Integration', type: 'CLIENT' }
];

const apiEvolution = [
  {
    type: 'FOLLOWS',
    sourceId: 'api-v2',
    targetId: 'api-v1',
    timeOrder: 2,
    probability: 1.0,
    reasoning: 'V2 released after V1 with backward compatibility'
  },
  {
    type: 'FOLLOWS',
    sourceId: 'api-v3',
    targetId: 'api-v2',
    timeOrder: 3,
    probability: 1.0,
    reasoning: 'V3 is latest version with breaking changes'
  },
  {
    type: 'DEPENDS_ON',
    sourceId: 'client-mobile',
    targetId: 'api-v2',
    probability: 0.9,
    reasoning: 'Mobile client mostly uses V2 endpoints (confirmed in analytics)'
  },
  {
    type: 'DEPENDS_ON',
    sourceId: 'client-web',
    targetId: 'api-v3',
    probability: 0.8,
    reasoning: 'Web client migrated to V3 (observed in recent deployments)'
  },
  {
    type: 'DEPENDS_ON',
    sourceId: 'client-partner',
    targetId: 'api-v1',
    probability: 0.7,
    reasoning: 'Partner still on V1 (needs confirmation with partner team)'
  }
];
```

## Data Processing Pipeline Example

### Scenario: ETL Pipeline with Complex Dependencies

```javascript
const dataProcessing = [
  { id: 'extract-orders', name: 'Extract Order Data', type: 'ETL_STEP' },
  { id: 'extract-customers', name: 'Extract Customer Data', type: 'ETL_STEP' },
  { id: 'validate-data', name: 'Data Validation', type: 'ETL_STEP' },
  { id: 'transform-orders', name: 'Transform Orders', type: 'ETL_STEP' },
  { id: 'enrich-customer', name: 'Enrich Customer Data', type: 'ETL_STEP' },
  { id: 'load-warehouse', name: 'Load to Data Warehouse', type: 'ETL_STEP' },
  { id: 'update-analytics', name: 'Update Analytics Tables', type: 'ETL_STEP' }
];

const pipelineFlow = [
  // Parallel extraction
  {
    type: 'CONCURRENT',
    sourceId: 'extract-orders',
    targetId: 'extract-customers',
    timeOrder: 1,
    probability: 1.0,
    reasoning: 'Order and customer extraction can run in parallel'
  },
  // Both extractions must complete before validation
  {
    type: 'PRECEDES',
    sourceId: 'extract-orders',
    targetId: 'validate-data',
    timeOrder: 2,
    probability: 1.0,
    reasoning: 'All data must be extracted before validation'
  },
  {
    type: 'PRECEDES',
    sourceId: 'extract-customers',
    targetId: 'validate-data',
    timeOrder: 2,
    probability: 1.0,
    reasoning: 'All data must be extracted before validation'
  },
  // Parallel transformation after validation
  {
    type: 'PRECEDES',
    sourceId: 'validate-data',
    targetId: 'transform-orders',
    timeOrder: 3,
    probability: 1.0,
    reasoning: 'Data must be validated before transformation'
  },
  {
    type: 'PRECEDES',
    sourceId: 'validate-data',
    targetId: 'enrich-customer',
    timeOrder: 3,
    probability: 1.0,
    reasoning: 'Data must be validated before enrichment'
  },
  {
    type: 'CONCURRENT',
    sourceId: 'transform-orders',
    targetId: 'enrich-customer',
    timeOrder: 3,
    probability: 1.0,
    reasoning: 'Order transformation and customer enrichment can run in parallel'
  },
  // Final loading steps
  {
    type: 'PRECEDES',
    sourceId: 'transform-orders',
    targetId: 'load-warehouse',
    timeOrder: 4,
    probability: 1.0,
    reasoning: 'Transformed data required for warehouse loading'
  },
  {
    type: 'PRECEDES',
    sourceId: 'enrich-customer',
    targetId: 'load-warehouse',
    timeOrder: 4,
    probability: 1.0,
    reasoning: 'Enriched data required for warehouse loading'
  },
  {
    type: 'PRECEDES',
    sourceId: 'load-warehouse',
    targetId: 'update-analytics',
    timeOrder: 5,
    probability: 1.0,
    reasoning: 'Analytics update requires warehouse data to be loaded'
  }
];
```

## Using the Examples

### Step 1: Create Components

```javascript
// Create all components first
for (const component of components) {
  await server.createComponent(component);
}
```

### Step 2: Create Temporal Relationships

```javascript
// Create relationships with temporal properties
await server.createRelationshipsBulk({ relationships: temporalRelationships });
```

### Step 3: Query and Visualize

```javascript
// Get timeline view of a process
const pipelineRelationships = await server.getComponentRelationships({
  componentId: 'lint',
  direction: 'outgoing'
});

// Sort by time order to see sequence
const orderedSteps = pipelineRelationships
  .filter(rel => rel.timeOrder)
  .sort((a, b) => a.timeOrder - b.timeOrder);

console.log('Pipeline execution order:');
orderedSteps.forEach(rel => {
  console.log(`${rel.timeOrder}: ${rel.target.name} (${rel.probability * 100}% confidence)`);
  console.log(`   Reason: ${rel.reasoning}`);
});
```

## Best Practices from Examples

1. **Use consistent time ordering**: Start from 1, use increments of 1 or 10
2. **Set probability based on evidence**: 1.0 for confirmed, 0.7-0.9 for inferred
3. **Provide clear reasoning**: Reference source of information
4. **Use appropriate relationship types**: PRECEDES for sequence, CONCURRENT for parallel
5. **Document assumptions**: Especially for lower probability relationships

These examples demonstrate how temporal properties provide rich context for understanding system behavior, dependencies, and evolution over time.
