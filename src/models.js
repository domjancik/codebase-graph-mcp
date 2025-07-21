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

// Proposed Node and Relationship Types
export const ProposedTypeStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export const ProposedTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['NODE', 'RELATIONSHIP']),
  status: z.nativeEnum(ProposedTypeStatus).default('PENDING'),
  votes: z.number().min(0).default(0),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
  approvalThreshold: z.number().min(1).default(3),
  rejectionThreshold: z.number().min(1).default(3),
  metadata: z.record(z.string()).default({})
});

export const VoteSchema = z.object({
  id: z.string().uuid(),
  proposedTypeId: z.string().uuid(),
  voterId: z.string(),
  voteType: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().optional(),
  votedAt: z.string().datetime()
});

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

export class ProposedType {
  constructor(data) {
    const validated = ProposedTypeSchema.parse(data);
    Object.assign(this, validated);
  }

  toNode() {
    return {
      labels: ['ProposedType'],
      properties: {
        id: this.id,
        name: this.name,
        description: this.description || '',
        type: this.type,
        status: this.status,
        votes: this.votes,
        createdBy: this.createdBy,
        createdAt: this.createdAt,
        approvalThreshold: this.approvalThreshold,
        rejectionThreshold: this.rejectionThreshold,
        ...this.metadata
      }
    };
  }

  // Check if proposal should be approved or rejected
  checkVoteStatus(approvalVotes, rejectionVotes) {
    if (approvalVotes >= this.approvalThreshold) {
      return 'APPROVED';
    }
    if (rejectionVotes >= this.rejectionThreshold) {
      return 'REJECTED';
    }
    return 'PENDING';
  }
}

export class Vote {
  constructor(data) {
    const validated = VoteSchema.parse(data);
    Object.assign(this, validated);
  }

  toNode() {
    return {
      labels: ['Vote'],
      properties: {
        id: this.id,
        proposedTypeId: this.proposedTypeId,
        voterId: this.voterId,
        voteType: this.voteType,
        reason: this.reason || '',
        votedAt: this.votedAt
      }
    };
  }
}
