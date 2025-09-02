# Note Ingestion Recipe for AI Agents

## 🎯 Purpose
Consistently transform unstructured notes into structured, actionable component graphs.

## 📝 Step-by-Step Process

### 1. Create Main Note (NOTE type)
```javascript
call_mcp_tool("create_component", {
  "type": "NOTE",
  "name": "[Descriptive name for the note]",
  "description": "[Brief summary of note contents]",
  "codebase": "[relevant-codebase]",
  "metadata": {
    "content_type": "brainstorming|mixed|planning",
    "original_note": "[full original text]",
    "topics": "[comma-separated key topics]",
    "priority": "[high|medium|low|mixed]"
  }
})
```

### 2. Analyze & Identify Components
Scan for distinct concepts and categorize:
- **IDEAS**: Initial thoughts, concepts, "what if" scenarios
- **FEATURES**: Actionable development tasks  
- **SPECIFICATIONS**: Decisions, standards, requirements
- **DOCUMENTS**: Formal documentation needs
- **USER_STORIES**: User-focused requirements
- **REQUIREMENTS**: Formal system requirements

### 3. Create Derived Components (Bulk)
```javascript
call_mcp_tool("create_components_bulk", {
  "components": [
    {
      "type": "IDEA",
      "name": "[Idea name]",
      "description": "[What the idea entails]",
      "metadata": {"feasibility": "unknown|low|medium|high", "priority": "..."}
    },
    {
      "type": "FEATURE",
      "name": "[Actionable task name]",
      "description": "[What needs to be built/done]",
      "metadata": {"estimated_effort": "X hours", "task_type": "research|implementation|analysis"}
    }
    // ... more components
  ]
})
```

### 4. Create Relationships (Bulk)
```javascript
call_mcp_tool("create_relationships_bulk", {
  "relationships": [
    // Main note contains ideas/concepts
    {"type": "CONTAINS", "sourceId": "[note-id]", "targetId": "[idea-id]"},
    
    // Ideas derive actionable items
    {"type": "DERIVES_FROM", "sourceId": "[idea-id]", "targetId": "[feature-id]"},
    
    // Dependencies between tasks
    {"type": "DEPENDS_ON", "sourceId": "[task-id]", "targetId": "[prerequisite-id]"},
    
    // Support relationships
    {"type": "SUPPORTS", "sourceId": "[supporting-id]", "targetId": "[supported-id]"}
  ]
})
```

### 5. Add Context Comment
```javascript
call_mcp_tool("create_node_comment", {
  "nodeId": "[main-note-id]",
  "author": "user",
  "content": "Original user prompt: [original request]\n\nnote:\n[full original note text]"
})
```

## 🏷️ Component Type Selection Guide

| Content Type | Use Component Type |
|--------------|-------------------|
| Random thoughts, brainstorming | **NOTE** |
| "What if we..." or "Maybe..." | **IDEA** |
| Specific tasks to implement | **FEATURE** |
| Decisions to make, standards | **SPECIFICATION** |
| User needs, stories | **USER_STORY** |
| Formal system needs | **REQUIREMENT** |
| Documentation plans | **DOCUMENT** |
| Test scenarios | **TEST_CASE** |

## ⚡ Common Relationship Patterns

- NOTE **CONTAINS** → IDEAS/CONCEPTS
- IDEA **DERIVES_FROM** → FEATURES/SPECIFICATIONS  
- FEATURE **DEPENDS_ON** → OTHER FEATURES/ANALYSIS
- RESEARCH **SUPPORTS** → IDEAS/FEATURES
- SPECIFICATION **REFINES** → REQUIREMENTS
- DOCUMENT **TRACES_TO** → FEATURES/REQUIREMENTS

## ✅ Quality Checklist

- [ ] Main note preserves original content
- [ ] Each distinct concept has its own component
- [ ] Component types match content semantics
- [ ] All major concepts are connected to main note
- [ ] Dependencies are properly modeled
- [ ] Original user context is preserved in comments
- [ ] Metadata includes useful categorization

## 🚀 Pro Tips

1. **Preserve Uncertainty**: Use metadata to capture "shrug shrug" or unclear aspects
2. **Granular Decomposition**: Better to have many small focused components than few large ones
3. **Use Bulk Operations**: More efficient for multiple components/relationships
4. **Meaningful Names**: Component names should be self-explanatory
5. **Track Relationships**: Don't just create components - show how they connect!

## 📋 Example Workflow

Given a note: *"want to set up API monitoring, maybe use Prometheus? also need to document the architecture"*

1. **Main Note**: "API Monitoring & Documentation Planning" (NOTE)
2. **Components**:
   - "API Monitoring Implementation" (IDEA) 
   - "Prometheus Integration" (IDEA)
   - "Architecture Documentation" (DOCUMENT)
   - "Research Monitoring Solutions" (FEATURE)
3. **Relationships**:
   - Note CONTAINS both ideas
   - Ideas DERIVE_FROM research task
   - Documentation TRACES_TO monitoring implementation

## 🔄 Version History

- v1.0: Initial recipe with 5-step process and type guidelines
