import { z } from 'zod';

// Enums
export const ComponentType = {
  FILE: 'FILE',
  FUNCTION: 'FUNCTION',
  CLASS: 'CLASS',
  MODULE: 'MODULE',
  SYSTEM: 'SYSTEM',
  INTERFACE: 'INTERFACE',
  VARIABLE: 'VARIABLE',
  CONSTANT: 'CONSTANT'
};

export const RelationshipType = {
  DEPENDS_ON: 'DEPENDS_ON',
  IMPLEMENTS: 'IMPLEMENTS',
  EXTENDS: 'EXTENDS',
  CONTAINS: 'CONTAINS',
  CALLS: 'CALLS',
  IMPORTS: 'IMPORTS',
  EXPORTS: 'EXPORTS',
  OVERRIDES: 'OVERRIDES',
  USES: 'USES',
  CREATES: 'CREATES'
};

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED'
};

// Zod Schemas for validation
export const ComponentSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(ComponentType),
  name: z.string().min(1),
  description: z.string().optional(),
  path: z.string().optional(),
  codebase: z.string().optional(),
  metadata: z.record(z.string()).default({})
});

export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(RelationshipType),
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  details: z.record(z.string()).default({})
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus),
  progress: z.number().min(0).max(1).default(0),
  relatedComponentIds: z.array(z.string().uuid()).default([]),
  metadata: z.record(z.string()).default({})
});

// Type definitions
export class Component {
  constructor(data) {
    const validated = ComponentSchema.parse(data);
    Object.assign(this, validated);
  }

  toNode() {
    return {
      labels: ['Component', this.type],
      properties: {
        id: this.id,
        type: this.type,
        name: this.name,
        description: this.description || '',
        path: this.path || '',
        codebase: this.codebase || '',
        ...this.metadata
      }
    };
  }
}

export class Relationship {
  constructor(data) {
    const validated = RelationshipSchema.parse(data);
    Object.assign(this, validated);
  }

  toRelation() {
    return {
      type: this.type,
      properties: {
        id: this.id,
        ...this.details
      }
    };
  }
}

export class Task {
  constructor(data) {
    const validated = TaskSchema.parse(data);
    Object.assign(this, validated);
  }

  toNode() {
    return {
      labels: ['Task'],
      properties: {
        id: this.id,
        name: this.name,
        description: this.description || '',
        status: this.status,
        progress: this.progress,
        ...this.metadata
      }
    };
  }
}
